<template>
  <div class="chat-side">
    <chat-header
      v-if="mobileDisplay || showHeader"
      :show-back-button="false"
      :show-settings="true"
      :left-icon="!addNewChat ? 'fa fa-menu' : 'fa fa-chevron-left'"
      :right-icon="!isExpanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'"
      :title="headerTitle"
      @settings="$emit('update:is-expanded', !isExpanded)"
    >
    </chat-header>
    <template v-if="!addNewChat && isExpanded">
        <div class="chat-side__body">
            <div class="chat-side__search border-b-2 border-gray-700 h-16 py-4">
                <i class="fa fa-search"></i>
                <input class="seach-input" type="text" placeholder="Search ..."  v-model="search"/>
                <i class="fa fa-sliders-h"></i>
            </div>

            <div class="chat-side__list chat-scroller">
                <chat-side-item
                    v-for="channel in filteredChannels"
                    :key="channel.sid"
                    :channel="channel"
                    :user-context="userContext"
                    :active-channel="activeChannel"
                    @click="$emit('click', channel)"
                >
                </chat-side-item>
            </div>

        </div>
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
    },
    isExpanded: {
        type: Boolean,
        required: true
    }
  },
  data() {
    return {
        search: "",
        addNewChat: false
    };
  },
  computed: {
    headerTitle() {
      return this.addNewChat ? "Contacts" : "Messaging";
    },

    filteredChannels() {
        return this.channels.filter(channel => {
           return channel.lastMessage && channel.uniqueName.includes(this.search);
        }).sort( (a, b) => {
            const dateCreatedA = a.lastMessage ? a.lastMessage.dateCreated.toISOString() : '';
            const dateCreatedB = b.lastMessage ? b.lastMessage.dateCreated.toISOString() : '';
            return dateCreatedA > dateCreatedB ? -1 : 1;
        })
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-side {
    display: flex;
    height: 100%;
    flex-direction: column;

  &__search {
    height: 42px;
    border: 2px solid #aaa;
    border-radius: 4px;
    margin: 15px 10px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    color: #777;
    position: relative;
    input {
      height: 42px;
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

  &__body {
    height: 91%;
    display: flex;
    flex-direction: column;
  }

  &__list {
      height: 100%;
      overflow: auto;
  }
}
</style>
