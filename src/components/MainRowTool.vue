vue
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            <span class="headline">Проверка URL</span>
          </v-card-title>
          <v-card-text>
            <div class="input-module">
              <v-row class="input-container" align="center">
                <v-btn @click="clearFields" class="clear-button">Очистить</v-btn>
                <v-text-field
                    ref="urlInput"
                    v-model="url"
                    class="url-input"
                    placeholder="Введите URL"
                    @keydown.enter="handleEnter"
                    solo
                ></v-text-field>
                <v-btn
                    @click="fetchPageInfo"
                    class="red-button"
                    :class="{ 'active': isFetching }"
                >
                  Проверить URL
                </v-btn>
                <v-btn @click="getInfo" class="get-info-button">Получить информацию</v-btn>
                <v-btn class="red-button status-box" @click="handleClearStatus">{{ statusMessage || ' ' }}</v-btn>
              </v-row>
              <v-row>
                <v-col>
                  <div class="link-output">{{ pageInfo }}</div>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-textarea v-model="linkInfo" class="link-info" readonly></v-textarea>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
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
    const pageInfo = ref('');
    const linkInfo = ref('');
    const statusMessage = ref('');
    const urlInput = ref(null);

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
        return { error: 'Ошибка при получении информации' };
      }
    };

    const getInfo = async () => {
      if (isValidURL(pageInfo.value)) {
        try {
          let info = await getPageInfo(pageInfo.value);
          if (info.error) {
            statusMessage.value = '2';
            info = await fetchMetaData(pageInfo.value);
          } else {
            statusMessage.value = '1';
          }
          if (info.error) {
            statusMessage.value = '3';
            info = await fetchMetaSerp(pageInfo.value);
          }
          if (info.error) {
            info = {
              url: pageInfo.value,
              title: '',
              description: '',
              keywords: ''
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

    const clearFields = () => {
      url.value = '';
      pageInfo.value = '';
      linkInfo.value = '';
      statusMessage.value = '';
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      navigator.clipboard.readText().then((text) => {
        url.value = text;
      });
    };

    const handleEnter = () => {
      if (url.value) {
        fetchPageInfo();
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
      pageInfo,
      linkInfo,
      statusMessage,
      fetchPageInfo,
      clearFields,
      getInfo,
      urlInput,
      handleEnter,
      handleClearStatus,
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
.link-output {
  background-color: yellow;
  border: 1px solid blue;
  padding: 10px;
  margin-top: 10px;
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
.get-info-button {
  margin-left: 10px;
  background-color: lightblue;
  color: white;
}
</style>