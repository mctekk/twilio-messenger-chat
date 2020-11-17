<template>
  <div class="h-full">
    <div class="h-full" v-if="!isLoggedIn">
      <chat-Login
        :http-options="httpOptions"
        :endpoint="endpoint"
        :receiver="receiver"
        :http-method="httpMethod"
        :show-ui="false"
        @logged="createClient"
      ></chat-Login>
      <chat-loading v-if="!showChannelList"> </chat-loading>
    </div>

    <div class="home-container h-full" v-else>
      <div
        class="chat-side__container h-full border-r-2 border-gray-700"
        :class="[displayFull ? 'w-1/3' : 'w-full']"
        v-if="!activeChannel || displayFull"
      >
        <chat-side
          v-if="showChannelList"
          :is-expanded="isExpanded"
          :user-context="userContext"
          :channels="channels"
          :active-channel="activeChannel"
          :show-header="showHeader"
          @update:is-expanded="$emit('update:is-expanded', $event)"
          @click="handleChannelClick"
        >
        </chat-side>
        <chat-loading v-else> </chat-loading>
      </div>
      <div
        v-if="activeChannel || displayFull"
        class="h-full"
        :class="[displayFull ? 'w-2/3' : 'w-full']"
      >
        <chat-messager
          ref="messenger"
          :token-field="tokenField"
          :active-channel="activeChannel"
          :user-context="userContext"
          :show-header="showHeader"
          :show-suggest-button="showSuggestButton"
          v-if="activeChannel"
          @left="leaveChannel"
          @action-called="$emit('action-called', $event)"
          @opened="$emit('chat-opened', $event)"
        >
        </chat-messager>
      </div>
    </div>
  </div>
</template>

<script>
import * as Twilio from "twilio-chat";
import axios from "axios";
import ChatLogin from "./login";
import ChatMessager from "./messager";
import ChatSide from "./side";
import ChatLoading from "./loading";
import "../../assets/scss/style.scss";

export default {
  components: {
    ChatMessager,
    ChatSide,
    ChatLogin,
    ChatLoading
  },
  props: {
    tokenField: {
      type: String,
      default: "channel_owner_token"
    },
    displayFull: {
      type: Boolean,
      default: false
    },
    endpoint: {
      type: String,
      required: true
    },
    receiver: {
      type: String
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showChannelList: {
      type: Boolean,
      default: false
    },
    showSuggestButton: {
      type: Boolean,
      default: true
    },
    httpOptions: {
      type: Object,
      default() {
        return {};
      }
    },
    httpMethod: {
      type: Function
    },
    isExpanded: {
      type: Boolean,
      default: false
    },
    externalChannelHandle: {
      type: Boolean,
      default: false
    },
    user: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      client: null,
      channels: [],
      activeChannel: null,
      userContext: { identity: null }
    };
  },
  watch: {
    receiver() {
      this.unlistenEvents();
    }
  },
  computed: {
    isLoggedIn() {
      return this.userContext.identity;
    }
  },
  beforeDestroy() {
    this.unlistenEvents();
  },
  methods: {
    async createClient(data) {
      const client = await Twilio.Client.create(data[this.tokenField], {
        logLevel: "info"
      });
      this.userContext = {
        ...data,
        identity: client.user.identity,
        user: client.user
      };
      this.client = client;

      client.on("tokenAboutToExpire", this.onTokenAboutToExpire);
      this.loadChannelEvents(client);
      this.updateChannels();
    },

    async loadChannel() {
      if (!this.activeChannel && !this.showChannelList) {
        const channel = this.channels.find(channel => {
          return channel.sid == this.userContext.channel_sid;
        });

        if (channel) {
          this.joinChannel(channel);
        }
      }
    },

    joinChannel(channel) {
      if (channel.status == "joined") {
        this.setActiveChannel(channel);
      } else {
        channel.join().then(this.setActiveChannel);
      }
    },

    onTokenAboutToExpire() {
      axios(
        `${this.endpoint}/${this.userContext.identity}`,
        this.httpOptions
      ).then(({ data }) => {
        this.client.updateToken(data[this.tokenField]);
      });
    },

    async updateChannels(channel) {
      if (channel && !channel.status == "joined") {
        channel.join();
      }

      const subscribed = await this.client
        .getSubscribedChannels({ limit: 100 })
        .then(page => {
          return this.appendChannels(page, []);
        });
      this.channels = subscribed;
      this.loadChannel();
    },

    async appendChannels(paginator, current) {
      current.push(...paginator.items);
      if (paginator.hasNextPage) {
        return this.appendChannels(await paginator.nextPage(), current);
      } else {
        return current;
      }
    },

    leaveChannel() {
      this.activeChannel = null;
      this.updateChannels();
    },

    loadChannelEvents(client) {
      client.on("channelJoined", channel => {
        channel.on("messageAdded", () => {
          this.updateChannels();
        });
        this.updateChannels();
      });

      client.on("channelInvited", this.updateChannels);
      client.on("channelAdded", this.updateChannels);
      client.on("channelUpdated", this.updateChannels);
      client.on("channelLeft", this.leaveChannel);
      client.on("channelRemoved", this.leaveChannel);
    },

    unlistenEvents() {
      if (this.client) {
        this.client.removeListener("channelJoined", channel => {
          channel.removeListener("messageAdded", () => {
            this.updateChannels();
          });
          this.updateChannels();
        });
        this.client.removeListener(
          "tokenAboutToExpire",
          this.onTokenAboutToExpire
        );
        this.client.removeListener("channelInvited", this.updateChannels);
        this.client.removeListener("channelAdded", this.updateChannels);
        this.client.removeListener("channelUpdated", this.updateChannels);
        this.client.removeListener("channelLeft", this.leaveChannel);
        this.client.removeListener("channelRemoved", this.leaveChannel);
        this.client = null;
        this.channels = [];
        this.activeChannel = null;
        this.userContext = { identity: null };
      }
      this.$emit("update:is-expanded", false);
    },

    setActiveChannel(channel) {
      this.activeChannel = channel;
    },

    handleChannelClick(channel) {
      if (this.externalChannelHandle) {
        this.$emit("channel-clicked", channel);
      } else {
        this.joinChannel(channel);
      }
    },

    sendMessage(message, attributes) {
      this.$refs.messenger.sendMessage(message, attributes);
    }
  }
};
</script>

<style lang="scss">
.h-full {
  height: 100%;
}

.w-full {
  width: 100%;
}

.home-container {
  display: flex;
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
