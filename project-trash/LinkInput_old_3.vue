<template>
  <div class="input-module">
    <div class="input-container">
      <button @click="clearFields" class="clear-button">Очистить</button>
      <input v-model="url" class="url-input" placeholder="Введите URL" />
      <button @click="fetchPageInfo" class="red-button">Проверить URL</button>
    </div>
    <div class="link-output">{{ pageInfo }}</div>
    <div class="textarea-container">
      <textarea v-model="linkInfo" class="link-info" readonly></textarea>
<!--      <button @click="handleClick">Получить данные</button>-->
      <button @click="getInfo" class="get-info-button">Получить информацию</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';

export default {
  name: 'LinkUrl',
  setup() {
    const url = ref('');
    const pageInfo = ref('');
    const linkInfo = ref('');

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
      return regex.test(string);
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

    const getInfo = async () => {
      if (isValidURL(pageInfo.value)) {
        try {
          const info = await fetchMetaData(pageInfo.value);
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

    const handleClick = () => {
      axios.get('/api/metaDataService')
          .then(response => {
            alert(response.status);
          })
          .catch(error => {
            console.error('Ошибка при получении данных:', error);
          });
    };

    return {
      url,
      pageInfo,
      linkInfo,
      fetchPageInfo,
      clearFields,
      getInfo,
      handleClick, // Убедитесь, что handleClick возвращается
    };
  },
};
</script>

<style scoped>
/* Ваши стили остаются без изменений */
.input-module {
  width: 800px;
  height: 400px;
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
  margin-top: 10px;
}
.textarea-container {
  flex-direction: column;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: flex-start;
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
  margin-top: 10px;
  background-color: lightblue;
  color: white;
  border: none;
  height: 30px;
  padding: 0 10px;
  cursor: pointer;
  margin-left: 10px;
}
.get-info-button:hover {
  background-color: deepskyblue;
}
</style>
