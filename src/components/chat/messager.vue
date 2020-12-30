<template>
  <div class="chat-container">
    <chat-loading v-if="!messages"> </chat-loading>
    <chat-header
      v-if="showHeader && messages"
      :show-back-button="true"
      :show-settings="false"
      :title="channelName"
      :description="descriptionText"
      @back="leaveChannel"
      @settings="leaveChannel"
    >
    </chat-header>

    <div class="message-list">
      <div
        v-if="messages"
        class="message-container chat-scroller"
        ref="MessageContainer"
        :class="{ 'quiet-loading': isLoading }"
      >
        <!-- Message Item -->
        <messager-item
          v-for="(message, index) in messages"
          :key="message.index"
          :is-sender="isSender(message)"
          :show-sender="channel.type == 'public'"
          :is-read="isRead(message)"
          :previous-message="index > 0 ? messages[index - 1] : {}"
          :members="members"
          :message="message"
        >
        </messager-item>
        <!-- End of message Item -->
      </div>
    </div>

    <!-- Message Box toolbar -->
    <div class="message-toolbar" v-if="messages">
      <button
        class="btn-action bg-white text-dark"
        @click.prevent="$emit('action-called')"
        v-if="showSuggestButton"
      >
        <i class="fa fa-paperclip"></i>
        Suggest Vehicle
      </button>

      <textarea
        class="message-toolbar__message"
        v-model="formData.message"
        spellcheck="true"
        ref="Message"
        placeholder="Type..."
        @keydown="listenTyping"
      ></textarea>

      <button class="btn-action" @click="sendMessage(formData.message)">
        <i class="fa fa-send mr-2"></i> Send Message
      </button>
    </div>
    <!-- End of message box -->
  </div>
</template>

<script>
import ChatHeader from "./header";
import MessagerItem from "./messager-item";
import ChatLoading from "./loading";

