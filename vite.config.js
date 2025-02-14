import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import vuetify from 'vite-plugin-vuetify'; // Импортируем плагин Vuetify
import path from 'path'; // Импортируем path

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Добавляем плагин Vuetify с автоимпортом
    // vueDevTools(), // Раскомментируйте, если хотите использовать Vue DevTools
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Указывает на папку src
      'moduls': path.resolve(__dirname, 'moduls'), // Указывает на папку moduls
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // URL вашего Node.js сервера
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Удаляет '/api' из пути
      },
    },
    hmr: {
      overlay: false // Отключает оверлей ошибок Hot Module Replacement
    }
  },
  build: {
    sourcemap: true // Включение source maps для отладки
  },
});
