<template>
  <div class="profile-image__container">
    <img :src="url" alt=""  v-if="url"/>
  </div>
</template>

<script>
export default {
  props: {
    url: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss">
.profile-image__container {
  height: 35px;
  width: 35px;
  background: whitesmoke;
  border-radius: 50%;
  margin-left: 15px;
  position: relative;

  img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
  }

  &::after {
    content: "";
    background: green;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    position: absolute;
    right: -4px;
    bottom: -4px;
    border: 2px solid white;
  }
}
</style>
