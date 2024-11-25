import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Указывает на папку src
      'moduls': path.resolve(__dirname, 'moduls'),
      extensions: ['.js', '.vue', '.json'] // Убедитесь, что .js включён// Указывает на папку moduls
    },
  },
})
