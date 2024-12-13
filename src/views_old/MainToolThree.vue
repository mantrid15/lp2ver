vue
<template>
  <div class="container">
    <div class="block red"></div>
    <div class="block green"></div>
  </div>
</template>

<script>

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column; /* Расположение блоков один над другим */
  height: calc(100vh - 200px); /* Высота экрана минус отступы сверху и снизу */
  margin: 100px 10px; /* Отступы сверху, снизу и по бокам */
  box-sizing: border-box; /* Учитываем отступы и границы */
}

.block {
  border: 2px solid black; /* Черная граница */
  border-radius: 5px; /* Закругленные углы */
  flex: 1; /* Блоки занимают равное пространство */
  margin: 0; /* Убираем отступы между блоками */
  width: calc(100% - 20px); /* Ширина блока на 20 пикселей меньше, чем ширина контейнера */
  box-sizing: border-box; /* Учитываем границы в размерах блока */
}

.red {
  background-color: red; /* Красный фон для первого блока */
}

.green {
  background-color: green; /* Зеленый фон для второго блока */
}
</style>