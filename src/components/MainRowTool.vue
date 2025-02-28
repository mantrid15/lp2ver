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
        <span>LinZer</span>
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
            <td class="divider" style="width: 300px; border: 1px solid white; padding: 0;">
              <input ref="urlInput" v-model="url" class="url-input" type="text" placeholder="Введите URL" @keydown.enter="handleButtonClick" style="text-align: left; width: 100%; height: 100%; border: none; padding: 0; margin: 0;" />
            </td>
            <td class="divider"
                style="width: 30px; border: 1px solid white; display: flex; justify-content: center; align-items: center; padding: 0;">
              <div class="favicon-container">
                <img :src="currentLink.favicon || '/lpicon.png'"
                     alt="Favicon"
                     width="18"
                     height="18" />
              </div>
            </td>
            <td class="divider" style="width: 400px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span class="scrolling-text" v-tooltip="currentLink.title || ''">
                  <span class="text-ellipsis" style="margin-left: 5px">{{ currentLink.title ? truncateText(currentLink.title, 30).truncated : '' }}</span>
                </span>
            </td>
            <td class="divider" style="width: 200px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
                <span class="scrolling-text" v-tooltip="currentLink.description || ''">
                  <span class="text-ellipsis" style="margin-left: 5px">{{ currentLink.description ? truncateText(currentLink.description, 20).truncated : '' }}</span>
                </span>
            </td>
            <td class="divider" style="width: 150px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
                <span class="scrolling-text" v-tooltip="currentLink.keywords?.join(', ') || ''">
                  <span class="text-ellipsis" style="margin-left: 5px">{{ currentLink.keywords ? truncateText(currentLink.keywords.join(', '), 20).truncated : '' }}</span>
                </span>
            </td>
            <td class="divider" v-tooltip="currentLink.date || ''" style="width: 100px; border: 1px solid white; padding-left: 10px;">
              {{ currentLink.date ? new Date(currentLink.date).toLocaleDateString() : new Date().toLocaleDateString() }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <v-snackbar v-model="snackbar"
                :timeout="3000" class="custom-snackbar">
      {{ snackbarMessage }}
      <v-btn color="pink"
             text
             @click="snackbar = false"
             style="top: 20px; right: 20px; width: 100px; height: 200px;">
        Закрыть
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, onMounted, computed, nextTick } from 'vue';
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
    const userId = computed(() => store.state.userId);
    const isFetching = ref(false);
    const snackbar = ref(false);
    const snackbarMessage = ref('');
    const url = ref('');
    const currentLink = ref({
      url: '',
      favicon: '',
      title: '',
      rss:'',
      lang:'',
      description: '',
      keywords: [],
      date: new Date().toISOString(),
    });
    const urlInput = ref(null);
    const statusMessage = ref('');
    const timer = ref(null); // Таймер для очистки данных


    // Вычисляемое свойство для buttonColorClass
    const buttonColorClass = computed(() => {
      return props.buttonColor === 'purple' ? 'purple-button' : 'red-button';
    });

    const showSnackbar = (message) => {
      snackbarMessage.value = message;
      snackbar.value = true;
    };

    const isValidURL = (string) => {
      console.log(string);
      // Регулярное выражение для проверки URL
      const regex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/i;
      console.log(regex.test(string));
      return regex.test(string);
    };

    const getDomainName = (url) => {
      try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname;
        if (domain.startsWith('www.')) {
          domain = domain.slice(4);
        }
        return domain;
      } catch (error) {
        console.error('Ошибка при извлечении доменного имени:', error);
        return '';
      }
    };

    const clearFields = async () => {
      currentLink.value = {
        url: '',
        favicon: '',
        title: '',
        description: '',
        keywords: [],
        date: new Date().toISOString(),
      };
      await nextTick();
      if (urlInput.value) {
        urlInput.value.focus();
      }
    };

    const handleButtonClick = async () => {
      const userIdValue = userId.value;
      if (!userIdValue) {
        showSnackbar('Незарегистрированный пользователь. Демо-режим.');
        return;
      }
      if (!isValidURL(url.value)) {
        showSnackbar('Ссылка не ссылка!!!');
        return;
      }
      // Очищаем текущие данные перед вставкой новых
      clearFields();
      // Получаем данные
      const domainName = getDomainName(url.value);
      const faviconName = domainName;
      const faviconHash = await hashString(faviconName);
      const urlHash = await hashString(url.value);

      try {
        const pageInfo = await getPageInfo(url.value);
        const metaData = await fetchMetaData(url.value);
        const puppeteerData = await getPuppeteerData(url.value);

        const finalData = {
          url: url.value,
          title: pageInfo.title || metaData.title || puppeteerData.title || '',
          description: pageInfo.description || metaData.description || puppeteerData.description || '',
          keywords: pageInfo.keywords || metaData.keywords || puppeteerData.keywords || null,
          favicon: `https://${domainName}/favicon.ico`,
          date: new Date().toISOString(),
        };

        // Обновляем currentLink
        currentLink.value = finalData;

        // Запускаем таймер на 5 секунд
        if (timer.value) {
          clearTimeout(timer.value); // Сбрасываем предыдущий таймер, если он есть
        }
        timer.value = setTimeout(() => {
          clearFields(); // Очищаем данные через 5 секунд
        }, 5000);
      } catch (error) {
        showSnackbar(error.message);
      }
    };

    const truncateText = (text, length = 30) => {
      if (text.length <= length) {
        return { truncated: text, remainder: '' };
      }
      const truncated = text.slice(0, length) + '...';
      const remainder = text.slice(length);
      return { truncated, remainder };
    };

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


    // Обработка данных из WebSocket
    const handleWebSocketData = async (data) => {

        if (data.url && data.title) {
          // Очищаем текущие данные перед вставкой новых
          clearFields();
        const urlHash = await hashString(data.url)
        const faviconName = getDomainName(data.url);
        const faviconHash = await hashString(faviconName);
        const favicon = data.favicon || `/lpicon.png`;

              // Обновляем currentLink

        currentLink.value = {
          url: data.url,
          title: data.title,
          url_hash: urlHash,
          description: data.description || '',
          rss: data.rss,
          lang: data.lang,
          keywords: data.keywords || [],
          favicon_name: faviconName,
          favicon_hash: faviconHash,
          date: new Date().toISOString(),
        };
        console.log(currentLink)
        // Проверка существования url_hash в таблице links
        const { data:  existingLinks, error: checkError } = await supabase
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
        const { error: linkError } = await supabase
            .from('links')
            .insert([currentLink]);
        if (linkError) {
          console.error('Ошибка при отправке данных в Supabase:', linkError);
          showSnackbar('Не удалось отправить данные. Попробуйте снова.');
        } else {
          console.log('Данные успешно отправлены!');
          showSnackbar('Данные успешно отправлены!');
          clearFields();
        }
        // Запускаем таймер на 5 секунд
        if (timer.value) {
          clearTimeout(timer.value); // Сбрасываем предыдущий таймер, если он есть
        }
        timer.value = setTimeout(() => {
          clearFields(); // Очищаем данные через 5 секунд
        }, 5000);
      }
    };

    onMounted(() => {
      const ws = new WebSocket('ws://localhost:3000');
      ws.onopen = () => {
        console.log('WebSocket соединение установлено');
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.url && data.title) {
          handleWebSocketData(data);
        }
      };
      ws.onclose = () => {
        console.log('WebSocket соединение закрыто');
      };
      ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
      };

      if (urlInput.value) {
        urlInput.value.focus();
      }
    });

    return {
      currentLink,
      snackbar,
      snackbarMessage,
      isFetching,
      url,
      urlInput,
      handleButtonClick,
      clearFields,
      truncateText,
      showSnackbar,
      buttonColorClass, // Возвращаем buttonColorClass
      statusMessage, // Возвращаем statusMessage
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
  color: black !important;
  position: inherit;
  top: 10px;
  right: 20px;
  z-index: 200;
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