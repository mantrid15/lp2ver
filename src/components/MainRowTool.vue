
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
        <span v-if="statusMessage">
          {{ buttonLabelOk }}
          <span style="background-color: blue;
          color: white; border-radius: 9px;
          padding: 5px; margin-left: 5px;
          border: 1px solid white; font-size: 9px;
          padding-bottom: 3px">
            {{ statusMessage }}
          </span>
        </span>
        <span v-else style="display: flex; justify-content: center; align-items: center; margin-right: 10px">
          {{ buttonLabel }}
          <v-img :src="statusMessage ? '/path/to/your/icon.png' : '/lpicon.png'"
                 alt="URL Icon"
                 width="20" height="20"
                 style="margin-left: 10px" />
        </span>
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
        <tr v-if="linkInfoParsed">
          <td style="width: 300px;" class="divider">
            <a :href="linkInfoParsed.url"
               target="_blank"
               rel="noopener noreferrer"
               style="display: flex;
               justify-content: start;
               padding-right: 10px;">
                <span class="text-ellipsis"
                      style="display: block;
                      overflow: hidden;
                      white-space: nowrap;
                      text-overflow: ellipsis;">
                  {{ truncateText(linkInfoParsed.url, 30).truncated }}
                </span>
            </a>
          </td>
          <td class="divider"
              style="width: 30px; display: flex; justify-content: center; align-items: center; padding: 0;">
            <div class="favicon-container">
              <img src="/lpicon.png"
                   alt="Favicon"
                   width="18"
                   height="18" />
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
              <span class="scrolling-text" v-tooltip="linkInfoParsed.keywords.join(', ')">
                <span class="text-ellipsis" style="margin-left: 5px">{{ truncateText(linkInfoParsed.keywords.join(', '), 20).truncated }}</span>
              </span>
          </td>
          <td class="divider" v-tooltip="linkInfoParsed.date" style="width: 100px; padding-left: 10px;">
            {{ new Date().toLocaleDateString() }}
          </td>
        </tr>
        <tr v-else>
          <td class="divider" style="width: 300px; padding: 0;">
            <input ref="urlInput" v-model="url" class="url-input" type="text" placeholder="Введите URL" @keydown.enter="handleEnter" style="text-align: left; width: 100%; height: 100%; border: none; padding: 0; margin: 0;" />
          </td>
          <td style="width: 30px; display: flex; justify-content: center; align-items: center; padding: 0;">
            <div class="favicon-container">
              <img src="/lpicon.png" alt="Favicon" width="18" height="18" />
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
        const keywords = $('meta[name="keywords"]').attr('content') || ''; // Получаем ключевые слова
        return {
          url,
          title: $('title').text(),
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

    const getInfo = async () => {
      if (isValidURL(url.value)) {
        try {
          let info = await getPageInfo(url.value);
          if (info.error) {
            statusMessage.value = '2';
            info = await fetchMetaData(url.value);
          } else {
            statusMessage.value = '1';
          }
          if (info.error) {
            statusMessage.value = '3';
            info = await fetchMetaSerp(url.value);
          }
          if (info.error) {
            info = { url: url.value, title: '', description: '', keywords: '' };
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
        await getInfo();
        parseLinkInfo();
        const userIdValue = userId.value;
        console.log('User ID:', userIdValue);

        if (!userIdValue) {
          showSnackbar('Незарегистрированный пользователь. Демо-режим.');
          return; // Завершаем выполнение, если пользователь не зарегистрирован
        }

        try {
          showSnackbar('Url is sending to Supabase!!!');
          snackbar.value = true;
          const urlHash = await hashString(linkInfoParsed.value.url); // Рассчитываем url_hash
          console.log('Calculated url_hash:', urlHash);

          // Проверка существования url_hash в таблице links
          const { data: existingLinks, error: checkError } = await supabase
              .from('links')
              .select('url_hash')
              .eq('url_hash', urlHash);

          if (checkError) {
            console.error('Ошибка при проверке url_hash:', checkError);
            snackbarMessage.value = 'Не удалось проверить существование ссылки. Попробуйте снова.';
            snackbar.value = true;
            return; // Завершаем выполнение, если произошла ошибка
          }

          if (existingLinks.length > 0) {
            console.log('Такая ссылка в базе уже есть!!!');
            snackbarMessage.value = 'Такая ссылка в базе уже есть!!!';
            snackbar.value = true;
            clearFields();
            return; // Завершаем выполнение, если ссылка уже существует
          }

          // Здесь уведомляем пользователя о том, что данные отправляются в Supabase
          showSnackbar('Url is sending to Supabase!!!');
          snackbar.value = true;

          const randomId = generateUid();
          const faviconHash = await hashString(randomId); // Хеш для favicon_hash

          // Данные для таблицы favicons
          const faviconData = {
            favicon_hash: faviconHash,
            favicon_name: randomId,
            storage_path: '', // Укажите путь, если необходимо
            user_id: userIdValue,
          };
          console.log('Favicon Data:', faviconData);

          // Отправляем данные в таблицу favicons
          const { data: faviconDataResponse, error: faviconError } = await supabase.from('favicons').insert([faviconData]);
          if (faviconError) {
            console.error('Ошибка при отправке данных в таблицу favicons:', faviconError);
            snackbarMessage.value = 'Не удалось отправить данные favicon. Попробуйте снова.';
            snackbar.value = true;
            return; // Завершаем выполнение, если произошла ошибка
          }

          // Данные для таблицы links
          const linkData = {
            date: new Date().toISOString(), // Используем ISO формат
            url_hash: urlHash, // Используем рассчитанный url_hash
            favicon_name: randomId,
            url: linkInfoParsed.value.url,
            title: linkInfoParsed.value.title,
            description: linkInfoParsed.value.description.trim(),
            title_translation: '',
            keywords: Array.isArray(linkInfoParsed.value.keywords) && linkInfoParsed.value.keywords.length > 0
                ? linkInfoParsed.value.keywords
                : null, // Возвращаем null, если список пустой
            ai_tag: '',
            favicon_hash: faviconHash, // Используем хеш для favicon_hash
            user_id: userIdValue, // Используем извлеченное значение
            dir_hash: '', // Укажите dir_hash, если необходимо
            subdir_hash: '', // Укажите subdir_hash, если необходимо
          };
          console.log('Link Data:', linkData);

          // Отправляем данные в таблицу links
          const { data: linkDataResponse, error: linkError } = await supabase
              .from('links')
              .insert([linkData])
              .select(); // Запрос на возврат вставленных данных

          if (linkError) {
            console.error('Ошибка при отправке данных в Supabase:', linkError);
            showSnackbar('Не удалось отправить данные. Попробуйте снова.');
          } else {
            console.log('Данные успешно отправлены:', linkDataResponse);
            showSnackbar('Данные успешно отправлены!');
            clearFields();
          }
        } catch (error) {
          console.error('Произошла ошибка:', error);
          showSnackbar('Произошла ошибка. Попробуйте снова.');
        }
      } else {
        await fetchPageInfo();
      }

      // Устанавливаем фокус на поле ввода после обработки
      await nextTick(); // Ждем, пока обновится DOM
      if (urlInput.value) {
        urlInput.value.focus(); // Устанавливаем фокус, если элемент доступен
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
      window.addEventListener('changeButtonColor', (event) => changeButtonColor(event.detail));
      if (urlInput.value) {
        urlInput.value.focus(); // Устанавливаем фокус на поле ввода
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