<template>
  <div class="content">
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
</template>

<script setup>
// Здесь можно добавить любые необходимые импорты и логику
</script>

<style scoped>
.content {
  display: flex; /* Устанавливаем флекс-контейнер */
  align-items: center; /* Центрируем элементы по вертикали */
  height: calc(100vh - 10px); /* Высота контейнера */
  width: 100%; /* Полная ширина */
  box-sizing: border-box;
  padding: 20px; /* Внешние отступы */
  gap: 5px; /* Промежутки между элементами */
  margin-left: 0; /* Прижимаем контейнер к левому краю */
}

.first-level,
.main-level,
.second-level {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  flex-basis: auto;
  height: 100%;
  box-sizing: border-box;
  padding: 1em;
  margin-left: 0; /* Прижимаем блоки к левому краю */
}


.first-level {
  flex: 0 0 24.5%; /* Фиксированная ширина блока */
  background-color: pink;
  border: 2px solid black;
  border-radius: 5px;
}

.main-level {
  flex: 0 0 49%; /* Фиксированная ширина блока */
  background-color: lightblue;
  border: 2px solid black;
  border-radius: 5px;
}

.second-level {
  flex: 0 0 24.5%; /* Фиксированная ширина блока */
  background-color: lightgreen;
  border: 2px solid black;
  border-radius: 5px;
}

/* Общие стили для вложенных div */
.inner-box {
  height: 400px; /* Фиксированная высота вложенного div */
  border-radius: 5px; /* Закругленные углы */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Легкая тень */
}


/* Стили для каждого из вложенных блоков */
.red-box {
  width: 400px; /* Ширина вложенного div */

  border-radius: 5px; /* Закругляем углы */
  background-color: red; /* Красный фон */
}

.orange-box {
  width: 600px; /* Ширина вложенного div */
  border-radius: 5px; /* Закругляем углы */
  background-color: orange; /* Рыжий фон */
}

.purple-box {
  width: 400px; /* Ширина вложенного div */
  border-radius: 5px; /* Закругляем углы */
  background-color: purple; /* Фиолетовый фон */
}
</style>
