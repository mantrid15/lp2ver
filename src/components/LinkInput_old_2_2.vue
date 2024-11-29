vue
<template>
    <div class="input-module">
      <div class="input-container">
        <button @click="clearFields" class="clear-button">Очистить</button>
        <input
            ref="urlInput"
            v-model="url"
            class="url-input"
            placeholder="Введите URL"
            @keydown.enter="handleEnter"
        />
        <button
            @click="fetchPageInfo"
            class="red-button"
            :class="{ 'active': isFetching }"
        >
          Проверить URL
        </button>
        <button @click="getInfo" class="get-info-button">Получить информацию</button>
      </div>
      <div class="link-output">{{ pageInfo }}</div>
      <div class="textarea-container">
        <textarea v-model="linkInfo" class="link-info" readonly></textarea>

      </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  name: 'LinkUrl',
  setup() {
    const url = ref('');
    const pageInfo = ref('');
    const linkInfo = ref('');
    const urlInput = ref(null); // Ссылка на элемент input

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
      return regex.test(string);
    };

    const getPageInfo = async (url) => {
      try {
        const response = await axios.get(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
        const $ = cheerio.load(response.data);
        const info = {
          url,
          title: $('title').text(),
          description: $('meta[name="description"]').attr('content') || '',
          keywords: $('meta[name="keywords"]').attr('content') || '',
        };
        return info;
      } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return { error: 'Ошибка при получении информации' };
      }
    };


    const fetchPageInfo = async () => {
      if (url.value) {
        if (isValidURL(url.value)) {
          pageInfo.value = url.value;
          linkInfo.value = '';
        } else {
          pageInfo.value = 'Это не URL';
          linkInfo.value = '';
        }
      } else {
        pageInfo.value = 'Пожалуйста, введите корректный URL.';
        linkInfo.value = '';
      }
    };

    const getInfo = async () => {
      if (isValidURL(pageInfo.value)) {
        try {
          const info = await getPageInfo(pageInfo.value);
          linkInfo.value = JSON.stringify(info, null, 2);
        } catch (error) {
          linkInfo.value = error;
          console.error('Ошибка при получении информации о странице:', error);
        }
      } else {
        linkInfo.value = 'Сначала получите информацию о странице.';
      }
    };

    const clearFields = () => {
      url.value = '';
      pageInfo.value = '';
      linkInfo.value = '';
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      navigator.clipboard.readText().then((text) => {
        url.value = text; // Вставка текста из буфера обмена
      });
    };

    const handleEnter = () => {
      if (url.value) {
        fetchPageInfo();
      }
    };

    onMounted(() => {
      // Автоматически помещаем курсор в поле ввода
      urlInput.value.focus();
      // Добавляем обработчик для правого клика
      urlInput.value.addEventListener('contextmenu', handleContextMenu);
    });

    return {
      url,
      pageInfo,
      linkInfo,
      fetchPageInfo,
      clearFields,
      getInfo,
      urlInput,
      handleEnter,
    };
  },
};
</script>

<style scoped>
.input-module {
  width: 800px;
  height: 400px; /* Изменено для адаптивности */
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
.button-group {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Равномерное распределение кнопок */
}
.red-button {
  background-color: red;
  color: white;
  border: none;
  height: 30px;
  padding: 0 10px;
  cursor: pointer;
  margin-left: 10px;
  border-radius: 5px; /* Закругление углов */
  transition: background-color 0.3s; /* Плавный переход цвета */
}
.red-button.active {
  background-color: purple; /* Цвет при активном состоянии */
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
  flex-direction: column; /* Выстраиваем элементы в колонку */
  width: 100%; /* Устанавливаем ширину контейнера */
  height: 200px;
  display: flex; /* Выравнивание элементов по горизонтали */
  align-items: flex-start; /* Выравнивание по верхнему краю */
  margin-top: 10px; /* Отступ сверху для разделения от других элементов */
}
.link-info {
  background-color: pink; /* Розовый цвет для textarea */
  border: 1px solid blue; /* Граница для видимости */
  padding: 10px; /* Отступы внутри блока вывода */
  width: 100%; /* Задаем ширину текстовой области */
  height: 150px; /* Начальная высота текстовой области */
  resize: both; /* Позволяем изменять размер по вертикали и горизонтали */
  box-sizing: border-box; /* Учитываем отступы и границы в ширине и высоте */
}
.get-info-button {
  margin-left: 10px; /* Отступ между кнопками */
  background-color: lightblue; /* Цвет кнопки Get Info */
  color: white;
  border: none;
  height: 30px; /* Высота кнопки */
  padding: 0 10px; /* Горизонтальные отступы для кнопки */
  cursor: pointer;
}
.get-info-button:hover {
  background-color: deepskyblue; /* Цвет при наведении */
}
</style>