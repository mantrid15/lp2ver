<template>
  <div>MainTools
  </div>
<!--  <RowTool></RowTool>-->
</template>

<script setup>
import RowTool from '../components/MainRowTool.vue'
// import RowTool from '../components/LinkInputRow.vue'
// Здесь можно добавить любые необходимые импорты и ло
//гику
</script>

<style scoped>
.content {
  height: 100vh; /* Полная высота экрана */
  width: 100vw; /* Полная ширина экрана */
  display: flex; /* Устанавливаем флекс-контейнер */
  flex-direction: column; /* Переход на вертикальную верстку */
  /*margin-top: 100px; /* Отступ от header */
}

.levels {
  flex: 1;
  display: flex;
  flex-direction: row;
  margin-left: 0;
  padding-left: 0;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;

}

.first-level,
.main-level,
.second-level {
  flex: 1; /* Занимаем равную ширину */
  display: flex; /* Устанавливаем флекс-контейнер */
  justify-content: center; /* Центрируем содержимое по горизонтали */
  align-items: center; /* Центрируем содержимое по вертикали */
}

.first-level {
  background-color: pink; /* Розовый фон */
}

.main-level {
  background-color: lightblue; /* Светло-голубой фон */
}

.second-level {
  background-color: lightgreen; /* Светло-зеленый фон */
}

.inner-box {
  width: 100%; /* Полная ширина */
  height: 100%; /* Полная высота */
  border-radius: 5px; /* Закругленные углы */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Легкая тень */
}

.red-box {
  background-color: red; /* Красный фон */
}

.orange-box {
  background-color: orange; /* Рыжий фон */
}

.purple-box {
  background-color: purple; /* Фиолетовый фон */
}
</style>