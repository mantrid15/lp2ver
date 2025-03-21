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
          <td class="divider" style="width: 300px; border: 1px solid white; padding: 0;">
            <input ref="urlInput" v-model="url" class="url-input" type="text" placeholder="Введите URL" @keydown.enter="handleEnter" style="text-align: left; width: 100%; height: 100%; border: none; padding: 0; margin: 0;" />
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
  <span class="scrolling-text" v-tooltip="Array.isArray(tableData?.title) ? tableData.title.join(', ') : tableData?.title || ''">
    <span class="text-ellipsis" style="margin-left: 5px">{{ tableData?.title ? truncateText(tableData.title, 30).truncated : '' }}</span>
  </span>
          </td>
          <td class="divider" style="width: 200px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
  <span class="scrolling-text" v-tooltip="Array.isArray(tableData?.description) ? tableData.description.join(', ') : tableData?.description || ''">
    <span class="text-ellipsis" style="margin-left: 5px">{{ tableData?.description ? truncateText(tableData.description, 20).truncated : '' }}</span>
  </span>
          </td>
          <td class="divider" style="width: 150px; border: 1px solid white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0;">
  <span class="scrolling-text" v-tooltip="Array.isArray(tableData?.keywords) ? tableData.keywords.join(', ') : tableData?.keywords || ''">
    <span class="text-ellipsis" style="margin-left: 5px">{{ tableData?.keywords ? truncateText(tableData.keywords, 20).truncated : '' }}</span>
  </span>
          </td>
          <td class="divider" v-tooltip="tableData?.date || ''" style="width: 100px; border: 1px solid white; padding-left: 10px;">
            {{ tableData?.date ? new Date(tableData.date).toLocaleDateString() : new Date().toLocaleDateString() }}
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
import {ref, onMounted, computed, nextTick} from 'vue';
import axios from 'axios';
import * as cheerio from 'cheerio';
import {supabase} from "@/clients/supabase";
import {useStore} from 'vuex';
import nlp from 'compromise';
import fs from 'fs';
// import path from 'path';
import { Buffer } from 'buffer';
// import dotenv from 'dotenv';
// import stopword from 'stopword';
// import natural from 'natural';
export default {
  name: 'MainRowTool',
  props: {
    buttonColor: {
      type: String,
      default: 'red',
    },
  },
  setup(props, {emit}) {
    const store = useStore();
    const userId = computed(() => store.state.userId); // Получите userId из Vuex
    const isFetching = ref(false);
    const buttonColor = ref('red');
    const snackbar = ref(false);
    const snackbarMessage = ref('');
    const url = ref('');
    const keywords = ref('');
    const rss = ref('');
    const lang = ref('');
    const favicon = ref('');
    const title = ref('');
    const description = ref('');
    const linkInfo = ref('');
    const statusMessage = ref('');
    const urlInput = ref(null);
    const buttonLabel = ref('URL');
    const buttonLabelOk = ref('LinZer');
    const linkInfoParsed = ref(null);
    const tableData = ref({
      title: '',
      description: '',
      keywords: [],
      date: '',
    });
    // определение совокупности ключевых слов, которые нужно заменить на null
    const keywordsToNull = {
      "RUTUBE, видео, клипы, сериалы, кино, трейлеры, фильмы, мультфильмы, онлайн, рутьюб, рутуб": true,
      "видео, поделиться, телефон с камерой, телефон с видео, бесплатно, загрузить": true,
    };
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // dotenv.config({ path: '.env.local' });
    async function generateTagsNlp(title, description, keywords = []) {
      // Функция для фильтрации общеупотребительных терминов
      const isCommonTerm = (term) => {
        const commonTerms = [
          'и', 'в', 'на', 'с', 'по', 'для', 'это', 'что', 'как', 'we', 'to', 'you', 'your', '!',
          'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'simplify',
          'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
          'if', 'then', 'else', 'but', 'or', 'because', 'since', 'until',
          'while', 'for', 'in', 'of', 'about', 'at', 'as', 'by', 'with',
          'from', 'to', 'up', 'down', 'over', 'under', 'after', 'before',
          'between', 'among', 'within', 'without', 'through', 'during',
          'along', 'across', 'against', 'around', 'near', 'about', 'above',
          'below', 'beyond', 'outside', 'inside', 'usage'
        ];
        return commonTerms.includes(term.toLowerCase());
      };
      // Функция для фильтрации существительных
      const filterTermsAndNouns = (words) => {
        const filteredTerms = [];
        words.forEach(word => {
          const doc = nlp(word);
          if (doc.nouns().length > 0) {
            filteredTerms.push(word);
          }
        });
        return filteredTerms;
      };
      // Преобразуем keywords в строку, если это массив
      if (Array.isArray(keywords)) {
        keywords = keywords.join(' ');
      }
      // Убираем лишние пробелы
      keywords = keywords.trim();
      // Объединяем title, description и keywords в одну строку
      let combinedText = `${title} ${description} ${keywords}`;
      // Заменяем запятые на пробелы и преобразуем в нижний регистр
      combinedText = combinedText.replace(/,/g, ' ').toLowerCase();
      const wordsArray = combinedText.split(/\s+/);

      // Удаляем дубликаты и фильтруем существительные
      const uniqueWords = [...new Set(filterTermsAndNouns(wordsArray))].filter(word => !isCommonTerm(word));
      const cleanedArray = uniqueWords.map(item =>
          item.replace(/[^А-Яа-яЁёA-Za-z0-9\s]/g, '')
      );

      // Ограничиваем количество тегов до трех
      return cleanedArray.slice(0, 3);
    }

    // Функция для загрузки изображения в Supabase Storage
    // Main.vue
    const uploadFaviconToSupabase = async (faviconUrl, faviconName, faviconHash) => {
      let filePath; // Объявляем переменную filePath заранее

      try {
        console.log('Попытка загрузки фавикона:', faviconUrl);

        // Изменяем faviconName: делаем символ перед точкой заглавным и убираем точку
        const parts = faviconName.split('.');
        const modifiedFaviconName = parts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        // Извлекаем расширение из faviconUrl
        const urlParts = faviconUrl.split('/').pop();
        const fileExtension = urlParts.split('.').pop();
        const trimmedFileExtension = fileExtension.length > 3 ? fileExtension.substring(0, 3) : fileExtension;

        // Формируем путь к файлу
        filePath = `${modifiedFaviconName}.${trimmedFileExtension}`;
        console.log('1. Путь к файлу:', filePath);

        // Получаем изображение по URL
        const response = await fetch(faviconUrl, { mode: 'no-cors' });
        const blob = await response.blob();
        console.log('2. Файл будет сохранен с именем:', filePath);

        // Создаем объект File
        const file = new File([blob], filePath, { type: `image/${trimmedFileExtension}` });
        console.log('3. Файл будет с именем:', filePath);

        // Загружаем файл в Supabase
        const { data, error } = await supabase
            .storage
            .from('favibucket')
            .upload(filePath, file);

        // Обработка ошибок загрузки
        if (error) {
          const status = error.status || 'unknown'; // Проверка на наличие status
          if (status === 403) {
            console.error('Ошибка 403: Доступ запрещен. Проверьте права доступа к бакету.');
          } else if (status === 404) {
            console.error('Ошибка 404: Бакет не найден. Проверьте имя бакета.');
          } else if (status === 409) {
            console.error('Ошибка 409: Ресурс уже существует. Попробуйте использовать другое имя файла.');
          } else {
            console.error('Ошибка при загрузке файла в Supabase:', error);
          }

          return filePath; // Возвращаем filePath при ошибке
        } else {
          console.log('Файл успешно загружен в Supabase:', data);
        }

        return filePath; // Возвращаем путь к файлу
      } catch (error) {
        console.error('Ошибка при загрузке фавикона:', error);
        return filePath; // Возвращаем filePath при исключении
      }
    };

    const updateTableData = (linkData) => {
      if (!linkData) {
        console.error('Invalid data provided to updateTableData');
        return;
      }
      tableData.value = getTableData(linkData);
    };
    const getTableData = (lnkDt) => {
      return {
        title: lnkDt.title || '',
        description: lnkDt.description || '',
        keywords: lnkDt.keywords || [],
        date: lnkDt.date || new Date().toISOString(),
      };
    };

    const receiveUrlFromExtension = async (receivedUrl) => {
      url.value = receivedUrl;
      await handleButtonClick(); // Обрабатываем URL и отправляем в Supabase
    };

    const showSnackbar = (message) => {
      snackbarMessage.value = message || 'An error occurred';
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
          favicon: info.favicon || '',
          rss: info.rss || '',
          lang: info.lang || ''
        };
      } catch (error) {
        console.error('Ошибка при парсинге linkInfo:', error);
        linkInfoParsed.value = null;
      }
    };
    // это первый и основной запрос на получение  мета
    const getPageInfo = async (url) => {
      try {
        const response = await axios.get(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
        const $ = cheerio.load(response.data);

        // Получаем заголовок из тега <title> в любом месте документа
        const documentTitle = $('title').text();
        const headTitle = $('html head title').text();
        const title = headTitle || documentTitle || '';

        const keywords = $('meta[name="keywords"]').attr('content') || '';
        const description = $('meta[name="description"]').attr('content') || '';
        let favicon = $('link[rel="icon"]').attr('href') || ''; // Получаем favicon
        const rss = $('link[type="application/rss+xml"]').attr('href') || ''; // Получаем RSS
        const lang = $('html').attr('lang') || ''; // Получаем язык страницы

        const icons = [];
        $('link[rel*="icon"], link[rel*="apple-touch-icon"]').each((i, el) => {
          const href = $(el).attr('href');
          const sizes = $(el).attr('sizes');
          const rel = $(el).attr('rel');
          if (href) {
            icons.push({href, sizes, rel});
          }
        });

        // Проверка и обработка фавикона
        // Если favicon не найден, выбираем наиболее подходящую иконку
        if (!favicon || !favicon.startsWith('http')) {
          if (icons.length > 0) {
            // Сортируем иконки по размеру
            icons.sort((a, b) => {
              const sizeA = a.sizes ? parseInt(a.sizes.split('x')[0]) : 0;
              const sizeB = b.sizes ? parseInt(b.sizes.split('x')[0]) : 0;
              return sizeA - sizeB;
            });

            // Выбираем иконку с размером 18x18, если нет, то 16x16, иначе ближайшую по размеру
            const preferredSizes = [18, 16];
            let selectedIcon = null;
            for (const size of preferredSizes) {
              selectedIcon = icons.find(icon => icon.sizes && parseInt(icon.sizes.split('x')[0]) === size);
              if (selectedIcon) break;
            }

            // Если не нашли иконку с предпочтительными размерами, берем первую из списка
            if (!selectedIcon && icons.length > 0) {
              selectedIcon = icons[0];
            }

            if (selectedIcon) {
              favicon = selectedIcon.href;
              if (!favicon.startsWith('http')) {
                const baseUrl = new URL(url).origin; // Получаем базовый URL
                favicon = new URL(favicon, baseUrl).href; // Создаем полный URL для фавикона
              }
            }
          }
        }

        // Формирование объекта данных
        const data = {
          url,
          title,
          description,
          keywords: !keywords ? [] : keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword !== ""),
          favicon,
          rss,
          lang
        };

        // Дополнительная проверка на длину данных
        if (title.length < 1) {
          data.title = ''; // Устанавливаем пустое значение, если нет заголовка
        }
        if (description.length < 1) {
          data.description = ''; // Устанавливаем пустое значение, если нет описания
        }
        if (data.keywords.length < 1) {
          data.keywords = []; // Устанавливаем пустой массив, если нет ключевых слов
        }

        console.log('Полученные данные из ЗАГОЛОВКОВ / HEAD:', data);
        return data;
      } catch (error) {
        console.error('Ошибка при получении информации (getPageInfo) о странице:', error);
        return {error: 'Ошибка при получении информации (getPageInfo)'};
      }
    };

    const fetchMetaData = async (url) => {
      try {
        const response = await axios.get(`https://tools.buzzstream.com/metaDataService?url=${encodeURIComponent(url)}`);
        return response.data;
      } catch (error) {
        console.error('Ошибка при получении данных: (fetchMetadata)', error);
        return {error: 'Ошибка при получении информации (fetchMetadata)'};
      }
    };

    const getPuppeteerData = async (url) => {
      try {
        const response = await axios.get(`http://localhost:3000/fetch-metadata?url=${encodeURIComponent(url)}`);
        console.log('Полученные мета-данные: (getPuppeteerData)', response.data);
        return response.data;
      } catch (error) {
        console.error('Ошибка при получении мета-данных: (getPuppeteerData)', error);
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
          body: JSON.stringify({links: [url]}),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const item = data.data.items[0];
        return {
          url: item.url,
          title: item.content.title.value,
          description: item.content.description.value,
          keywords: '',
          lang: '', // Убедитесь, что lang имеет значение по умолчанию
          rss: '', // Убедитесь, что rss имеет значение по умолчанию

        };
      } catch (error) {
        console.error('Ошибка при выполнении запроса: (fetchMetaSerp)', error);
        return {error: 'Ошибка при получении информации (fetchMetaSerp)'};
      }
    };

    const fetchData = async (fetchFunction, finalData) => {
      try {
        const data = await fetchFunction(url.value);
        // console.log('Данные:', data);
        // Логирование перед обновлением
        // console.log('Текущее состояние finalData перед обновлением:', finalData);
        updateFinalData(data, finalData);
        return data;
      } catch (error) {
        console.error('Ошибка:', error);
        finalData.error = error.message;
        return null;
      }
    };

    const updateFinalData = (data, finalData) => {
      if (!finalData) {
        console.error('finalData не определен');
        return;
      }
      if (data && typeof data === 'object') {
        finalData.title = data.title || finalData.title;
        finalData.description = data.description || finalData.description;
        finalData.keywords = data.keywords || finalData.keywords || '';
        finalData.lang = data.lang || finalData.lang || '';
        finalData.favicon = data.favicon || finalData.favicon || '';
        finalData.rss = data.rss || finalData.rss || '';
        if (data.error) finalData.error = data.error;
      } else {
        console.warn('Передан некорректный объект данных:', data);
      }
    };

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
        lang: '',
        rss: '',
        error: null,
      };
      // Массив функций для выполнения
      const fetchFunctions = [getPageInfo, fetchMetaSerp];
      // const fetchFunctions = [getPageInfo,fetchMetaSerp, fetchMetaData, getPuppeteerData];

      // Цикл по функциям
      for (const fetchFunction of fetchFunctions) {
        console.log(`Вызов функции: ${fetchFunction.name}`); // Логирование имени вызываемой функции
        await fetchData(fetchFunction, finalData);
        // Проверяем, был ли получен title после каждого запроса
        if (finalData.title) {
          // console.log('Title получен после запроса:', finalData.title);
          linkInfo.value = JSON.stringify(finalData, null, 2);
          // console.log('Финальная информация:', finalData);
          return;
        }
      }
      // Проверяем, есть ли ошибка в финальных данных
      if (finalData.error) {
        showSnackbar('Произошла ошибка: ' + finalData.error);
        return;
      }
      // Если нет ошибок, сохраняем данные
      linkInfo.value = JSON.stringify(finalData, null, 2);
      console.log('Финальная информация:', finalData);
    };

    const getDomainName = (url) => {
      try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname;
        // Удаляем 'www.' из доменного имени
        if (domain.startsWith('www.')) {
          domain = domain.slice(4);
        }

        return domain;
      } catch (error) {
        console.error('Ошибка при извлечении доменного имени:', error);
        return '';
      }
    };

    const handleButtonClick = async () => {
      // Проверяем URL через fetchPageInfo
      await fetchPageInfo();

      // Проверяем, является ли URL валидным
      if (!isValidURL(url.value)) {
        showSnackbar('Ссылка не ссылка!!!');
        return;
      }
      if (url.value) {
        const urlCheckResult = await checkUrlExistence(url.value);
        if (urlCheckResult.exists) {
          return; // Прекращаем выполнение, если URL уже существует
        }
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
        // console.log("Данные отправляемые на ДОПОДГОТОВКУ",linkInfoParsed.value)
        await processLinkData(linkInfoParsed.value);
      } catch (error) {
        console.error('Произошла ошибка:', error);
        showSnackbar('Произошла ошибка. Попробуйте снова.');
      }
      await delay(2000);
      await clearFields();

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
      tableData.value = ref({});

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

    function mergeUniqueLists(list1, list2) {
      // console.log("Список 1:", list1);
      // console.log("Список 2:", list2);
      // Проверка пустоты списков
      if (list1.length === 0 && list2.length === 0) {
        return "";
      }
      // Проверка на равенство списков
      if (list1.length === list2.length && list1.every((item, index) => item.toLowerCase() === list2[index].toLowerCase())) {
        return list1.join(", "); // Возвращаем первый список, если они одинаковые
      }
      const mergedList = [...list1]; // Создаем новый массив и копируем элементы из первого списка
      // Цикл по второму списку
      for (const item of list2) {
        // Проверяем, есть ли его версия в нижнем регистре в первом списке
        if (!mergedList.some(existingItem => existingItem.toLowerCase() === item.toLowerCase())) {
          mergedList.push(item); // Добавляем, если нет
        }
      }
      console.log("Объединенный список:", mergedList);
      return mergedList.join(", "); // Возвращаем объединённый список в виде строки
    }

    async function generateTags(title, description, keywords = "") {
      console.log("Отправка данных LLM для получения AITAG:", {title, description, keywords});
      try {
        const response = await axios.post('http://localhost:3000/generate-tags', {
          title,
          description,
          keywords,
        });
        console.log("Ответ от сервера - список AITAG:", response.data);
        return response.data.tags;
      } catch (error) {
        console.error("Ошибка при вызове сервера:", error.response ? error.response.data : error.message);
        return "";
      }
    }

    async function processLinkData(data) {
      const userIdValue = userId.value;
      const faviconName = getDomainName(data.url);
      const faviconHash = await hashString(faviconName);
      const title = data.title.trim();
      const resultStr = data.keywords.join(', ').trim();

      function setKeywords() {
        let keywords;
        if (keywordsToNull[resultStr]) {
          keywords = null;
        } else {
          keywords = data.keywords;
        }
        return keywords;
      }

      const keywords = setKeywords();
      const description = data.description ? data.description.trim() : null;

      let aiTag = null;
      if (title === '' || title === null || description === '' || description === null) {
        aiTag = null;
      } else {
        try {
          aiTag = await generateTagsNlp(title, description);
        } catch (error) {
          // Логируем ошибку или обрабатываем её по своему усмотрению
          console.error('Ошибка при вызове generateTags с await:', error);
          // Вызываем функцию без await
          aiTag = generateTags(title, description);
        }
      }

      // const aiTag = (title === '' || title === null) && (description === '' || description === null) ? null : await generateTags(title, description);
      const aiKeywords = (keywords === null || (Array.isArray(keywords) && keywords.length === 0)) ? aiTag : keywords;
      const finalKeywords = mergeUniqueLists(aiKeywords, aiTag);
      console.log("KEYWORDS FINAL", finalKeywords);

      const linkData = {
        date: new Date().toISOString(),
        url: data.url,
        title: title,
        url_hash: await hashString(data.url),
        description: description,
        keywords: finalKeywords,
        lang: data.lang || null,
        rss: data.rss || null,
        favicon_hash: faviconHash,
        favicon_name: faviconName,
        title_translation: '',
        ai_tag: aiTag,
        user_id: userIdValue,
        dir_hash: '',
        subdir_hash: '',
      };

      updateTableData(linkData);

      const {error: linkError} = await supabase
          .from('links')
          .insert([linkData]);

      if (linkError) {
        console.error('Ошибка при отправке данных в Supabase:', linkError);
        showSnackbar('Не удалось отправить данные. Попробуйте снова.');
      } else {
        console.log("Данные отправляемые в SUPABASE LINKS", linkData);
        console.log('Данные успешно отправлены!');
        showSnackbar('Данные успешно отправлены!');
      }

      const {data: existingFavicons, error: checkFaviconError} = await supabase
          .from('favicons')
          .select('favicon_hash')
          .eq('favicon_hash', faviconHash);

      if (checkFaviconError) {
        console.error('Ошибка при проверке favicon_hash:', checkFaviconError);
        // } else if (existingFavicons.length === 0) {
        //   if (storagePath) {
        //     const faviconData = {
        //       favicon_hash: faviconHash,
        //       favicon_name: faviconName,
        //       fav_url: data.favicon,
        //       storage_path: storagePath,
        //       user_id: userIdValue,
        //     };
      } else {
        console.log('Результат проверки favicon_hash:', existingFavicons.length > 0 ? 'Не уникален' : 'Уникален');
        const storagePath = await uploadFaviconToSupabase(data.favicon, faviconName, faviconHash);

        if (existingFavicons.length === 0) {
          const faviconData = {
            favicon_hash: faviconHash,
            favicon_name: faviconName,
            fav_url: data.favicon,
            storage_path: storagePath,
            user_id: userIdValue,
          };
          const {error: insertError} = await supabase
              .from('favicons')
              .insert([faviconData]);

          if (insertError) {
            console.error('Ошибка при вставке favicon_hash в favicons:', insertError);
          } else {
            console.log('favicon_hash успешно добавлен в favicons');
          }
        }
      }

      await delay(2000);
      await clearFields();
    }

    async function checkUrlExistence(url) {
      const urlHash = await hashString(url);
      const {data: existingLinks, error: checkError} = await supabase
          .from('links')
          .select('url_hash')
          .eq('url_hash', urlHash);

      if (checkError) {
        console.error('Ошибка при проверке url_hash:', checkError);
        return {exists: false, error: checkError};
      }

      if (existingLinks.length > 0) {
        console.log('URL уже существует в базе данных.');
        showSnackbar('URL уже существует в базе данных.');
        return {exists: true};
      }

      return {exists: false};
    }

    onMounted(() => {
      const ws = new WebSocket('ws://localhost:3000');
      ws.onopen = () => {
        console.log('WebSocket соединение установлено');
      };
      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Data received from WebSocket:', data)

        if (data.url) {
          const urlCheckResult = await checkUrlExistence(data.url);
          if (urlCheckResult.exists) {
            return; // Прекращаем выполнение, если URL уже существует
          }
          // Вызываем новую функцию для обработки данных
          // console.log('Data received from WebSocket:', data)
          await processLinkData(data);
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
        const {status, message} = event.detail;
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
        return {truncated: text, remainder: ''};
      }
      const truncated = text.slice(0, length) + '...';
      const remainder = text.slice(length);
      return {truncated, remainder};
    };

    function generateUid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    async function hashString(inputString) {
      const encoder = new TextEncoder();
      const data = encoder.encode(inputString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return {
      keywordsToNull,
      tableData,
      updateTableData,
      receiveUrlFromExtension,
      snackbar,
      snackbarMessage,
      buttonColorClass,
      isFetching,
      buttonColor,
      url,
      keywords,
      description,
      favicon,
      lang,
      rss,
      title,
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