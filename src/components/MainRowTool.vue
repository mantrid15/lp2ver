<template>
  <v-container>
    <div style="display: flex; align-items: center; overflow: hidden;">
      <v-btn @click="clearFields"
             class="clear-button"
             style="margin-right: 5px; background: green">
        <v-icon color="black"
                class="ma-2"
                size="large">mdi-delete</v-icon>
      </v-btn>
      <v-btn @click="handleButtonClick"
             :class="['fixed-size-button', buttonColorClass]"
             style="margin-right: 5px; padding: 5px;">
  <span>
    {{ buttonLabelOk }}
  </span>
        <v-img :src="statusMessage ? '/path/to/your/icon.png' : '/lpicon.png'"
               alt="URL Icon"
               width="20" height="20"
               style="margin-left: 10px" />
      </v-btn>

      <v-table style="width: 1000px;
      table-layout: fixed;
      overflow: hidden;
      background-color: transparent;
      border: 1px solid white;
      border-radius: 2px;"
               theme="dark"
               density="compact"
               fixed-header>
        <tbody>
        <tr>
          <td  class="divider" style="width: 300px; border: 1px solid white; padding: 0;">
<!--            <span class="text-ellipsis"
                  style="display: block;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;">-->
                      <input ref="urlInput" v-model="url" class="url-input" type="text" placeholder="Введите URL" @keydown.enter="handleEnter" style="text-align: left; width: 100%; height: 100%; border: none; padding: 0; margin: 0;" />

<!--          {{ linkInfoParsed ? truncateText(linkInfoParsed.url, 30).truncated : '' }}-->
<!--        </span>-->
<!--            <a :href="linkInfoParsed?.url || '#'"
               target="_blank"
               rel="noopener noreferrer"
               style="display: flex;
         justify-content: start;
         padding-right: 10px;">
            </a>-->
          </td>
          <td class="divider"
              style="width: 30px; border: 1px solid white; display: flex; justify-content: center; align-items: center; padding: 0;">
            <div class="favicon-container">
              <img src="/lpicon.png"
                   alt="Favicon"
                   width="18"
                   height="18" />
            </div>
          </td>
          <td class="divider" style="width: 400px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        <span class="scrolling-text" v-tooltip="linkInfoParsed?.title || ''">
          <span class="text-ellipsis" style="margin-left: 5px">{{ linkInfoParsed ? truncateText(linkInfoParsed.title, 30).truncated : '' }}</span>
        </span>
          </td>
          <td class="divider" style="width: 200px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
        <span class="scrolling-text" v-tooltip="linkInfoParsed?.description || ''">
          <span class="text-ellipsis" style="margin-left: 5px">{{ linkInfoParsed ? truncateText(linkInfoParsed.description, 20).truncated : '' }}</span>
        </span>
          </td>
          <td class="divider" style="width: 150px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
        <span class="scrolling-text" v-tooltip="linkInfoParsed?.keywords?.join(', ') || ''">
          <span class="text-ellipsis" style="margin-left: 5px">{{ linkInfoParsed ? truncateText(linkInfoParsed.keywords.join(', '), 20).truncated : '' }}</span>
        </span>
          </td>
          <td class="divider" v-tooltip="linkInfoParsed?.date || ''" style="width: 100px; border: 1px solid white; padding-left: 10px;">
            {{ linkInfoParsed ? new Date(linkInfoParsed.date).toLocaleDateString() : new Date().toLocaleDateString() }}
          </td>
        </tr>
<!--        <tr>-->
<!--          <td class="divider" style="width: 300px; border: 1px solid white; padding: 0;">-->
<!--            <input ref="urlInput" v-model="url" class="url-input" type="text" placeholder="Введите URL" @keydown.enter="handleEnter" style="text-align: left; width: 100%; height: 100%; border: none; padding: 0; margin: 0;" />-->
<!--          </td>-->
<!--          <td style="width: 30px; border: 1px solid white; display: flex; justify-content: center; align-items: center; padding: 0;">-->
<!--            <div class="favicon-container">-->
<!--              <img src="/lpicon.png" alt="Favicon" width="18" height="18" />-->
<!--            </div>-->
<!--          </td>-->
<!--          <td style="width: 400px; border: 1px solid white; padding: 0;"></td>-->
<!--          <td style="width: 200px; border: 1px solid white; padding: 0;"></td>-->
<!--          <td style="width: 200px; border: 1px solid white; padding: 0;"></td>-->
<!--          <td class="divider placeholder-text" style="width: 80px; border: 1px solid white; margin-left: 5px;"></td>-->
<!--        </tr>-->
        </tbody>
      </v-table>
    </div>
    <v-snackbar v-model="snackbar"
                :timeout="3000" class="custom-snackbar"
    >
      {{ snackbarMessage }}
      <v-btn color="pink"
             text
             @click="snackbar = false"
             style="top: 20px; right: 20px; width: 100px; height: 200px;"
      >Закрыть</v-btn>
    </v-snackbar>
  </v-container>
