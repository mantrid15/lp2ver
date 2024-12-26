<script setup>
import HelloWorld from './HelloWorld.vue'
import LinkInput from "./LinkInputRow.vue";
import Auth from '@/components/Auth/Auth.vue'
</script>

<template>
  <header>
<!--    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />-->
    <div class="wrapper">

<!--      <HelloWorld msg="You did it!" />-->
    </div>
  </header>

  <main>
    <Auth/>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  position: relative; /* Для абсолютного позиционирования логотипа */
}

.top-bar {
  height: 10px; /* Высота узкой полосы */
  background-color: #f0f0f0; /* Цвет полосы (можно изменить) */
}

.logo {
  position: absolute; /* Абсолютное позиционирование для логотипа */
  top: 20px; /* Отступ от верхнего края */
  left: 20px; /* Отступ от левого края */
}

.wrapper {
  margin-left: 160px; /* Отступ для текста или других элементов в .wrapper */
}

main {
  padding: 20px; /* Отступы вокруг содержимого main */
  background-color: #ffffff; /* Цвет фона для main (можно изменить) */
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }
  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
