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
    <div class="info-container">
      <button @click="getInfo" class="get-info-button">GetInfo</button>
      <textarea v-model="infoOutput" class="info-output" readonly></textarea>
    </div>
    <div v-if="loading" class="loading-indicator">Загрузка...</div>
  </div>
</template>

<script>
import { ref } from 'vue';
import translate from 'translate-google'; // Убедитесь, что путь к функции перевода правильный
import axios from 'axios';
import cheerio from 'cheerio';

export default {
  name: 'LinkInput',
  setup() {
    const url = ref('');
    const pageInfo = ref('');
    const infoOutput = ref('');
    const loading = ref(false); // Индикатор загрузки

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
      return regex.test(string);
    };

    const fetchPageInfo = async () => {
      if (url.value) {
        if (isValidURL(url.value)) {
          pageInfo.value = url.value;
        } else {
          pageInfo.value = 'This not URL';
        }
      } else {
        pageInfo.value = 'Please enter a valid URL.';
      }
    };

    const clearFields = () => {
      url.value = '';
      pageInfo.value = '';
      infoOutput.value = '';
      loading.value = false; // Сброс индикатора загрузки
    };

    const getInfo = async () => {
      if (isValidURL(url.value)) {
        loading.value = true; // Устанавливаем индикатор загрузки
        try {
          const info = await getPageInfo(url.value);
          infoOutput.value = JSON.stringify(info, null, 2); // Форматируем вывод
        } catch (error) {
          infoOutput.value = 'Ошибка при получении информации';
        } finally {
          loading.value = false; // Сбрасываем индикатор загрузки
        }
      } else {
        infoOutput.value = 'Некорректный URL';
      }
    };

    const getPageInfo = async (url) => {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
          }
        });
        const $ = cheerio.load(response.data);
        const title = $('title').text();
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
        return {error: 'Ошибка при получении информации'};
      }
    };

    const translateText = async (text) => {
      try {
        return await translate(text, {to: 'ru'});
      } catch (err) {
        return 'Without translate';
      }
    };

    return {
      url,
      pageInfo,
      infoOutput,
      loading,
      fetchPageInfo,
      clearFields,
      getInfo,
    };
  },
};
</script>

<style scoped>

.input-module {
  width: 400px;
  height: auto;
  background-color: green;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  margin-bottom: 20px;
}
.input-container {
  display: flex;
  align-items: center;
}
.url-input {
  height: 30px;
  margin-right: 20px;
  padding: 5px;
}
.red-button {
  background-color: red;
  color: white;
  border: none;
  height: 30px;
  padding: 0 10px;
  cursor: pointer;
}
.red-button:hover {
  background-color: darkred;
}
.clear-button {
  background-color: purple;
  color: white;
  border: none;
  height: 30px;
  padding: 0 10px;
  cursor: pointer;
  margin-right: 10px;
}
.clear-button:hover {
  background-color: darkviolet;
}
.link-output {
  background-color: yellow;
  border: 1px solid blue;
  height: 50px;
  width: 400px;
  padding: 10px;
  display: flex;
  align-items: center;
}
.info-container {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.get-info-button {
  background-color: blue;
  color: white;
  border: none;
  height: 30px;
  padding: 0 10px;
  cursor: pointer;
  margin-bottom: 5px;
}
.get-info-button:hover {
  background-color: darkblue;
}
.info-output {
  width: 400px;
  height: 100px;
  resize: none;
  padding: 5px;
}
.loading-indicator {
  margin-top: 10px;
  color: white;
  background-color: black;
  padding: 5px;
  border-radius: 5px;
}
</style>