</template>
<script>
import {ref, onMounted, computed, nextTick} from 'vue';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from "@/clients/supabase";
import { useStore } from 'vuex';


export default {
  name: 'MainRowTool',
  props: {
    buttonColor: {
      type: String,
      default: 'red',
    },
  },
  setup(props, { emit }) {
    const store = useStore();
    const userId = computed(() => store.state.userId); // Получите userId из Vuex
    const isFetching = ref(false);
    const buttonColor = ref('red');
    const snackbar = ref(false);
    const snackbarMessage = ref('');
    const url = ref('');
    const linkInfo = ref('');
    const statusMessage = ref('');
    const urlInput = ref(null);
    const buttonLabel = ref('URL');
    const buttonLabelOk = ref('LinZer');
    const linkInfoParsed = ref(null);

    const receiveUrlFromExtension = async (receivedUrl) => {
      url.value = receivedUrl;
      await handleButtonClick(); // Обрабатываем URL и отправляем в Supabase
    };
    // const puppeteer = require('puppeteer-core');
    const showSnackbar = (message) => {
      snackbarMessage.value = message;
      snackbar.value = true;
    };

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
      return regex.test(string);
    };

    const parseLinkInfo = () => {
      try {
        const rawValue = linkInfo.value.replace(/^"|"$/g, '').replace(/\\n/g, '');
        const info = JSON.parse(rawValue);
        linkInfoParsed.value = {
          date: new Date().toLocaleString(),
          url: info.url || '',
          title: info.title || '',
          description: info.description || '',
          keywords: Array.isArray(info.keywords) && info.keywords.length > 0 ? info.keywords : [], // Проверка на null, пустую строку и отсутствие данных
          favicon: '/lpicon.png' || null,
        };
      } catch (error) {
        console.error('Ошибка при парсинге linkInfo:', error);
        linkInfoParsed.value = null;
      }
    };


    const getPageInfo = async (url) => {
      try {
        const response = await axios.get(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
        const $ = cheerio.load(response.data);

        // Получаем заголовок из тега <title> в любом месте документа
        const documentTitle = $('title').text();

        // Получаем заголовок строго по пути /html/head/title
        const headTitle = $('html head title').text();

        // Используем заголовок по пути /html/head/title, если он есть, иначе используем заголовок из документа
        const title = headTitle || documentTitle || '';

        const keywords = $('meta[name="keywords"]').attr('content') || ''; // Получаем ключевые слова
        console.log('Standard request:');
        return {
          url,
          title: title, // Возвращаем заголовок
          description: $('meta[name="description"]').attr('content') || '',
          keywords: keywords.length > 0 ? keywords.split(',') : null, // Возвращаем null, если список пустой
        };
      } catch (error) {
        console.error('Ошибка при получении информации о странице:', error);
        return { error: 'Ошибка при получении информации' };
      }
    };


    const fetchMetaData = async (url) => {
      try {
        const response = await axios.get(`https://tools.buzzstream.com/metaDataService?url=${encodeURIComponent(url)}`);
        return response.data;
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
        if (error.response) {
          console.error('Ответ сервера:', error.response.data);
        } else if (error.request) {
          console.error('Запрос был отправлен, но ответа не получено:', error.request);
        } else {
          console.error('Ошибка настройки запроса:', error.message);
        }
        return { error: 'Ошибка при получении информации' };
      }
    };

    const getPuppeteerData = async (url) => {
      try {
        const response = await axios.get(`http://localhost:3000/fetch-metadata?url=${encodeURIComponent(url)}`);
        console.log('Полученные мета-данные:', response.data);
        return  response.data;
      } catch (error) {
        console.error('Ошибка при получении мета-данных:', error);
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
          body: JSON.stringify({ links: [url] }),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const item = data.data.items[0];
        return {
          url: item.url,
          title: item.content.title.value,
          description: item.content.description.value,
          keywords: '',
        };
      } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return { error: 'Ошибка при получении информации' };
      }
    };
// Функция для обновления финальных данных
    const getInfo = async () => {
      if (!isValidURL(url.value)) {
        linkInfo.value = 'Некорректный URL.';
        return;
      }
      const finalData = {
        url: url.value,
        title: '',
        description: '',
        keywords: '',
        error: null
      };

      // Функция для обновления финальных данных
      const updateFinalData = (data) => {
        if (data && typeof data === 'object') {
          if (data.title !== undefined && data.title !== null && data.title !== "") {
            finalData.title = data.title;
          }
          if (data.description !== undefined && data.description !== null && data.description !== "") {
            finalData.description = data.description;
          }
          if (data.keywords !== undefined && data.keywords !== null && data.keywords !== "") {
            finalData.keywords = data.keywords;
          }
          if (data.error) {
            finalData.error = data.error;
          }
        } else {
          console.warn('Передан некорректный объект данных:', data);
        }
      };

      try {
        // 1. Получение данных из getPageInfo
        try {
          const pageInfo = await getPageInfo(url.value);
          console.log('Данные от getPageInfo:', pageInfo);
          updateFinalData(pageInfo);

          // Проверяем, получены ли title и description
          if (finalData.title && finalData.description) {
            console.log('Финальная информация:', finalData);
            linkInfo.value = JSON.stringify(finalData, null, 2);
            return; // Прекращаем выполнение функции
          }
        } catch (pageError) {
          console.error('Ошибка при получении данных от getPageInfo:', pageError);
          finalData.error = pageError.message;
        }

        // 3. Получение метаданных
        try {
          const metaData = await fetchMetaData(url.value);
          console.log('Данные от fetchMetaData:', metaData);
          updateFinalData(metaData);
        } catch (metaDataError) {
          console.error('Ошибка при получении метаданных:', metaDataError);
          finalData.error = metaDataError.message;
        }

        // 4. Получение данных через MetaSerp
        try {
          const metaSerpData = await fetchMetaSerp(url.value);
          console.log('Данные от fetchMetaSerp:', metaSerpData);
          updateFinalData(metaSerpData);
        } catch (metaSerpError) {
          console.error('Ошибка при получении данных через MetaSerp:', metaSerpError);
          finalData.error = metaSerpError.message;
        }

        // 2. Получение данных через Puppeteer
        try {
          const puppeteerInfo = await getPuppeteerData(url.value);
          console.log('Данные от getPuppeteerData:', puppeteerInfo);
          updateFinalData(puppeteerInfo);
        } catch (puppeteerError) {
          console.error('Ошибка при получении данных через Puppeteer:', puppeteerError);
          finalData.error = puppeteerError.message;
        }

        // Логирование финальной информации
        console.log('Финальная информация:', finalData);
        linkInfo.value = JSON.stringify(finalData, null, 2);
      } catch (error) {
        linkInfo.value = 'Ошибка при получении информации о странице: ' + error.message;
        console.error('Ошибка при получении информации о странице:', error);
      }
    };

    const handleButtonClick = async () => {
      // Проверяем URL через fetchPageInfo
      await fetchPageInfo();
      if (!isValidURL(url.value)) {
        showSnackbar('Ссылка не ссылка!!!');
        return;
      }

      // Если URL валиден, продолжаем выполнение основной логики
      await getInfo();
      parseLinkInfo();

      if (!linkInfoParsed.value || !linkInfoParsed.value.url) {
        showSnackbar('Не удалось получить информацию о странице');
        return;
      }

      const userIdValue = userId.value;
      if (!userIdValue) {
        showSnackbar('Незарегистрированный пользователь. Демо-режим.');
        return;
      }

      try {
        showSnackbar('Отправка URL в Supabase...');
        const urlHash = await hashString(linkInfoParsed.value.url);
        console.log('Calculated url_hash:', urlHash);

        // Проверка существования url_hash в таблице links
        const { data: existingLinks, error: checkError } = await supabase
            .from('links')
            .select('url_hash')
            .eq('url_hash', urlHash);
        if (checkError) {
          console.error('Ошибка при проверке url_hash:', checkError);
          showSnackbar('Не удалось проверить существование ссылки. Попробуйте снова.');
          return;
        }
        if (existingLinks.length > 0) {
          console.log('Такая ссылка в базе уже есть!');
          showSnackbar('Такая ссылка в базе уже есть!');
          clearFields();
          return;
        }

        // Подготовка данных для таблицы favicons
        const randomId = generateUid();
        const faviconHash = await hashString(randomId);
        const faviconData = {
          favicon_hash: faviconHash,
          favicon_name: randomId,
          storage_path: '',
          user_id: userIdValue,
        };
        console.log('Favicon Data:', faviconData);

        const { error: faviconError } = await supabase
            .from('favicons')
            .insert([faviconData]);
        if (faviconError) {
          console.error('Ошибка при отправке данных в таблицу favicons:', faviconError);
          showSnackbar('Не удалось отправить данные favicon. Попробуйте снова.');
          return;
        }

        // Подготовка данных для таблицы links
        const linkData = {
          date: new Date().toISOString(),
          url_hash: urlHash,
          favicon_name: randomId,
          url: linkInfoParsed.value.url,
          title: linkInfoParsed.value.title,
          description: linkInfoParsed.value.description.trim(),
          title_translation: '',
          keywords: (Array.isArray(linkInfoParsed.value.keywords) && linkInfoParsed.value.keywords.length > 0)
              ? linkInfoParsed.value.keywords
              : null,
          ai_tag: '',
          favicon_hash: faviconHash,
          user_id: userIdValue,
          dir_hash: '',
          subdir_hash: '',
        };
        console.log('Link Data:', linkData);

        const { error: linkError } = await supabase
            .from('links')
            .insert([linkData]);
        if (linkError) {
          console.error('Ошибка при отправке данных в Supabase:', linkError);
          showSnackbar('Не удалось отправить данные. Попробуйте снова.');
        } else {
          console.log('Данные успешно отправлены!');
          showSnackbar('Данные успешно отправлены!');
          clearFields();
        }
      } catch (error) {
        console.error('Произошла ошибка:', error);
        showSnackbar('Произошла ошибка. Попробуйте снова.');
      }

      // Возвращаем фокус на поле ввода
      await nextTick();
      if (urlInput.value) {
        urlInput.value.focus();
      } else {
        console.error('urlInput не найден или не смонтирован');
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

    const clearFields = async () => {
      url.value = '';
      linkInfo.value = '';
      statusMessage.value = '';
      buttonLabel.value = 'URL';
      linkInfoParsed.value = null;
      // Ждем, пока обновится DOM
      await nextTick();
      if (urlInput.value) {
        urlInput.value.focus(); // Устанавливаем фокус, если элемент доступен
      } else {
        console.error('urlInput не найден или не смонтирован');
      }

    };

    const handleContextMenu = (event) => {
      if (event.ctrlKey || event.shiftKey) {
        // Если нажата клавиша Ctrl или Shift, показываем стандартное меню
        return;
      }
      event.preventDefault(); // Отменяем стандартное контекстное меню
      navigator.clipboard.readText().then((text) => {
        url.value = text; // Вставляем текст из буфера обмена в поле ввода
        if (urlInput.value) {
          urlInput.value.focus(); // Устанавливаем фокус на поле ввода
        }
      }).catch(err => {
        console.error('Ошибка при получении текста из буфера обмена:', err);
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
      const ws = new WebSocket('ws://localhost:3000');
      ws.onopen = () => {
        console.log('WebSocket соединение установлено');
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.url) {
          url.value = data.url; // обновляем значение URL
          console.log('Получен URL от сервера:', data.url);
          // Если данные получены через WebSocket, автоматически вызываем handleButtonClick через 0.5 секунды
          setTimeout(() => {
            handleButtonClick();
          }, 500);
        }
      };
      ws.onclose = () => {
        console.log('WebSocket соединение закрыто');
      };
      ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
      };

      // Прослушивание события, диспатченного в content.js, для отображения уведомления через showSnackbar
      window.addEventListener("extensionPopup", (event) => {
        const { status, message } = event.detail;
        showSnackbar(message);
      });

      window.addEventListener('changeButtonColor', (event) => changeButtonColor(event.detail));
      if (urlInput.value) {
        urlInput.value.focus(); // установка фокуса на поле ввода
      }
      urlInput.value.addEventListener('contextmenu', handleContextMenu);
    });

    const truncateText = (text, length = 30) => {
      if (text.length <= length) {
        return { truncated: text, remainder: '' };
      }
      const truncated = text.slice(0, length) + '...';
      const remainder = text.slice(length);
      return { truncated, remainder };
    };

    function generateUid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    async function hashString(inputString) {
      // Преобразуем строку в массив байтов
      const encoder = new TextEncoder();
      const data = encoder.encode(inputString);

      // Вычисляем хэш
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Преобразуем хэш в массив байтов
      const hashArray = Array.from(new Uint8Array(hashBuffer));

      // Преобразуем массив байтов в шестнадцатеричную строку
      // const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return {
      receiveUrlFromExtension,
      snackbar,
      snackbarMessage,
      buttonColorClass,
      isFetching,
      buttonColor,
      url,
      urlInput,
      handleContextMenu,
      linkInfo,
      statusMessage,
      handleButtonClick,
      clearFields,
      handleEnter,
      linkInfoParsed,
      parseLinkInfo,
      buttonLabel,
      buttonLabelOk,
      truncateText,
      showSnackbar
    };
  },
};
</script>
<style scoped>
.v-table {
  background-color: transparent; /* Прозрачный фон для таблицы */
  border: none; /* Убираем границу */
}
.custom-snackbar {
  /*
  background-color: red !important; !* Красный фон *!
  */
  color: black !important; /* Черный текст */
  position: inherit; /* Фиксированное позиционирование */
  top: 10px; /* Отступ сверху */
  right: 20px; /* Отступ справа */
  z-index: 200; /* Убедитесь, что snackbar выше других элементов */
}
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