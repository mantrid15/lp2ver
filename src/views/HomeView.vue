vue
<template>
  <div class="main-page">
    <header class="menu">
      <div class="left-menu">
        <button class="menu-button" @click="handleClick">Main</button>
        <button class="menu-button" @click="handleClick">Domain</button>
        <button class="menu-button" @click="handleClick">Notyca</button>
      </div>
      <button class="menu-button" @click="goToAuth">Auth</button>
    </header>
    <div class="footer"></div>
  </div>
</template>

<script>
import { router } from 'router'; // Импортируем useRouter
export default {
  name: 'MainPage',
  data() {
    return {
      lastClickedButton: null, // Хранит последнюю нажатую кнопку
    };
  },
  methods: {
    handleClick(event) {
      // Если есть предыдущая нажатая кнопка, возвращаем её к исходному состоянию
      if (this.lastClickedButton) {
        this.lastClickedButton.style.backgroundColor = 'purple'; // Исходный цвет кнопки
        this.lastClickedButton.style.color = 'white'; // Исходный цвет текста
      }

      // Меняем цвет текущей кнопки на зеленый и текст на черный
      event.target.style.backgroundColor = 'green';
      event.target.style.color = 'black';

      // Сохраняем ссылку на текущую нажатую кнопку
      this.lastClickedButton = event.target;
    },
    goToAuth() {
      const router = useRouter();
      router.push({ name: 'Auth' }); // Переход на страницу Auth
    },
  },
};
</script>

<style scoped>
.main-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
  width: 100px; /* Увеличиваем ширину на 10 пикселей */
  height: 50px; /* Увеличиваем высоту на 10 пикселей */
}
.footer {
  position: absolute;
  bottom: 0;
  left: 0; /* Прижимаем к левому краю */
  width: 100%; /* Полоса шириной 100% */
  height: 20px; /* Высота полосы */
  background-color: #007bff; /* базовый синий цвет */
}
</style>