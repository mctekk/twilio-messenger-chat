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
            <div class="chat-side__action-container"
                :class="{'showing-filters': showFilters}"
                @click="showFilters=!showFilters">
                <i class="fa fa-sliders-h"></i>
            </div>

            </div>
            <div class="chat-side__filters" v-if="showFilters">
                <button
                    v-for="(filter, filterName) in filters"
                    class="btn btn-tab"
                    :class="{selected: selectedFilter == filterName}"
                    :key="filterName"
                    @click="selectedFilter = filterName"
                >
                    {{ filter.label }}
                </button>
            </div>
          </div>

        <div class="chat-side__list chat-scroller">
            <template v-if="!isLoading">
                <chat-side-item
                    v-for="channel in filteredChannels"
                    :key="channel.sid"
                    :channel="channel"
                    :channel-data="channelData[channel.sid]"
                    :user-context="userContext"
                    :active-channel="activeChannel"
                    @click="$emit('click', channel)"
                >
                </chat-side-item>
            </template>
           <chat-loading v-else>

           </chat-loading>
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
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: false,
    },
    channels: {
      type: Array,
      required: true,
    },
    userContext: {
      type: Object,
      required: true,
    },
    activeChannel: {
      type: Object,
      default() {
        return {};
      },
    },
    isExpanded: {
      type: Boolean,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: true,
    },

  },
  data() {
    return {
      channelData: {},
      search: "",
      showFilters: false,
      selectedFilter: 'all',
      filters: {
          all: {
              value: 'all',
              label: "All Messages",
              field: ''
          },
          active: {
              label: 'Active',
              value: 0,
              field: 'status'
          },
          won: {
              label: 'Won',
              value: 1,
              field: 'status'
          },
          lost: {
              label: 'Lost',
              value: 2,
              field: 'status'
          }
      },
      addNewChat: false,
    };
  },
  watch: {
    channels: {
      handler(channels, oldChannels) {
        const hasChangedLength =
          (channels && channels.length && !oldChannels) ||
          (channels && oldChannels && channels.length != oldChannels.length);
        if (hasChangedLength) {
          channels.forEach((channel) => {
            if (channel) {
              this.unlistenChannel(channel);
              this.$set(this.channelData, channel.sid, {});
              this.listenChannel(channel);
            }
          });
        }
      },
      immediate: true,
    },
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
        return this.channels.filter(channel => channel.lastMessage && (selectedFilter == "all" || channel.attributes.status == selectedFilter))
        .sort((a, b) => {
            const dateCreatedA = a.lastMessage
            ? a.lastMessage.dateCreated.toISOString()
            : "";
          const dateCreatedB = b.lastMessage
            ? b.lastMessage.dateCreated.toISOString()
            : "";
          return dateCreatedA > dateCreatedB ? -1 : 1;
        });
    },

    filteredChannels() {
        const options = {
            // isCaseSensitive: false,
            // includeScore: false,
            // shouldSort: true,
            // includeMatches: false,
            // findAllMatches: false,
            // minMatchCharLength: 1,
            // location: 0,
            threshold: 0.2,
            distance: 50,
            // useExtendedSearch: false,
            // ignoreLocation: false,
            // ignoreFieldNorm: false,
            keys: [
                "friendlyName"
            ]
        };

        const fuse = new Fuse(this.visibleChannels, options);
        return !this.search ? this.visibleChannels : fuse.search(this.search || "").map( item => item.item)
    },
    profileImage() {
        return this.userContext.user.attributes ? this.userContext.user.attributes.photoUrl : "";
    }
  },
  beforeDestroy() {
    this.channels.forEach((channel) => {
      this.unlistenChannel(channel);
    });
  },
  created() {
    this.$root.$on("chat-opened", (sid) => {
      const channel = this.channels.find((channel) => channel.sid == sid);
      if (channel) {
        this.updateMembers(channel);
      }
    });
  },
  methods: {
    updateMembers(channel) {
      channel.getMembers().then(members => {
        this.$set(this.channelData[channel.sid], "members", members);

        members.map((member, index) => {
            member.getUser().then(user => {
                const userAttributes =  user.attributes;
                if (this.channelData[channel.sid].members[index]) {
                    this.$set(this.channelData[channel.sid].members[index], 'userAttributes', userAttributes)
                } else {
                    member.userAttributes = userAttributes;
                    this.channelData[channel.sid].members.push(member);
                }
            });
        })

        this.updateUnread(channel);
      });
    },

    listenChannel(channel) {
      this.getLastMessage(channel, true);
      this.updateMembers(channel);
      channel.on("messageAdded", (message) =>
        this.getLastMessage(channel, false, message)
      );
      channel.on("memberUpdated", () => this.updateMembers(channel));
    },

    unlistenChannel(channel) {
      channel.removeListener("messageAdded", this.getLastMessage);
      channel.removeListener("updated", () => {})
      channel.removeListener("memberUpdated", () =>
        this.updateMembers(channel)
      );
    },

    getLastMessage(channel, initial, message) {
      if (!message || message.channel.sid == channel.sid) {
        channel.getMessages(1).then((messages) => {
          this.$set(
            this.channelData[channel.sid],
            "lastMessage",
            messages.items.length ? messages.items[0] : {}
          );

          this.updateUnread(channel);
        });
      }
    },

    listenTyping(channel) {
      channel.on("typingStarted", (member) => {
        member.getUser().then((user) => {
          this.typing.push(user.friendlyName || member.identity);
        });
      });
      channel.on("typingEnded", (member) => {
        member.getUser().then((user) => {
          this.typing = this.typing.filter(
            (userName) =>
              !userName.includes(user.friendlyName || member.identity)
          );
        });
      });
    },

    async getSender(channel) {
      if (channel.members) {
        const members = await channel.getMembers();
        return members.find(
          (member) => member.identity == this.userContext.identity
        );
      }
    },

    getSenderImage() {
        return this.sender ? this.sender.userAttributes.imageUrl : ""
    },

    async updateUnread(channel) {
      let unreadMessages = 0;
      const sender = await this.getSender(channel);
      const isDifferentChannel = !this.activeChannel || this.activeChannel.sid != channel.sid;
      if ( this.channelData[channel.sid].lastMessage && sender && isDifferentChannel ) {
         //   If the message doesnt come from him
          if (this.channelData[channel.sid].lastMessage.author !== sender.identity) {
            unreadMessages = this.channelData[channel.sid].lastMessage.index - sender.lastConsumedMessageIndex || 0;
            this.$set(this.channelData[channel.sid], "unreadMessages", unreadMessages);
            return unreadMessages;
          }
      }

    },
  },
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
          &:active, &:focus {
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
