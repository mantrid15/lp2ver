<script>
import { ref } from 'vue';
import { getPageInfo } from '/moduls/exp.js'; // Adjust the path as necessary

export default {
  name: 'LinkMod',
  setup() {
    const url = ref('');
    const pageInfo = ref([]);
    const fetchPageInfo = async () => {
      if (url.value) {
        try {
          pageInfo.value = await getPageInfo(url.value);
        } catch (error) {
          console.error('Error fetching page info:', error);
        }
      } else {
        alert('Please enter a valid URL.');
      }
    };
    return {
      url,
      pageInfo,
      fetchPageInfo,
    };
  },
};
</script>


<template>
  <div>
    <div class="input-module">
      <h1>Link Parser</h1>
      <input
          type="url"
          v-model="url"
          placeholder="Enter URL"
          required
      />
      <button @click="fetchPageInfo" class="red-button">linkparserV2</button>
    </div>
    <div class="table-module" v-if="pageInfo.length > 0">
      <table class="green-table">
        <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(value, key) in pageInfo" :key="key">
          <td>{{ key }}</td>
          <td>{{ value }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<style scoped>
.input-module {
  width: 400px;
  height: 200px;
  background-color: green;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto; /* Центрирование по горизонтали */
  margin-bottom: 20px; /* Отступ снизу для разделения модулей */
}

.red-button {
  background-color: red;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
}

.red-button:hover {
  background-color: darkred;
}

.table-module {
  width: 800px;
  height: 800px;
  background-color: yellow; /* Цвет фона желтый */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto; /* Центрирование по горизонтали */
}

.green-table {
  width: 100%; /* Занимает всю ширину родительского элемента */
  height: 100%; /* Занимает всю высоту родительского элемента */
  border-collapse: collapse;
  background-color: green;
  color: white;
}

.green-table th,
.green-table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.green-table th {
  background-color: darkgreen;
}
</style>