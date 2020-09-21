<template>
  <div class="chat-container">
    <chat-header
      v-if="showHeader"
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
        class="message-container chat-scroller"
        ref="MessageContainer"
        :class="{ 'quiet-loading': isLoading }"
      >
        <!-- Message Item -->
        <messager-item
          v-for="message in messages"
          :key="message.index"
          :is-sender="isSender(message)"
          :show-sender="channel.type == 'public'"
          :is-read="isRead(message)"
          :message="message"
        >
        </messager-item>
        <!-- End of message Item -->
      </div>
    </div>

    <!-- Message Box toolbar -->
    <div class="message-toolbar">
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

export default {
  components: {
    ChatHeader,
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
      messages: [],
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
        this.members = members;
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

    sendMessage(message) {
      if (message.trim()) {
        this.channel.sendMessage(message);
        setTimeout(() => {
          this.formData.message = "";
        });
      }
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
      const el = this.$refs.MessageContainer;
      if (el) {
        setTimeout(() => {
          el.scrollTo({ top: el.scrollHeight, behavior });
        });
      }
    },

    removeActiveChannelListeners() {
      if (this.channel) {
        this.channel.removeListener("messageAdded", this.addMessage);
        this.channel.removeListener("memberUpdated", this.updateMembers);
      }
    },

    getMessages() {
      this.channel.getMessages(30).then(page => {
        this.messages = page.items || [];
        this.scrollToBottom();
        const lastIndex = this.messages.length - 1;
        if (lastIndex >= 0) {
          this.setLastConsumedIndex(this.messages[lastIndex].index);
        }
        this.channel.on("messageAdded", this.addMessage);
        this.channel.on("memberUpdated", this.updateMembers);
        setTimeout(() => {
          this.isLoading = false;
        }, 300);
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

  &__item {
    background: rgb(250, 250, 250);
    color: #333;
    margin: 15px;
    padding: 0.75rem 1.25rem;
    width: fit-content;
    border-radius: 0.25rem;
    &.message-sender {
      right: 0;
      margin-left: auto;
    }

    .me {
      font-weight: bolder;
    }
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

.message-body {
  white-space: pre-wrap;
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

.chat-scroller {
  &::-webkit-scrollbar-thumb {
    background-color: transparentize($color: #000000, $amount: 0.9);
    border-radius: 4px;

    &:hover {
      background-color: transparentize($color: #000000, $amount: 0.9);
    }
  }

  &::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 10px;
  }
}
</style>
