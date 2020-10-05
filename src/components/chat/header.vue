<template>
  <div class="chat-header">
    <div class="chat-header__left">
      <div
        v-if="showBackButton"
        class="chat-header__back-button"
        @click.prevent="$emit('back')"
      >
        <i :class="leftIcon"></i>
      </div>

      <profile-image
        url="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"
      ></profile-image>

      <div class="chat-header__title">
        <div>
          <span> {{ title }} </span>
          <small>{{ description }}</small>
        </div>
      </div>
    </div>

    <div
      v-if="showSettings"
      class="chat-header__back-button"
      @click="$emit('settings')"
    >
      <i :class="rightIcon"></i>
    </div>
  </div>
</template>

<script>
import ProfileImage from "./profile-image";

export default {
  components: {
    ProfileImage
  },
  props: {
    showBackButton: {
      type: Boolean
    },
    leftIcon: {
      type: String,
      default: "fa fa-chevron-left"
    },
    rightIcon: {
      type: String,
      default: "fa fa-cogs"
    },
    showSettings: {
      type: Boolean
    },
    description: {
      type: String
    },
    title: {
      type: String
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-header {
  height: 59px;
  min-height: 59px;
  overflow: hidden;
  background: darken(dodgerblue, 30%) !important;;
  display: grid;
  grid-template-columns: repeat(7, 1fr) 3rem;
  color: white;
  width: 100%;

  &__left {
    grid-column-start: 1;
    grid-column-end: 8;
    display: flex;
    overflow: hidden;
    align-items: center;
  }

  &__back-button {
    padding: 1.25rem;
    width: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
      background: rgba($color: #000000, $alpha: 0.3);
    }
  }

  &__title {
    display: flex;
    padding-left: 1rem;
    align-items: center;
    overflow: hidden;
    font-size: 1.25rem;
  }
}
</style>
