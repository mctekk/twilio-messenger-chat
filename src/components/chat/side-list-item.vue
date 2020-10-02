<template>
  <div
    class="chat-item"
    :class="{ read: isRead() }"
    @click.prevent="$emit('click')"
  >
    <div class="chat-item__header">
      <div class="left-side">
        <profile-image></profile-image>
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
      <div class="message">
        {{ lastMessage.author }}: {{ lastMessage.body }}
      </div>
      <div class="new-message-indicator">
        {{ unreadMessages }}
      </div>
    </div>

    <small class="typing-indicator">
      {{ descriptionText }}
    </small>

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
      newMessages: 0
    };
  },
  created() {
    this.listenChannel();
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
        return this.lastMessage.index - this.sender.lastConsumedMessageIndex;
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

    getLastMessage() {
      this.channel.getMessages(1).then(messages => {
        this.lastMessage = messages.items.length ? messages.items[0] : {};
        setTimeout(() => {
          this.updateMembers();
        }, 10);
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
    margin-bottom: 0.5rem;
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
  }

  .new-message-indicator {
    width: 27px;
    height: 0.7rem;
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
</style>
