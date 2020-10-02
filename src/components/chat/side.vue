<template>
  <div class="chat_side">
    <chat-header
      v-if="mobileDisplay || showHeader"
      :show-back-button="false"
      :show-settings="true"
      :left-icon="!addNewChat ? 'fa fa-menu' : 'fa fa-chevron-left'"
      :right-icon="!isExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"
      :title="headerTitle"
      @settings="isExpanded = !isExpanded"
    >
    </chat-header>
    <template v-if="!addNewChat && isExpanded">
      <div class="chat-side__search border-b-2 border-gray-700 h-16 py-4">
        <i class="fa fa-search"></i>
        <input class="seach-input" type="text" placeholder="Search ..." />
        <i class="fa fa-sliders-h"></i>
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
    <template v-else-if="isExpanded">
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
    showHeader: {
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
      addNewChat: false,
      isExpanded: true
    };
  },
  computed: {
    headerTitle() {
      return this.addNewChat ? "Contacts" : "Messaging";
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-side {
  &__search {
    height: 42px;
    border: 2px solid #aaa;
    border-radius: 4px;
    margin: 15px 10px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    color: #777;
    input {
      height: 100%;
      border: none;
      width: 100%;
      padding: 0 15px;
      font-size: 18px;
      font-weight: bold;

      &:focus {
        outline: none;
      }
    }
  }
}
</style>
