<!-- 20231122 работающая копия -->
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
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'LinkMod',
  setup() {
    const url = ref('');
    const pageInfo = ref('');

    const isValidURL = (string) => {
      const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i; // ����������� ���������� ��������� ��� �������� URL
      return regex.test(string);
    };

    const fetchPageInfo = async () => {
      if (url.value) {
        if (isValidURL(url.value)) {
          // ���� ��� ���������� URL, ���������� ���
          pageInfo.value = url.value;
        } else {
          // ���� ��� �� URL, ���������� ���������
          pageInfo.value = 'This not URL';
        }
      } else {
        pageInfo.value = 'Please enter a valid URL.'; // ��������� ��� ������ ��������� � link-output
      }
    };

    const clearFields = () => {
      url.value = ''; // ������� ���� �����
      pageInfo.value = ''; // ������� ���� ������
    };

    return {
      url,
      pageInfo,
      fetchPageInfo,
      clearFields,
    };
  },
};
</script>

<style scoped>
.input-module {
  width: 400px;
  height: 200px;
  background-color: green;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto; /* ������������� �� ����������� */
  margin-bottom: 20px; /* ������ ����� ��� ���������� ������� */
}
.input-container {
  display: flex;
  align-items: center; /* ������������ �� ������ �� ��������� */
}
.url-input {
  height: 30px; /* ������ ������ */
  margin-right: 20px; /* ������ ����� ������� � ������� */
  padding: 5px; /* ������ ������ ������ */
}
.red-button {
  background-color: red;
  color: white;
  border: none;
  height: 30px; /* ������ ������ */
  padding: 0 10px; /* �������������� ������� ��� ������ */
  cursor: pointer;
}
.red-button:hover {
  background-color: darkred;
}
.clear-button {
  background-color: purple; /* ���������� ���� */
  color: white;
  border: none;
  height: 30px; /* ������ ������ */
  padding: 0 10px; /* �������������� ������� ��� ������ */
  cursor: pointer;
  margin-right: 10px; /* ������ ����� ������� Clear � ����� ����� */
}
.clear-button:hover {
  background-color: darkviolet; /* ���� ��� ��������� */
}
.link-output {
  background-color: yellow;
  border: 1px solid blue; /* ��������� ��� ��������� ������� */
  height: 50px; /* ������ ����� ������ */
  width: 400px; /* ������ ����� ������ */
  padding: 10px; /* ������� ������ ����� ������ */
  display: flex; /* ������������� ������ �� ��������� */
  align-items: center; /* ������������� ������ �� ��������� */
}
</style>