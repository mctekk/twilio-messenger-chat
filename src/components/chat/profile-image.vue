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
  height: 40px;
  width: 40px;
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
    background: greenyellow;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    position: absolute;
    right: 0;
    bottom: 0;
    border: 2px solid white;
  }
}
</style>
