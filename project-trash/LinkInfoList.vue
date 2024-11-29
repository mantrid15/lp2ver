<template>
  <div class="input-module">
    <div class="link-info">{{ linkInfo }}</div>
    <div class="info-container">
      <button @click="getInfo" class="get-info-button">GetInfo</button>
      <textarea v-model="infoOutput" class="info-output" readonly></textarea>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LinkInfo',
  props: {
    linkInfo: String,
  },
};
</script>

<style scoped>
/* Ваши стили для LinkInfo.vue */
.link-info {
  background-color: lightblue;
  border: 1px solid blue;
  height: auto;
  width: 400px;
  padding: 10px;
  display: flex;
  align-items: center;
  margin-top: 10px;
}
</style>
