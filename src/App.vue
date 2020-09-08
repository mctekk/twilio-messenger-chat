<template>
  <div id="app" style="height: 98vh">
    <twilio-chat
      :endpoint="endpoint"
      :show-header="false"
      :show-suggest-button="false"
      :http-options="{ headers: { Authorization: token } }"
      :display-full="false"
      receiver="5626"
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
      endpoint: "https://apikdev.gewaer.io/v1/chat",
      token
    };
  }
};
</script>
