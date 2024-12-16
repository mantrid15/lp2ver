<template>
  <v-container>
    <!-- Таблица для вывода данных -->
    <v-table theme="dark" density="compact" fixed-header
             :style="{ height: 'auto', overflow: 'hidden' }">
      <thead>
      <tr>
        <th class="table-header" :style="{ width: columnWidth + 'px' }">Fav</th>
        <th class="table-header" :style="{ width: columnWidth + 'px' }">Date</th>
        <th class="table-header" :style="{ width: columnWidth + 'px' }">Url</th>
        <th class="table-header" :style="{ width: columnWidth + 'px' }">Title</th>
        <th class="table-header" :style="{ width: columnWidth + 'px' }">Descr</th>
        <th class="table-header" :style="{ width: columnWidth + 'px' }">Tag</th>

        <th class="table-header" :style="{ width: columnWidth + 'px' }">Хэш</th>
      </tr>
      </thead>
      <tbody>
      <tr v-if="linkInfoParsed">
        <td>
          <div style="background-color: white; display: inline-block; padding: 2px;">
            <img src="/lpicon.png" alt="Favicon" width="20" height="20" />
          </div>
        </td>
        <td v-tooltip="linkInfoParsed.date" data-tooltip-top>{{ new Date().toLocaleDateString() }}</td>
        <td>
          <a :href="linkInfoParsed.url" target="_blank" rel="noopener noreferrer">
            {{ linkInfoParsed.url.length > 50 ? linkInfoParsed.url.substring(0, 50) + '...' : linkInfoParsed.url }}
          </a>
        </td>
        <td v-tooltip="linkInfoParsed.title" data-tooltip-top>
          <span style="white-space: nowrap;">{{ linkInfoParsed.title.length > 100 ? linkInfoParsed.title.substring(0, 100) + '...' : linkInfoParsed.title }}</span>
        </td>
        <td v-tooltip="linkInfoParsed.description" data-tooltip-top>
          <span style="white-space: nowrap;">{{ linkInfoParsed.description.length > 50 ? linkInfoParsed.description.substring(0, 50) + '...' : linkInfoParsed.description }}</span>
        </td>
        <td v-tooltip="linkInfoParsed.keywords" data-tooltip-top>
          <span style="white-space: nowrap;">{{ linkInfoParsed.keywords.length > 50 ? linkInfoParsed.keywords.substring(0, 50) + '...' : linkInfoParsed.keywords }}</span>
        </td>

        <td>{{ linkInfoParsed.hash }}</td>
      </tr>
      </tbody>
    </v-table>
    <!-- Полоса отделяющая таблицу от модуля -->
    <div class="divider"></div>
    <v-row justify="center">
      <v-btn @click="clearFields" class="clear-button">
        <v-icon color="black" class="ma-1" size="large">mdi-delete</v-icon>
      </v-btn>
      <v-text-field
          ref="urlInput"
          v-model="url"
          class="url-input"
          placeholder="Введите URL"
          @keydown.enter="handleEnter"
          solo
      ></v-text-field>
      <v-btn
          @click="handleButtonClick"
          class="red-button"
          :class="{ 'active': isFetching }"
      >
        <v-img src="/lpicon.png" alt="URL Icon" width="20" height="20" class="mr-2 ml-2" />
        {{ buttonLabel }}
      </v-btn>
      <v-btn class="red-button status-box" @click="handleClearStatus">{{ statusMessage || ' ' }}</v-btn>
      <v-textarea v-model="linkInfo" class="link-info" readonly></v-textarea>
    </v-row>
  </v-container>
</template>


