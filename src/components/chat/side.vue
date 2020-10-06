<template>
  <div class="chat-side">
    <chat-header
      v-if="mobileDisplay || showHeader"
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
        <div class="chat-side__search border-b-2 border-gray-700 h-16 py-4">
          <i class="fa fa-search"></i>
          <input
            class="seach-input"
            type="text"
            placeholder="Search ..."
            v-model="search"
          />
          <i class="fa fa-sliders-h"></i>
        </div>

        <div class="chat-side__list chat-scroller">
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

export default {
  name: "ChatSider",
  components: {
    ChatHeader,
    ChatSideItem,
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
  },
  data() {
    return {
      channelData: {},
      search: "",
      addNewChat: false,
    };
  },
  watch: {
    channels: {
      handler(channels, oldChannels) {
          const hasChangedLength = (channels && channels.length && !oldChannels) || (channels && oldChannels && channels.length != oldChannels.length)
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
      return this.addNewChat
        ? "Contacts"
        : `Messaging <span class="head-indicator">${this.unreadMessages} </span>`;
    },

    unreadMessages() {
      return Object.values(this.channelData).reduce((sum, channel) => {
        sum += Number(channel.unreadMessages || 0);
        return sum;
      }, 0);
    },

    filteredChannels() {
      return this.channels
        .filter((channel) => {
          return (
            channel.lastMessage && channel.uniqueName.includes(this.search)
          );
        })
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
  },
  beforeDestroy() {
    this.channels.forEach((channel) => {
      this.unlistenChannel(channel);
    });
  },
  created() {
    this.$root.$on("chat-opened", (sid) => {
        const channel = this.channels.find(channel => channel.sid == sid);
        if (channel) {

            this.updateMembers(channel);
        }
    });
  },
  methods: {
    updateMembers(channel) {
        channel.getMembers().then(members => {
            this.$set(
                this.channelData[channel.sid],
                "members",
                members
            );

            this.updateUnread(channel);
      });
    },
    listenChannel(channel) {
      this.getLastMessage(channel, true);
      this.updateMembers(channel);
      channel.on("messageAdded", (message) => this.getLastMessage(channel, false, message));
      channel.on("memberUpdated", (event) => this.updateMembers(channel));
    },

    unlistenChannel(channel) {
        channel.removeListener("messageAdded", this.getLastMessage);
        channel.removeListener("memberUpdated", (event) => this.updateMembers(channel));
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
          const members = await channel.getMembers()
          return members.find(
            member => member.identity == this.userContext.identity
          )
      }
    },

    async updateUnread(channel) {
        let unreadMessages = 0
        const sender = await this.getSender(channel)
        const isDifferentChannel = !this.activeChannel || (this.activeChannel.sid != channel.sid)
        if (this.channelData[channel.sid].lastMessage && sender && isDifferentChannel) {
          unreadMessages = (this.channelData[channel.sid].lastMessage.index - sender.lastConsumedMessageIndex) || 0;
        }
        this.$set(this.channelData[channel.sid], 'unreadMessages',  unreadMessages)
        return unreadMessages;
    }
  },
};
</script>

<style lang="scss">
.chat-side {
  display: flex;
  height: 100%;
  flex-direction: column;

  &__search {
    height: 42px;
    border: 2px solid #aaa;
    border-radius: 4px;
    margin: 15px 10px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    color: #777;
    position: relative;
    input {
      height: 42px;
      border: none;
      width: 100%;
      padding: 0 15px;
      font-size: 16px;
      font-weight: bold;

      &:focus {
        outline: none;
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
  width: 24px;
  margin-left: 4px;
  height: 24px;
  font-size: 14px;
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