export default {
  components: {
    ChatHeader,
    ChatLoading,
    MessagerItem
  },
  props: {
    tokenField: {
      type: String,
      default: "channel_owner_token"
    },
    activeChannel: {
      type: Object,
      required: true
    },
    showHeader: {
      type: Boolean
    },
    showSuggestButton: {
      type: Boolean,
      default: true
    },
    userContext: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      description: "",
      channel: null,
      isLoading: false,
      messages: null,
      typing: [],
      members: [],
      formData: {
        message: ""
      }
    };
  },
  watch: {
    activeChannel: {
      handler() {
        this.removeActiveChannelListeners();
        this.isLoading = true;
        this.channel = this.activeChannel;
        this.updateMembers();
        this.getMessages();
        this.$emit("opened", this.channel.sid);
      },
      immediate: true
    }
  },
  computed: {
    descriptionText() {
      return this.typing.length ? "Typing..." : "";
    },
    channelName() {
      return this.userContext.identity == this.channel.attributes.receiver
        ? this.channel.createdBy
        : this.channel.friendlyName;
    },
    receiver() {
      return (
        this.members &&
        this.members.find(
          member => member.identity != this.userContext.identity
        )
      );
    },
    isSameOwner() {
      return (
        this.tokenField == "channel_owner_token" && this.members.length < 2
      );
    }
  },
  created() {
    this.getDescription();
  },
  mounted() {
    setTimeout(() => {
      this.scrollToBottom();
    });
  },
  beforeDestroy() {
    this.removeActiveChannelListeners();
  },
  methods: {
    isSender(message) {
      return this.userContext.identity == message.author;
    },

    isRead(message) {
      return (
        this.receiver && message.index <= this.receiver.lastConsumedMessageIndex
      );
    },

    updateMembers() {
      this.channel.getMembers().then(members => {
        this.members = members.map(member => {
          member.userAttributes = {};
          return member;
        });

        members.map(member => {
          member.getUser().then(user => {
            const index = this.members.findIndex(
              localMember =>
                localMember.identity.toLowerCase() ==
                member.state.identity.toLowerCase()
            );
            if (index >= 0) {
              const userAttributes = user.attributes;
              this.$set(this.members[index], "userAttributes", userAttributes);
            }
          });
        });
      });
    },

    async getDescription() {
      this.updateMembers();
      return await this.channel.getAttributes().then(attributes => {
        this.description = attributes.description;
      });
    },
    leaveChannel() {
      this.$emit("left", this.channel);
    },

    sendMessage(message, attributes = {}) {
      if (message.includes("/destroy")) {
        this.channel.delete().then(function(channel) {
          console.log("Deleted channel: " + channel.sid);
        });
        this.clearMessageForm();
        return;
      }
      if (message.trim()) {
        this.channel.sendMessage(message, attributes);
        this.clearMessageForm();
      }
    },

    clearMessageForm() {
      setTimeout(() => {
        this.formData.message = "";
      });
    },

    listenTyping(e) {
      if (e.keyCode === 13) {
        if (!e.ctrlKey && !e.shiftKey) {
          this.sendMessage(this.formData.message);
        }
      } else {
        this.channel.typing();
      }
    },

    scrollToBottom(behavior) {
      this.$nextTick(() => {
        const el = this.$refs.MessageContainer;
        if (el) {
          el.scrollTo({ top: el.scrollHeight, behavior });
        }
      });
    },

    removeActiveChannelListeners() {
      if (this.channel) {
        this.channel.removeListener("messageAdded", this.addMessage);
        this.channel.removeListener("memberUpdated", this.updateMembers);
      }
    },

    getMessages() {
      this.getMessagesFunc();
    },

    getMessagesFunc() {
      this.channel.getMessages(30).then(page => {
        this.messages = page.items || [];
        this.scrollToBottom();
        const lastIndex = this.messages.length - 1;
        if (lastIndex >= 0) {
          this.setLastConsumedIndex(this.messages[lastIndex].index);
        }
        this.channel.on("messageAdded", this.addMessage);
        this.channel.on("memberUpdated", this.updateMembers);
        this.isLoading = false;
      });

      this.channel.on("typingStarted", member => {
        member.getUser().then(user => {
          this.typing.push(user.friendlyName || member.identity);
        });
      });

      this.channel.on("typingEnded", member => {
        member.getUser().then(user => {
          this.typing = this.typing.filter(
            userName => !userName.includes(user.friendlyName || member.identity)
          );
        });
      });
    },

    addMessage(message) {
      this.messages.push(message);
      this.setLastConsumedIndex(message.index);
      this.scrollToBottom("smooth");
    },

    setLastConsumedIndex(index) {
      setTimeout(async () => {
        this.channel.updateLastConsumedMessageIndex(index);
      });
    }
  }
};
</script>

<style lang="scss">
.message-list {
  position: relative;
  flex: 1 1 0;
  order: 2;

  &__body {
    padding: 0.75rem 1.25rem;
    width: fit-content;
    border-radius: 1rem;
    border-top-left-radius: 0;
    width: 100%;
  }

  &__body.padding-0 {
    padding: 0 0 0 0;
  }

  &__item {
    margin: 15px;
    width: fit-content;
    padding: 0 1rem;

    &.message-sender {
      right: 0;
      margin-left: auto;

      .message-list__body {
        border-radius: 1rem;
        border-top-right-radius: 0;
      }
    }

    a {
      color: #eee;
      text-decoration: underline;
    }

    .me {
      font-weight: bold;
    }
  }

  &__text {
    white-space: pre-wrap;
  }

  .message-container {
    position: absolute;
    top: 0;
    z-index: 100;
    display: block;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
  }
}

.message-toolbar {
  width: 100%;
  display: flex;
  background: white;
  position: relative;
  border-top: 1px solid #aaa;
  z-index: 1;
  flex: none;
  order: 3;
  min-height: 62px;
  align-items: center;

  &__message {
    height: 100%;
    padding: 5px 10px;
    padding-top: 10px;
    text-align: left;
    white-space: pre-wrap;
    width: 100%;
    border: 0;

    &:focus {
      outline: none;
    }
  }
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.quiet-loading {
  opacity: 0;
}

.btn-action {
  background: dodgerblue;
  color: white;
  height: 34px;
  text-align: center;
  padding: 5px 0;
  margin: 5px;
  font-size: 0.75rem;
  cursor: pointer;
  width: 220px !important;
  border: 2px solid #ccc;
}
</style>
