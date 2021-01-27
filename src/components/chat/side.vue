<template>
  <div class="chat-side">
    <chat-header
      v-if="mobileDisplay || showHeader"
      :profile-image="profileImage"
      :show-back-button="false"
      :show-settings="true"
      :left-icon="!addNewChat ? 'fa fa-menu' : 'fa fa-chevron-left'"
      :right-icon="!isExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"
      :title="headerTitle"
      @settings="$emit('update:is-expanded', !isExpanded)"
    >
    </chat-header>
    <template v-if="!addNewChat && isExpanded">
      <div class="chat-side__body">
        <div class="chat-side__header">
          <div class="chat-side__search">
            <i class="fa fa-search"></i>
            <input
              class="seach-input"
              type="text"
              placeholder="Search ..."
              v-model="search"
            />
            <div
              class="chat-side__action-container"
              :class="{ 'showing-filters': showFilters }"
              @click="showFilters = !showFilters"
            >
              <i class="fa fa-sliders-h"></i>
            </div>
          </div>
          <div class="chat-side__filters" v-if="showFilters">
            <button
              v-for="(filter, filterName) in filters"
              class="btn btn-tab"
              :class="{ selected: selectedFilter == filterName }"
              :key="filterName"
              @click="selectedFilter = filterName"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <div class="chat-side__list chat-scroller">
          <template v-if="filteredChannels.length || !isLoading">
                  <template v-for="channel in filteredChannels">
                    <chat-side-item
                        :key="channel.sid"
                        :channel-descriptor="channel"
                        :channel-data="channelData[channel.sid]"
                        :user-context="userContext"
                        :active-channel="activeChannel"
                        @update-unread="updateUnread"
                        @click="$emit('click', channel)"
                    >
                    </chat-side-item>
                </template>
          </template>
          <chat-loading v-else> </chat-loading>
        </div>
      </div>
    </template>
    <template v-else-if="isExpanded">
      <div
        v-for="contact in contacts"
        :key="contact.email"
        @click="$emit('create-or-join', contact)"
        class="border-b-2 border-gray-400 mx-5 pl-10 px-2 py-5 text-left cursor-pointer hover:bg-gray-400"
      >
        {{ contact.email }}
      </div>
    </template>
  </div>
</template>

<script>
import ChatHeader from "./header";
import ChatSideItem from "./side-list-item";
import Fuse from "fuse.js";
import ChatLoading from "./loading";

