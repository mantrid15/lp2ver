<template>
  <v-container>
    <div style="display: flex; align-items: center; overflow: hidden; ">
      <v-btn @click="clearFields" class="clear-button" style="margin-right: 5px; background: green">
        <v-icon color="black" class="ma-2" size="large">mdi-delete</v-icon>
      </v-btn>
      <v-btn @click="handleButtonClick"
             :class="['fixed-size-button', buttonColorClass]"
             style="margin-right: 5px; padding: 5px;">
        <span v-if="statusMessage">
                  {{ buttonLabelOk }}
        <span
            style="background-color: blue;
            color: white; border-radius: 9px;
            padding: 5px; margin-left: 5px;
            border: 1px solid white; font-size: 9px; padding-bottom: 3px">
          {{ statusMessage }}
        </span>

        </span>
        <span v-else="isProcessing" style="display: flex; justify-content: center; align-items: center; margin-right: 10px">

              {{ buttonLabel }}
          <v-img :src="statusMessage ? '/path/to/your/icon.png' : '/lpicon.png'"
                 alt="URL Icon"
                 width="20" height="20"
                 style="margin-left: 10px"
          />
              </span>
      </v-btn>

      <v-table
          style="width: 1000px; table-layout: fixed; overflow: hidden;
          background-color: transparent; border: 1px solid white; border-radius: 2px;"
          theme="dark"
          density="compact"
          fixed-header>
        <tbody>
        <tr v-if="linkInfoParsed">
          <td  style="width: 300px;" class="divider">
            <a :href="linkInfoParsed.url" target="_blank" rel="noopener noreferrer"
               style="display: flex; justify-content: start; padding-right:  10px;">
              <span class="text-ellipsis"
                    style="display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                {{ truncateText(linkInfoParsed.url, 30).truncated }}
              </span>
            </a>
          </td>
          <td class="divider" style="width: 30px; display: flex; justify-content: center; align-items: center; padding: 0;">
            <div class="favicon-container">
              <img src="/lpicon.png" alt="Favicon" width="20" height="20" />
<!--              <img :src="linkInfoParsed.favicon" v-tooltip="linkInfoParsed.favicon" alt="Favicon" width="20" height="20" />-->
            </div>
          </td>
          <td class="divider" style="width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            <span class="scrolling-text" v-tooltip="linkInfoParsed.title">
              <span class="text-ellipsis" style="margin-left: 5px">{{ truncateText(linkInfoParsed.title, 30).truncated }}</span>
            </span>
          </td>
          <td class="divider" style="width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
            <span class="scrolling-text" v-tooltip="linkInfoParsed.description">
              <span class="text-ellipsis" style="margin-left: 5px">{{ truncateText(linkInfoParsed.description, 20).truncated }}</span>
            </span>
          </td>
          <td class="divider" style="width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
            <span class="scrolling-text" v-tooltip="linkInfoParsed.keywords">
              <span class="text-ellipsis" style="margin-left: 5px">{{ truncateText(linkInfoParsed.keywords, 20).truncated }}</span>
            </span>
          </td>
          <td class="divider " v-tooltip="linkInfoParsed.date" style="width: 100px; padding-left: 10px;">
            {{ new Date().toLocaleDateString() }}
          </td>
        </tr>
        <tr v-else>
          <td class="divider" style="width: 300px; padding: 0;">
            <input
                ref="urlInput"
                v-model="url"
                class="url-input"
                type="text"
                placeholder="Введите URL"
                @keydown.enter="handleEnter"
                style="text-align: left; width: 100%; height: 100%; border: none; padding: 0; margin: 0;"
            />
          </td>
          <td style="width: 30px; display: flex; justify-content: center; align-items: center; padding: 0;">
            <div class="favicon-container">
              <img src="/lpicon.png" alt="Favicon" width="20" height="20" />
            </div>
          </td>
          <td style="width: 400px; padding: 0;"></td>
          <td style="width: 200px; padding: 0;"></td>
          <td style="width: 200px; padding: 0;"></td>
          <td class="divider placeholder-text" style="width: 80px; margin-left: 5px;"></td>
        </tr>
        </tbody>
      </v-table>

    </div>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import * as cheerio from 'cheerio';
// import saveFavicon from '../../moduls/saveFavicon.js'

