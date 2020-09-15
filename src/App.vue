<template>
  <div id="app" style="height: 98vh">
    <twilio-chat
      v-if="leadId"
      :endpoint="endpoint"
      :show-header="false"
      :show-suggest-button="false"
      :http-options="{ headers: { Authorization: token } }"
      :display-full="false"
      :receiver="leadId"
    />
  </div>
</template>

<script>
import TwilioChat from "./components/chat";
const token = "";

export default {
  name: "App",
  components: {
    TwilioChat
  },
  data() {
    return {
      displayFull: true,
      leadId: null,
      endpoint: process.env.VUE_APP_CHAT_ENDPOINT,
      token: token || process.env.VUE_APP_CHAT_TOKEN
    };
  },
  mounted() {
    const params = Object.fromEntries(
      location.search
        .substring(1)
        .split("&")
        .map(entry => entry.split("="))
    );
    this.leadId = params["lead-id"];
  }
};
</script>
