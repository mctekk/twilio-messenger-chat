<template>
  <div id="app" style="height: 98vh">
    <twilio-chat
      v-if="leadId && token"
      :endpoint="`${endpoint}chat`"
      :show-header="false"
      :show-suggest-button="false"
      :http-options="{ headers: { Authorization: token } }"
      :display-full="false"
      :receiver="leadId"
    />
  </div>
</template>

<script>
import axios from "axios";
import TwilioChat from "./components/chat";
let endpoint = process.env.VUE_APP_CHAT_ENDPOINT;
endpoint = endpoint.replace("chat", "");

export default {
  name: "App",
  components: {
    TwilioChat
  },
  data() {
    return {
      displayFull: true,
      leadId: null,
      key: null,
      endpoint,
      token: null
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
    this.key = params["key"] || params["token"];
    this.getToken();
  },
  methods: {
    getToken() {
      axios({
        method: "GET",
        url: `${this.endpoint}sessions/${this.key}/token`
      })
        .then(({ data }) => {
          this.token = data;
        })
        .catch(() => {
          this.token = process.env.VUE_APP_CHAT_TOKEN;
        });
    }
  }
};
</script>