export default {
  name: 'MainRowTool',
  props: {
    buttonColor: {
      type: String,
      default: 'red',
    },
  },
  setup(props, { emit }) {
    const isFetching = ref(false);
    const buttonColor = ref('red'); // Начальный цвет кнопки
// Метод для изменения цвета кнопки

    const changeButtonColor = (newColor) => {
      buttonColor.value = newColor;
    };

    const url = ref('');
    const linkInfo = ref('');
    const statusMessage = ref('');
    const urlInput = ref(null);
    const buttonLabel = ref('URL');
    const buttonLabelOk = ref('LinZer');
    const isCleared = ref(false); // Флаг для отслеживания состояния очистки
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
          favicon: '/lpicon.png' || null,
          // favicon: saveFavicon(info.url) | '/lpicon.png',
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
        return info;
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
        return { error: 'Ошибка при получении информации' };
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
            links: [url],
          }),
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
          keywords: '',
        };
        return result;
      } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return { error: 'Ошибка при получении информации' };
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
          buttonLabel.value = 'URL'; // Возврат текста кнопки
          linkInfo.value = 'Это не URL';
        }
      } else {
        buttonLabel.value = 'URL'; // Возврат текста кнопки
        linkInfo.value = 'Это не URL';
      }
    };

    const clearFields = () => {
      // Данный код представляет собой функцию clearFields,
      //     которая очищает значения нескольких переменных, связанных с
      // URL и информацией о ссылках. Она сбрасывает текст кнопки и
      // очищает таблицу, а также другие связанные поля.
      // Удаляем обработчик контекстного меню
      // urlInput.value.removeEventListener('contextmenu', handleContextMenu);

      url.value = '';
      linkInfo.value = '';
      statusMessage.value = '';
      buttonLabel.value = 'URL'; // Сброс текста кнопки
      linkInfoParsed.value = null;
      // Восстанавливаем обработчик контекстного меню через 100 миллисекунд
      setTimeout(() => {
        urlInput.value.addEventListener('contextmenu', handleContextMenu);
      }, 100);
    };

    const handleContextMenu = (event) => {
      // Данный код обрабатывает событие контекстного меню (обычно
      // вызываемое правым кликом мыши). При вызове этого события он
      // предотвращает стандартное поведение (появление контекстного меню) и
      // считывает текст из буфера обмена, после чего устанавливает этот текст в
      // переменную url.value.
      event.preventDefault();
      clearFields(); // очищаем поля перед вставкой
      navigator.clipboard.readText().then((text) => {
        url.value = text; // вставляем текст из буфера
      });
    };

    const handleEnter = () => {
      if (url.value) {
        handleButtonClick();
      }
    };

    const buttonColorClass = computed(() => {
      return props.buttonColor === 'purple' ? 'purple-button' : 'red-button';
    });

    onMounted(() => {
      // Здесь можно добавить слушатель событий смена цвета основной кнопки
      window.addEventListener('changeButtonColor', (event) => changeButtonColor(event.detail));

      urlInput.value.focus();
      urlInput.value.addEventListener('contextmenu', handleContextMenu );


    });

    const handleClearStatus = () => {
      statusMessage.value = '';
    };


    // Метод для обрезки текста
    const truncateText = (text, length = 30) => {
      if (text.length <= length) {
        return { truncated: text, remainder: '' };
      }
      const truncated = text.slice(0, length) + '...';
      const remainder = text.slice(length);
      return { truncated, remainder };
    };

    return {
      buttonColorClass,
      isFetching,
      buttonColor,
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
      buttonLabelOk,
      truncateText, // Экспортируем метод
    };
  },
};
</script>


<style scoped>
.text-ellipsis {
  white-space: nowrap; /* Запрет на перенос строк */
  overflow: hidden; /* Скрытие переполненного текста */
  text-overflow: ellipsis; /* Добавление многоточия в конце переполненного текста */
}
.favicon-container {
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}
.url-input {
  margin-right: 20px;
  color: black;
  background: white;
  border: 2px solid red;
  transition: border-color 0.3s;
  width: 300px;
}
.url-input:hover {
  border-color: green;
}
.url-input:focus {
  border-color: green;
}
.red-button {
  background-color: red;
  color: white;
}
.purple-button {
  background-color: purple; /* Цвет для фиолетовой кнопки */
}
.fixed-size-button {
  width: 120px;
  height: 20px;
  min-width: 120px;
  min-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.clear-button {
  color: white;
}


.divider {
  border-right: 1px solid white; /* Добавляем белую границу справа для разделителей */

}

.divider:last-child {
  border-right: none; /* Убираем границу у последнего столбца */
}

</style>