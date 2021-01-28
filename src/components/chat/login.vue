<template>
  <div class="login flex justify-center items-center h-full" v-if="showUi">
    <div class="form-card text-center">
      <h2 class="text-2xl">Login</h2>
      <form action="">
        <div class="mb-4">
          <label for="identity" class="block mb-2 font-bold">Email</label>
          <input
            type="text"
            class="border-2 border-gray-400"
            v-model="formData.identity"
          />
        </div>
        <button
          class="bg-blue-500 text-white px-3 py-2"
          @click.prevent="login()"
        >
          Login as guest
        </button>
      </form>
      <span class="block mb-2"> Or </span>
      <button class="bg-blue-500 text-white px-3 py-2">
        Login with Gewaer
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Cookies from "js-cookie";

export default {
  name: "Login",
  props: {
    endpoint: {
      type: String,
      required: true
    },
    httpOptions: {
      type: Object,
      default() {
        return {};
      }
    },
    receiver: {
      type: String
    },
    httpMethod: {
      type: Function
    },
    showUi: {
      type: Boolean
    }
  },
  data() {
    return {
      formData: {
        identity: ""
      }
    };
  },
  created() {
    if (this.receiver) {
      this.formData.identity = this.receiver;
      this.login();
    }
  },
  methods: {
    login() {
      this.getAccessToken(this.formData.identity);
    },

    getData() {
      const token = Cookies.get("kanvas:chat");
      return JSON.parse(token);
    },

    setData(data) {
      Cookies.set("kanvas:chat", data);
      this.$emit("logged", data);
    },

    getAccessToken(identity) {
      if (this.httpMethod) {
        this.httpMethod(`${this.endpoint}/${identity}`).then(({ data }) => {
          this.setData(data);
        });
        return;
      } else {
        axios
          .get(`${this.endpoint}/${identity}`, this.httpOptions)
          .then(({ data }) => {
            this.setData(data);
          });
      }
    }
  }
};
</script>
