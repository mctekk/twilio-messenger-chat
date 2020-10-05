<template>
  <div
    class="chat-item"
    :class="{ read: isRead() }"
    @click.prevent="$emit('click')"
  >
    <div class="chat-item__header">
      <div class="left-side">
        <profile-image
            url="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
        ></profile-image>
        <span class="chat-item__title">
          {{ channelName }}
        </span>
      </div>

      <div class="title-indicators">
        <span> 20 </span>
        <i class="fa fa-calendar"></i>
      </div>
    </div>

    <div class="chat-item__body">
      <div class="message" :class="{'message-loading': isLoading }">
        {{ lastMessageBody }}
      </div>
      <div v-if="unreadMessages" class="new-message-indicator">
        {{ unreadMessages }}
      </div>
    </div>

    <!-- <small class="typing-indicator">
      {{ descriptionText }}
    </small> -->

    <!-- <div class="meta-info">
      <small class="mr-2">Representante: Jose Perez</small>
      <small class="mr-2">Status: Demo Drive</small>
      <small>Dias abierto: 2</small>
    </div> -->
  </div>
</template>

<script>
import ProfileImage from "./profile-image";

export default {
  components: {
    ProfileImage
  },
  props: {
    channel: {
      type: Object,
      required: true
    },
    activeChannel: {
      type: Object
    },
    userContext: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      lastMessage: {},
      typing: [],
      members: [],
      newMessages: 0,
      isLoading: false
    };
  },
  created() {
    this.isLoading = true
    this.getLastMessage(true);
    this.listenChannel();
  },
  computed: {
    descriptionText() {
      return this.typing.length ? "Typing..." : "";
    },
    channelName() {
      return this.channel.friendlyName || this.channel.uniqueName;
    },
    lastMessageBody() {
       return this.lastMessage ? `${this.lastMessage.author || ''}: ${this.lastMessage.body || ''} ` : ""
    },
    receiver() {
      return (
        this.members &&
        this.members.find(
          member => member.identity != this.userContext.identity
        )
      );
    },
    sender() {
      return (
        this.members &&
        this.members.find(
          member => member.identity == this.userContext.identity
        )
      );
    },
    unreadMessages() {
      if (this.lastMessage && this.sender && !this.isActive) {
        return (this.lastMessage.index - this.sender.lastConsumedMessageIndex) || 0;
      }
      return 0;
    },
    isActive() {
      return this.activeChannel && this.channel.sid == this.activeChannel.sid;
    }
  },
  methods: {
    updateMembers() {
      this.channel.getMembers().then(members => {
        this.members = members;
      });
    },

    isRead() {
      if (this.isSender(this.lastMessage)) {
        return true;
      } else if (this.sender) {
        return (
          this.receiver &&
          this.lastMessage.index <= this.sender.lastConsumedMessageIndex
        );
      }
    },

    isSender(message) {
      return this.userContext.identity == message.author;
    },

    listenChannel() {
      this.getLastMessage();
      this.updateMembers();
      this.$root.$on("chat-opened", sid => {
        if (this.channel.sid == sid) {
          this.updateMembers();
        }
      });
      this.channel.on("messageAdded", this.getLastMessage);
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

    getLastMessage(initial) {
        this.channel.getMessages(1).then(messages => {
        this.lastMessage = messages.items.length ? messages.items[0] : {};
        if (initial) {
            this.isLoading = false
        }
        this.$nextTick(() => {
          this.updateMembers();
        });
      });
    }
  }
};
</script>

<style lang="scss">
.chat-item {
  cursor: pointer;
  background: white;
  text-align: left;
  padding-top: 15px;
  overflow: hidden;
  font-weight: bolder;

  &.read {
    font-weight: normal;
  }

  &:hover {
    background: #c5c9cc;
  }

  &__header {
    display: flex;
    font-weight: bold;
    color: #4a5568;
    justify-content: space-between;
    padding-right: 20px;

    .left-side {
        display: flex;
    }
  }

  &__title {
      margin-left: 25px;
      font-size: 18px;
  }

  &__body {
    margin-left: 65px;
    margin-right: 15px;
    padding-left: 15px;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    font-size: 1.25rem;
    border-bottom: 1px solid #4a556854;
    padding-bottom: 15px;
  }

  .message {
    width: 92%;
    white-space: nowrap;
    break-inside: auto;
    height: 30px;
    overflow: hidden;

    &.message-loading {
        background: #ddd;
        color: #ddd;
        border-radius: 6px;
        position: relative;
        // animation: skeleton-loading 1.5s infinite;

        &::after {
            display: block;
            top: 0;
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            transform: translateX(-100%);
            background: linear-gradient(90deg, transparent, #eee, transparent);
            animation: skeleton-wave 1.8s infinite;
        }
    }
  }

  .new-message-indicator {
    width: 24px;
    margin-left: 2px;
    height: 15px;
    padding: 15px 0;
    font-size: 15px;
    background: darken(dodgerblue, 10%) !important;
    color: white;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
  }

  .typing-indicator {
    font-weight: bolder;
    color: dodgerblue;
  }

  .meta-info {
    @extend .text-gray;
    font-size: 0.95rem;
    font-weight: bold;
    margin-top: 5px;
  }

  .title-indicators {
    font-size: 20px;
  }
}

.text-gray {
  color: #718096;
}

@keyframes skeleton-loading {
    0% {
        opacity: .5;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: .5;
    }
}

@keyframes skeleton-wave{
    100% {
        transform: translateX(100%);
    }
}
</style>
