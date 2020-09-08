<template>
  <div class="chat_side">
    <chat-header
      v-if="mobileDisplay"
      :show-back-button="true"
      :show-settings="!addNewChat"
      :left-icon="!addNewChat ? 'fa fa-menu' : 'fa fa-chevron-left'"
      right-icon="fa fa-plus"
      :title="headerTitle"
      @back="addNewChat = !addNewChat"
      @settings="addNewChat = !addNewChat"
    >
    </chat-header>
    <template v-if="!addNewChat">
      <div class="chat-side__search border-b-2 border-gray-700 h-16 py-4">
        <input type="text" placeholder="Search ..." />
        <button class="btn bg-blue-600 text-white hover:bg-blue-400 text-xs">
          Search
        </button>
        <select name="" id="">
          <option value="unread">unread</option>
        </select>
      </div>

      <chat-side-item
        v-for="channel in channels"
        :key="channel.id"
        :channel="channel"
        :user-context="userContext"
        :active-channel="activeChannel"
        @click="$emit('join-channel', channel)"
      >
      </chat-side-item>
    </template>
    <template v-else>
      <div
        v-for="contact in contacts"
        :key="contact.email"
        @click="$emit('create-or-join', contact)"
        class="border-b-2 border-gray-400 mx-5 pl-10 px-2 py-5 text-left cursor-pointer hover:bg-gray-400"
      >
        {{ contact.email }}
      </div>
    </template>
  </div>
</template>

<script>
import ChatHeader from "./header";
import ChatSideItem from "./side-list-item";

export default {
  name: "ChatSider",
  components: {
    ChatHeader,
    ChatSideItem
  },
  props: {
    mobileDisplay: {
      type: Boolean,
      default: false
    },
    channels: {
      type: Array,
      required: true
    },
    userContext: {
      type: Object,
      required: true
    },
    activeChannel: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      addNewChat: false
    };
  },
  computed: {
    headerTitle() {
      return this.addNewChat ? "Contacts" : "Dealer One";
    }
  }
};
</script>
