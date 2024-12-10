<template>
  <div class="main-block">
    <div class="inner-block first"></div>
    <div class="inner-block second"></div>
    <div class="inner-block third"></div>
  </div>
</template>

<style scoped>

.main-block {
  height: calc(100vh - 200px);
  width: calc(100vw - 20px);
  margin-top: 100px;
  display: flex;
}

.inner-block {
  border: 2px solid black;
  border-radius: 5px;
  height: 96%;
  box-sizing: border-box;
}

.first {
  width: 24%;
  background-color: red;
}

.second {
  width: 48%;
  background-color: green;
}

.third {
  width: 24%;
  background-color: blue;
}
</style>