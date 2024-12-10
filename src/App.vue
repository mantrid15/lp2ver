<template>
  <header class="menu">
    <div class="left-menu">
      <button class="menu-button" @click="handleClick">Main</button>
      <button class="menu-button" @click="handleClick">Domain</button>
      <button class="menu-button" @click="handleClick">Notyca</button>
    </div>
    <button class="menu-button" @click="goToAuth">Auth</button>
  </header>

  <div class="container">
  <MainTool />
  </div>

  <div class="footer"></div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import MainTool from '@/views/MainTool.vue'; // Импортируем новый компонент

const lastClickedButton = ref(null); // Хранит последнюю нажатую кнопку
const router = useRouter();

const handleClick = (event) => {
  // Если есть предыдущая нажатая кнопка, возвращаем её к исходному состоянию
  if (lastClickedButton.value) {
    lastClickedButton.value.style.backgroundColor = 'purple'; // Исходный цвет кнопки
    lastClickedButton.value.style.color = 'white'; // Исходный цвет текста
  }

  // Меняем цвет текущей кнопки на зеленый и текст на черный
  event.target.style.backgroundColor = 'green';
  event.target.style.color = 'black';

  // Сохраняем ссылку на текущую нажатую кнопку
  lastClickedButton.value = event.target;
};

const goToAuth = () => {
  router.push({ name: 'auth' }); // Переход на страницу Auth
};
</script>

<style scoped>

html, body {
  height: 100%; /* Задаем высоту для html и body */
  margin: 0; /* Убираем отступы */
}
.container {
  display: flex; /* Используем flex для управления внутренними элементами */
  flex-grow: 1; /* Занимает оставшееся пространство между header и footer */
  overflow: hidden; /* Убираем прокрутку */
  position: relative; /* Позволяет использовать абсолютное позиционирование для дочерних элементов */
  /*/margin-top: 100px; /* Отступ от header */
  /*margin-bottom: 100px; /* Отступ от footer */
  height: calc(100vh - 200px); /* Высота окна минус высоты header и footer */
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0; /* Прижимаем к левому краю */
  width: 100%; /* Полоса шириной 100% */
  height: 20px; /* Высота полосы */
  background-color: #007bff; /* базовый синий цвет */
}

.menu {
  display: flex;
  align-items: center;
  position: fixed;
  top: 0; /* Меню поднято к самому верху */
  left: 0; /* Прижимаем меню к левому краю */
  width: 100%; /* Меню на всю ширину */
  height: 60px; /* Высота меню */
  background-color: #007bff; /* Синий фон меню */
  z-index: 10;
  padding: 0 10px; /* Отступы по 20 пикселей с левой и правой стороны */
}

.left-menu {
  display: flex;
  margin-right: auto; /* Отодвигает блок с кнопками к левому краю */
}

.menu-button {
  width: 100px; /* Ширина кнопок */
  height: 40px; /* Высота кнопок */
  background-color: purple; /* Фиолетовый цвет кнопок */
  color: white; /* Белый текст на кнопках */
  border: none; /* Убираем бордер для кнопок */
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px; /* Отступ между кнопками */
  transition: all 0.3s ease; /* Плавный переход для увеличения */
}

.menu-button:last-child {
  margin-right: 0; /* Убираем отступ у последней кнопки */
}

.menu-button:hover {
  width: 110px; /* Увеличиваем ширину на 10 пикселей */
  height: 50px; /* Увеличиваем высоту на 10 пикселей */
}

.container {
  display: flex; /* Используем flex для управления внутренними элементами */
  flex-grow: 1; /* Занимает оставшееся пространство между header и footer */
  overflow: hidden; /* Убираем прокрутку */
  position: relative; /* Позволяет использовать абсолютное позиционирование для дочерних элементов */
  margin-top: 60px; /* Высота меню, чтобы контейнер не перекрывал меню */
  margin-bottom: 20px; /* Высота футера, чтобы контейнер не перекрывал футер */
  height: calc(100vh - 80px); /* Высота окна минус высоты header и footer */
}
</style>
