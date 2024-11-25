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
    <div class="link-info">{{ linkInfo }}</div> <!-- Новый раздел для отображения информации о странице -->
  </div>
</template>

<script>
import { ref } from 'vue';
import translate from 'translate-google';// Убедитесь, что путь к функции перевода правильный
import axios from 'axios';
import cheerio from 'cheerio';
// import translateText from 'text_processor.js';


const translateText = async (text) => {
  try {
    return await translate(text, { to: 'ru' });
  } catch (err) {
    // console.error(err);
    return 'Without translate'
  }
};


async function getPageInfo(url) {
  try {
    // Получаем HTML-контент страницы
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });
    // Загружаем HTML в cheerio
    const $ = cheerio.load(response.data);
    // Получаем заголовок страницы
    const title = $('title').text();
    // Получаем мета-теги
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const descriptionRu = await translateText(description);
    return {
      url,
      title,
      description,
      descriptionRu,
      keywords
    };
  } catch (error) {
    console.error('Ошибка при получении информации о странице:', error);
    return 'Ошибка при получении информации';
  }
}

export default {
  name: 'LinkMod',
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
          // Вызываем getPageInfo и сохраняем результат в linkInfo
          try {
            linkInfo.value = 'await getPageInfo(pageInfo.value)';
            // linkInfo.value = await getPageInfo(pageInfo.value);
          } catch (error) {
            linkInfo.value = 'Ошибка при получении информации о странице'; // Обработка ошибок
            console.error('Error fetching page info:', error);
          }
        } else {
          // Если это не URL, показываем сообщение
          pageInfo.value = 'Это не URL';
          linkInfo.value = ''; // Очищаем linkInfo, если URL невалидный
        }
      } else {
        pageInfo.value = 'Пожалуйста, введите корректный URL.'; // Обновлено для вывода сообщения в link-output
        linkInfo.value = ''; // Очищаем linkInfo, если поле пустое
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

.link-info {
  background-color: lightblue; /* Цвет фона для информации о странице */
  border: 1px solid blue; /* Граница для видимости */
  height: auto; /* Высота авто для адаптивности */
  width: 400px; /* Ширина блока вывода */
  padding: 10px; /* Отступы внутри блока вывода */
  display: flex; /* Центрирование текста по вертикали */
  align-items: center; /* Центрирование текста по вертикали */
  margin-top: 10px; /* Отступ сверху для разделения от других элементов */
}
</style>