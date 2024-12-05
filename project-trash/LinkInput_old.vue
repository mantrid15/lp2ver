<!--не работает импорт из файла Js-->


<template>
  <div class="input-module">
    <div class="input-container">
      <button @click="clearFields" class="clear-button">Clear</button>
      <input
          type="url"
          v-model="url"
          placeholder="Enter URL"
          required
          class="url-input"
      />
      <button @click="fetchPageInfo" class="red-button">linkparserV2</button>
    </div>
    <div class="link-output">{{ pageInfo }}</div>
    <div class="textarea-container">
      <textarea v-model="linkInfo" rows="5" readonly class="link-info"></textarea>
      <button @click="getInfo" class="get-info-button">Get Info</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
// import { getPageInfo } from "./expNu.js";
// const getPageInfo = require('exp_nu');
import getPageInfo from "moduls/expNu.js";
// import getPageInfo from "../../moduls/exp.js";
// import getPageInfo from 'moduls/exp.js'; // Импорт функции getPageInfo из exp.js
export default {
  name: 'LinkUrl',
  setup() {
    const url = ref('');
    const pageInfo = ref('');
    const linkInfo = ref(''); // Новая реактивная переменная для информации о странице

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i; // Обновленное регулярное выражение для проверки URL
      return regex.test(string);
    };

    const fetchPageInfo = async () => {
      if (url.value) {
        if (isValidURL(url.value)) {
          // Если это корректный URL, сохраняем его в pageInfo
          pageInfo.value = url.value;
          linkInfo.value = ''; // Очищаем linkInfo, чтобы оно оставалось пустым
        } else {
          // Если это не URL, показываем сообщение
          pageInfo.value = 'This not URL';
          linkInfo.value = ''; // Очищаем linkInfo, если URL невалидный
        }
      } else {
        pageInfo.value = 'Please enter a valid URL.'; // Обновлено для вывода сообщения в link-output
        linkInfo.value = ''; // Очищаем linkInfo, если поле пустое
      }
    };

    const getInfo = async () => {
      if (isValidURL(pageInfo.value)) {
        try {
          alert(pageInfo.value)
          linkInfo.value = await getPageInfo(pageInfo.value);
        } catch (error) {
          linkInfo.value = error; // Обработка ошибок
          // linkInfo.value = 'Ошибка при получении информации о странице'; // Обработка ошибок
          console.error('Error fetching page info:', error);
        }
      } else {
        linkInfo.value = 'Сначала получите информацию о странице.'; // Сообщение, если нет информации о странице
      }
    };

    const clearFields = () => {
      url.value = ''; // Очищаем поле ввода
      pageInfo.value = ''; // Очищаем поле вывода
      linkInfo.value = ''; // Очищаем информацию о странице
    };

    return {
      url,
      pageInfo,
      linkInfo, // Возвращаем linkInfo
      fetchPageInfo,
      clearFields,
      getInfo, // Возвращаем новую функцию getInfo
    };
  },
};
</script>

<style scoped>
.input-module {
  width: 400px;
  height: auto; /* Изменено для адаптивности */
  background-color: green;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto; /* Центрирование по горизонтали */
  margin-bottom: 20px; /* Отступ снизу для разделения модулей */
}
.input-container {
  display: flex;
  align-items: center; /* Выравнивание по центру по вертикали */
}
.url-input {
  height: 30px; /* Высота инпута */
  margin-right: 20px; /* Отступ между инпутом и кнопкой */
  padding: 5px; /* Отступ внутри инпута */
}
.red-button {
  background-color: red;
  color: white;
  border: none;
  height: 30px; /* Высота кнопки */
  padding: 0 10px; /* Горизонтальные отступы для кнопки */
  cursor: pointer;
}
.red-button:hover {
  background-color: darkred;
}
.clear-button {
  background-color: purple; /* Фиолетовый цвет */
  color: white;
  border: none;
  height: 30px; /* Высота кнопки */
  padding: 0 10px; /* Горизонтальные отступы для кнопки */
  cursor: pointer;
  margin-right: 10px; /* Отступ между кнопкой Clear и полем ввода */
}
.clear-button:hover {
  background-color: darkviolet; /* Цвет при наведении */
}
.link-output {
  background-color: yellow;
  border: 1px solid blue; /* Добавлено для видимости границы */
  height: 50px; /* Высота блока вывода */
  width: 400px; /* Ширина блока вывода */
  padding: 10px; /* Отступы внутри блока вывода */
  display: flex; /* Центрирование текста по вертикали */
  align-items: center; /* Центрирование текста по вертикали */
  margin-top: 10px; /* Отступ сверху для разделения от других элементов */
}
.textarea-container {
  display: flex; /* Выравнивание элементов по горизонтали */
  align-items: flex-start; /* Выравнивание по верхнему краю */
  margin-top: 10px; /* Отступ сверху для разделения от других элементов */
}
.link-info {
  background-color: pink; /* Розовый цвет для textarea */
  border: 1px solid blue; /* Граница для видимости */
  height: auto; /* Высота авто для адаптивности */
  width: 100%; /* Ширина блока вывода */
  padding: 10px; /* Отступы внутри блока вывода */
  resize: none; /* Запрет изменения размера */
}
.get-info-button {
  background-color: lightblue; /* Цвет кнопки Get Info */
  color: white;
  border: none;
  height: 30px; /* Высота кнопки */
  padding: 0 10px; /* Горизонтальные отступы для кнопки */
  cursor: pointer;
  margin-left: 10px; /* Отступ между textarea и кнопкой */
}
.get-info-button:hover {
  background-color: deepskyblue; /* Цвет при наведении */
}
</style>