<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  name: 'LinkUrl',
  setup() {
    const url = ref('');
    const linkInfo = ref('');
    const statusMessage = ref('');
    const urlInput = ref(null);
    const buttonLabel = ref('Проверить URL');
    const buttonLabelOk = ref('LinkParser')

    // Переменная для ширины столбцов
    const columnWidth = ref(50); // Ширина столбцов в пикселях


    // Переменная для хранения разобранной информации из linkInfo
    const linkInfoParsed = ref(null);

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
      return regex.test(string);
    };

    // Функция для парсинга linkInfo
    const parseLinkInfo = () => {
      try {
        console.log('linkInfo.value:', linkInfo.value); // Логируем исходное значение

        // Удаляем лишние кавычки и символы новой строки
        const rawValue = linkInfo.value.replace(/^"|"$/g, '').replace(/\\n/g, '');

        const info = JSON.parse(rawValue); // Парсим JSON
        console.log('Parsed Info:', info); // Логируем разобранные данные

        // Логируем разобранные данные
        linkInfoParsed.value = {
          date: new Date().toLocaleString(),
          url: info.url || '',
          title: info.title || '',
          description: info.description || '',
          keywords: info.keywords || '',
          favicon: info.favicon || null,
          hash: 'hash', // Здесь можно добавить логику для генерации хэша, если это необходимо
        };
        console.log(linkInfoParsed.value);
      } catch (error) {
        console.error('Ошибка при парсинге linkInfo:', error);
        linkInfoParsed.value = null; // Если возникла ошибка, обнуляем значение
      }
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
        return info
        // return JSON.stringify(info, null, 2); // Возвращаем информацию в виде строки
      } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return 'Ошибка при получении информации'; // Возвращаем сообщение об ошибке
      }
    };

    const fetchMetaData = async (url) => {
      console.log('Запрос к API:', url);
      try {
        const response = await axios.get(`https://tools.buzzstream.com/metaDataService?url=${encodeURIComponent(url)}`);
        return response.data;
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return {error: 'Ошибка при получении информации'};
      }
    };

    const fetchMetaSerp = async (url) => {
      try {
        const response = await fetch('https://api.serp.tools/api/v1/tools/title-description-h1/', {
          method: 'POST',
          headers: {
            'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,tr;q=0.6',
            'content-type': 'application/json;charset=UTF-8',
          },
          body: JSON.stringify({
            'links': [url]
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const item = data.data.items[0];
        const content = item.content;
        const result = {
          url: item.url,
          title: content.title.value,
          description: content.description.value,
          keywords: ''
        };
        return result;
      } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return {error: 'Ошибка при получении информации'};
      }
    };

    const getInfo = async () => {
      if (isValidURL(url.value)) {
        try {
          let info = await getPageInfo(url.value);
          if (info.error) {
            statusMessage.value = '2'; // Устанавливаем статус для fetchMetaData
            info = await fetchMetaData(url.value);
          } else {
            statusMessage.value = '1'; // Устанавливаем статус для getPageInfo
          }
          if (info.error) {
            statusMessage.value = '3'; // Устанавливаем статус для fetchMetaSerp
            info = await fetchMetaSerp(url.value);
          }
          if (info.error) {
            info = {
              url: url.value,
              title: '',
              description: '',
              keywords: '',
            };
          }
          linkInfo.value = JSON.stringify(info, null, 2);
        } catch (error) {
          linkInfo.value = error;
          console.error('Ошибка при получении информации о странице:', error);
        }
      } else {
        linkInfo.value = 'Сначала получите информацию о странице.';
      }
    };



    const handleButtonClick = async () => {
      if (buttonLabel.value === buttonLabelOk.value) {
        await getInfo(); // Выполняем функцию получения информации
        parseLinkInfo(); // Парсим данные после получения информации
      } else {
        await fetchPageInfo(); // Выполняем проверку URL
      }
    };

    const fetchPageInfo = async () => {
      if (url.value) {
        if (isValidURL(url.value)) {
          buttonLabel.value = buttonLabelOk.value; // Изменение текста кнопки
          linkInfo.value = ''; // Очищаем предыдущую информацию
        } else {
          buttonLabel.value = 'Проверить URL'; // Возврат текста кнопки
          linkInfo.value = 'Это не URL';
        }
      } else {
        buttonLabel.value = 'Проверить URL'; // Возврат текста кнопки
        linkInfo.value = 'Пожалуйста, введите корректный URL.';
      }
    };

    const clearFields = () => {
      url.value = '';
      linkInfo.value = '';
      statusMessage.value = '';
      buttonLabel.value = 'Проверить URL'; // Сброс текста кнопки
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      navigator.clipboard.readText().then((text) => {
        url.value = text;
      });
    };

    const handleEnter = () => {
      if (url.value) {
        handleButtonClick();
      }
    };

    onMounted(() => {
      urlInput.value.focus();
      urlInput.value.addEventListener('contextmenu', handleContextMenu);
    });

    const handleClearStatus = () => {
      statusMessage.value = '';
    };

    return {
      url,
      linkInfo,
      statusMessage,
      handleButtonClick,
      clearFields,
      urlInput,
      handleEnter,
      handleClearStatus,
      linkInfoParsed,
      parseLinkInfo,
      buttonLabel,
      // mdiDelete, // Экспортируем иконку
    };
  },
};
</script>

<style scoped>
.input-module {
  width: 100%;
  background-color: green;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.input-container {
  display: flex;
  align-items: center;
}

.url-input {
  margin-right: 20px;
}

.red-button {
  background-color: red;
  color: white;
}

.clear-button {
  background-color: purple;
  color: white;
}

.link-info {
  background-color: pink;
  border: 1px solid blue;
  padding: 10px;
  width: 100%;
  height: 150px;
  resize: both;
  box-sizing: border-box;
}
</style>
