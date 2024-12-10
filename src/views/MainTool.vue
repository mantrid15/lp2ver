<template>
  <div class="content">
    <div class="levels">
      <div class="first-level">
        <!-- Содержимое первого уровня -->
        <div class="inner-box red-box"></div>
      </div>
      <div class="main-level">
        <!-- Содержимое основного уровня -->
        <div class="inner-box orange-box"></div>
      </div>
      <div class="second-level">
        <!-- Содержимое второго уровня -->
        <div class="inner-box purple-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Здесь можно добавить любые необходимые импорты и логику
</script>

<style scoped>
.content {
  height: 100vh; /* Полная высота экрана */
  width: 100vw; /* Полная ширина экрана */
  display: flex; /* Устанавливаем флекс-контейнер */
  flex-direction: column; /* Переход на вертикальную верстку */
  /*margin-top: 100px; /* Отступ от header */
  margin-bottom: 100px; /* Отступ от footer */
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