export default {
  name: "ChatSider",

  components: {
    ChatHeader,
    ChatSideItem,
    ChatLoading
  },

  props: {
    mobileDisplay: {
      type: Boolean,
      default: false
    },
    showHeader: {
      type: Boolean,
      default: false
    },
    channels: {
      type: Array,
      required: true
    },
    userContext: {
      type: Object,
      required: true
    },
    activeChannel: {
      type: Object,
      default() {
        return {};
      }
    },
    isExpanded: {
      type: Boolean,
      required: true
    },
    isLoading: {
      type: Boolean,
      required: true
    }
  },

  data() {
    return {
      channelData: {},
      search: "",
      showFilters: false,
      selectedFilter: "all",
      filters: {
        all: {
          value: "all",
          label: "All Messages",
          field: "status"
        },
        active: {
          label: "Active",
          value: 0,
          field: "status"
        },
        won: {
          label: "Won",
          value: 1,
          field: "status"
        },
        lost: {
          label: "Lost",
          value: 2,
          field: "status"
        }
      },
      addNewChat: false
    };
  },

  beforeDestroy() {
      this.channelData.forEach((data) =>{
          this.unlistenChannel(data.channel);
      })
  },

  watch: {
    channels: {
      handler(channels, oldChannels) {
        const firstLoad = channels && channels.length && !oldChannels;
        const hasMoreChannels = channels && oldChannels && channels.length != oldChannels.length;


            if (firstLoad || hasMoreChannels) {
                channels.forEach(async channelDescriptor => {
                if(!this.channelData[channelDescriptor.sid]) {
                    this.$set(this.channelData, channelDescriptor.sid, {});
                };

                const localChannel = this.channelData[channelDescriptor.sid];

                if (!localChannel.channel) {
                    const channel = await channelDescriptor.getChannel();
                    this.$set(this.channelData, channel.sid, { channel: channel });
                }
            });
            }
      },
      immediate: true
    }
  },

  computed: {
    headerTitle() {
      const unreadMessageHTML = this.unreadMessages
        ? `<span class="head-indicator">${this.unreadMessages} </span>`
        : "";
      return `Messaging ${unreadMessageHTML}`;
    },

    unreadMessages() {
      return Object.values(this.channelData).reduce((sum, channel) => {
        sum += Number(channel.unreadMessages || 0);
        return sum;
      }, 0);
    },

    visibleChannels() {
      const selectedFilter = this.filters[this.selectedFilter].value;
      return this.channels
        .filter(
          channel => channel.lastMessage || (channel.messagesCount && (selectedFilter == "all" || channel.attributes.status == selectedFilter))
        )
        .sort((a, b) => {
          return a.descriptor.date_created > b.descriptor.date_created ? -1 : 1;
        });
    },

    filteredChannels() {
      const options = {
        threshold: 0.2,
        distance: 50,
        keys: ["friendlyName"]
      };

      const fuse = new Fuse(this.visibleChannels, options);
      return !this.search ? this.visibleChannels : fuse.search(this.search || "").map(item => item.item);
    },

    profileImage() {
      return this.userContext.user.attributes ? this.userContext.user.attributes.photoUrl : "";
    }
  },

  methods: {
    listenTyping(channel) {
      channel.on("typingStarted", member => {
        member.getUser().then(user => {
          this.typing.push(user.friendlyName || member.identity);
        });
      });

      channel.on("typingEnded", member => {
        member.getUser().then(user => {
          this.typing = this.typing.filter(
            userName => !userName.includes(user.friendlyName || member.identity)
          );
        });
      });
    },

    async getSender(members) {
      if (members) {
        return members.find(member => member.identity == this.userContext.identity);
      }
    },

    async updateUnread(channel, members, lastMessage) {
      let unreadMessages = 0;
      const sender = await this.getSender(members);
      const localChannel = this.channelData[channel.sid];
      const isDifferentChannel = !this.activeChannel || this.activeChannel.sid != channel.sid;
      if (lastMessage && sender && isDifferentChannel) {
        //   If the message doesnt come from him
        if (lastMessage.author !== sender.identity) {
          unreadMessages = lastMessage.index - sender.lastConsumedMessageIndex || 0;
          if (localChannel) {
              this.$set(localChannel, "unreadMessages", unreadMessages);return unreadMessages;
          }
        }
      }
    },

    listenChannel(channel) {
      this.getLastMessage(channel, true);
      this.updateMembers(channel);
      channel.on("messageAdded", message =>
        this.getLastMessage(channel, false, message)
      );
      channel.on("memberUpdated", () => this.updateMembers(channel));
    },

    unlistenChannel(channel) {
        channel.removeListener("messageAdded", this.getLastMessage);
        channel.removeListener("updated", () => {});
        channel.removeListener("memberUpdated", () =>
            this.updateMembers(this.channel)
        );
    },

    updateMembers(channel) {
      channel.getMembers().then(members => {
        this.$set(this.channelData, "members", members);
        this.members = members;

        members.map((member, index) => {
          member.getUser().then(user => {
            const userAttributes = user.attributes;
            if (this.members[index]) {
              this.$set(this.members[index], "userAttributes", userAttributes);
            } else {
              member.userAttributes = userAttributes;
              this.channelData.members.push(member);
            }
          });
        });

        this.$emit('update-unread', channel, members, this.lastMessage)
      });
    },

    getLastMessage(channel, initial, message) {
        if (!message || message.channel.sid == channel.sid) {
            channel.getMessages(1).then(messages => {
                if (messages.items.length && (!this.lastMessage || this.lastMessage.body != messages.items[0].body)) {
                    this.lastMessage = messages.items.length ? messages.items[0] : {};
                    this.$set(this.channelData[channel.sid], "lastMessage", this.lastMessage);
                    this.$emit('update-unread', channel, this.members)
                }
            });
        }
    },
  }
};
</script>

<style lang="scss">
.chat-side {
  display: flex;
  height: 100%;
  flex-direction: column;

  &__search {
    height: 38px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 15px 10px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    color: #777;
    position: relative;
    overflow: hidden;
    input {
      height: 36px;
      border: none;
      width: 100%;
      padding: 0 15px;
      font-size: 16px;

      &:focus {
        outline: none;
      }
    }
  }

  &__action-container {
    height: 100%;
    width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: -15px;
    cursor: pointer;

    &.showing-filters {
      font-weight: bolder;
      color: #333;
      background: #e4e4e4;
    }
  }

  &__filters {
    width: 100%;
    display: flex;

    .btn-tab {
      width: 100%;
      border-radius: 0 0 0 0;
      &:active,
      &:focus {
        box-shadow: none;
      }
      &.selected {
        background: #cacaca;
        font-weight: bold;
      }
    }
  }

  &__body {
    height: 91%;
    display: flex;
    flex-direction: column;
  }

  &__list {
    height: 100%;
    overflow: auto;
  }
}

.head-indicator {
  width: 20px;
  margin-left: 4px;
  height: 20px;
  font-size: 12px;
  border: 1px solid white;
  background: transparentize(red, 0.2) !important;
  color: white;
  font-weight: bold;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
}
</style>
