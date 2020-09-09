<template>
  <div class="loading">
    <i class="loading__icon fa fa-circle-notch fa-spin"></i>
    <h4>Loading...</h4>
  </div>
</template>

<style lang="scss">
.loading {
  background: white;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  flex-direction: column;

  &__icon {
    font-size: 3rem;
    margin-bottom: 5px;
  }
}
</style>
