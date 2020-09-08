<template>
  <div id="app">
    <twilio-chat 
      endpoint="https://apidev.kanvas.dev/v1/chat"
      :display-full="displayFull"
      :contacts="null"
      receiver="tes2t@baka.io"
    >
    </twilio-chat>
  </div>
</template>

<script>
import TwilioChat from "./components/chat";

export default {
  name: "App",
  components: {
    TwilioChat
  },
  data() {
    return {
      displayFull: true
    };
  }
};
</script>
