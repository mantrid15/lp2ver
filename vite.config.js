import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import path from 'path'; // Не забудьте импортировать path

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
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
  },
  build: {
    sourcemap: true // Включение source maps
  },
});
