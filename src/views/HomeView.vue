<template>
  <div v-if="isAuthenticated">
    Это входная и парадная страница проекта. Тут будет тизер и всякое касающееся самого проекта. Видео с синтетической бабой, которая разводит руками и т.д.
  </div>
  <div v-else>
    Пожалуйста, войдите в систему, чтобы увидеть содержимое.
  </div>
</template>

<script setup lang="js">
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const isAuthenticated = computed(() => store.getters.isAuthenticated);
</script>