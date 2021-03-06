<template>
  <div
    class="chat-item"
    :class="{ read: !unreadMessages }"
    @click.prevent="$emit('click')"
  >
    <div class="chat-item__header">
      <div class="left-side">
        <profile-image :url="receiverImage"></profile-image>
        <span class="chat-item__title">
          {{ channelName }}
        </span>
      </div>

      <div class="title-indicators" v-if="stopwatch">
        <span> {{ stopwatch }} </span>
        <i class="fas fa-history"></i>
      </div>
      <div class="title-indicators" v-else>
        <span> {{ visits() }} Visits </span>
      </div>
    </div>

    <div class="chat-item__body">
      <div class="message" :class="{ 'message-loading': isLoading }">
        {{ lastMessageBody }}
      </div>
      <div v-if="unreadMessages" class="new-message-indicator">
        {{ unreadMessages }}
      </div>
    </div>
  </div>
</template>

<script>
import ProfileImage from "./profile-image";
import Tracker from "../tracker.js";

export default {
  components: {
    ProfileImage
  },
  props: {
    channel: {
      type: Object,
      required: true
    },
    channelData: {
      type: Object,
      default() {
        return {};
      }
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
      tracker: null,
      stopwatch: null
    };
  },
  created() {
    this.watchTime();
  },
  mounted() {
    this.$root.$on("leads:status-updated", data => {
      if (
        this.channel.attributes &&
        data.id == this.channel.attributes.lead_id
      ) {
        this.$set(this.channel.attributes, "status", data.status);
      }
    });

    this.$root.$on("leads:stopwatch", data => {
      if (
        this.channel.attributes &&
        data.lead_id == this.channel.attributes.lead_id
      ) {
        this.$set(
          this.channel.attributes,
          "chrono_start_date",
          data.chrono_start_date
        );
        this.$set(
          this.channel.attributes,
          "is_chrono_running",
          data.is_chrono_running
        );
        this.$set(
          this.channel.attributes,
          "leads_visits_count",
          data.leads_visits_count
        );
        this.$set(this.channel.attributes, "status", data.status);
        this.watchTime();
      }
    });
  },
  computed: {
    descriptionText() {
      return this.typing.length ? "Typing..." : "";
    },
    channelName() {
      return this.channel.friendlyName || this.channel.uniqueName;
    },
    leadDays() {
      return this.channel.attributes.leadDays;
    },
    chronoTime() {
      return this.channel.attributes.chrono;
    },
    lastMessageBody() {
      const limit = 29;
      const lastMessage = this.channelData.lastMessage;
      const message = lastMessage
        ? `${this.getAuthorName() || ""}: ${lastMessage.body || ""} `
        : "";
      return message.length > limit
        ? `${message.slice(0, limit)} ...`
        : message;
    },
    receiver() {
      return (
        this.channelData.members &&
        this.channelData.members.find(
          member => member.identity != this.userContext.identity
        )
      );
    },
    receiverImage() {
      return this.channel.attributes.photoUrl;
    },
    sender() {
      return (
        this.channelData.members &&
        this.channelData.members.find(
          member => member.identity == this.userContext.identity
        )
      );
    },

    unreadMessages() {
      return this.channelData.unreadMessages;
    },

    isLoading() {
      return this.channelData.lastMessage ? false : true;
    },
    isActive() {
      return this.activeChannel && this.channel.sid == this.activeChannel.sid;
    }
  },
  methods: {
    isRead() {
      if (this.isSender(this.lastMessage)) {
        return true;
      } else if (this.sender) {
        return (
          this.receiver &&
          this.channelData.lastMessage.index <=
            this.sender.lastConsumedMessageIndex
        );
      }
    },

    deleteChannel() {
      this.channel.delete();
    },

    getAuthorName() {
      if (this.channelData.members && this.channelData.lastMessage) {
        const memberUser = this.channelData.members.find(
          member => member.identity == this.channelData.lastMessage.author
        );
        return memberUser && memberUser.userAttributes
          ? memberUser.userAttributes.name
          : this.channelData.lastMessage.author;
      } else if (this.channelData.lastMessage) {
        return this.channelData.lastMessage.author;
      }
    },

    isSender(message) {
      return this.userContext.identity == message.author;
    },

    watchTime() {
      this.trackTime(this.channel.attributes);
    },

    visits() {
      return Number(
        this.channel.attributes.leads_visits_count ||
          this.channel.leads_visits_count ||
          0
      );
    },

    trackTime(formData) {
      if (formData && formData.chrono_start_date) {
        this.tracker = this.tracker || new Tracker();
        this.tracker.trackTime(formData.chrono_start_date, duration => {
          this.stopwatch = duration;
        });
      } else if (this.tracker) {
        this.tracker.stop();
        this.tracker = null;
        this.stopwatch = null;
      }
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
    color: #4a5568;
    justify-content: space-between;
    padding-right: 20px;

    .left-side {
      display: flex;
    }
  }

  &__title {
    margin-left: 18px;
    font-size: 16px;
  }

  &__body {
    margin-left: 65px;
    margin-right: 15px;
    padding-left: 5px;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
    border-bottom: 1px solid #4a556854;
    padding-bottom: 15px;
  }

  .message {
    width: 92%;
    white-space: nowrap;
    break-inside: auto;
    height: 30px;
    font-size: 14px;
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
        content: "";
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
    margin-left: 4px;
    height: 24px;
    font-size: 14px;
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
    font-size: 16px;
  }
}

.text-gray {
  color: #718096;
}

@keyframes skeleton-loading {
  0% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.5;
  }
}

@keyframes skeleton-wave {
  100% {
    transform: translateX(100%);
  }
}
</style>
