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
      <chat-loading> </chat-loading>
    </div>

    <div class="home-container h-full" v-else>
      <div
        class="chat-side__container h-full border-r-2 border-gray-700"
        :class="[displayFull ? 'w-1/3' : 'w-full']"
        v-if="!activeChannel || displayFull"
      >
        <chat-side
          v-if="showChannelList"
          :user-context="userContext"
          :channels="channels"
          :active-channel="activeChannel"
          :show-header="showHeader"
          @join-channel="joinChannel"
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
      type: String,
      required: true
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
    }
  },
  data() {
    return {
      client: null,
      channels: [],
      messages: [],
      contacts: [],
      activeChannel: null,
      userContext: { identity: null }
    };
  },
  computed: {
    isLoggedIn() {
      return this.userContext.identity;
    }
  },
  beforeDestroy() {},
  methods: {
    async createClient(data) {
      const client = await Twilio.Client.create(data[this.tokenField], {
        logLevel: "info"
      });
      this.userContext = {
        ...data,
        identity: client.user.identity
      };
      this.client = client;

      client.on("tokenAboutToExpire", this.onTokenAboutToExpire);
      this.updateChannels();
      this.loadChannelEvents(client);
    },

    async loadChannel() {
      if (!this.activeChannel) {
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
      console.log("about to expire");
    },

    async updateChannels(channel) {
      if (channel && !channel.status == "joined") {
        channel.join();
      }

      const subscribed = await this.client
        .getSubscribedChannels()
        .then(page => {
          return page.items.map(item => item);
        });
      this.channels = subscribed;
      this.loadChannel();
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

    setActiveChannel(channel) {
      this.activeChannel = channel;
    },

    sendMessage(message) {
       this.$refs.messenger.sendMessage(message)
    }
  }
};
</script>

<style lang="scss" scoped>
.h-full {
  height: 100%;
}

.w-full {
  width: 100%;
}

.home-container {
  display: flex;
}
</style>
