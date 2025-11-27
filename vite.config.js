import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy' // Для копирования статики
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    // vueDevTools(), // Раскомментируйте, если нужно
    viteStaticCopy({ // Кэширование статических изображений
      targets: [
        {
          src: 'src/assets/images/*.{jpg,jpeg,png,gif,svg,webp,ico}',
          dest: 'assets/images',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Указывает на папку src
      'moduls': path.resolve(__dirname, 'moduls'), // Указывает на папку moduls
      buffer: 'buffer/',
    },
  },
  server: {
    // host: '127.0.0.1', // Явное указание на использование IPv4
    // port: 5173, // Порт, на котором будет запущен Vite
    proxy: {
      '/api': {
        target: 'http://localhost:3002', // URL вашего Node.js сервера
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Удаляет '/api' из пути
      },
    },
    hmr: {
      overlay: false // Отключает оверлей ошибок Hot Module Replacement
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Хеширование имён файлов для кэширования
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
    // Оптимизация chunk-файлов
    chunkSizeWarningLimit: 1600,
  },
})