import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ command, mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '')

  // Определяем окружение
  const isProduction = mode === 'production'
  const isDevelopment = !isProduction
  const isBuild = command === 'build'

  // Базовый URL для API в зависимости от окружения
  const apiTarget = isProduction
    ? 'http://192.168.0.40:3002'
    : 'http://localhost:3002'

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      // vueDevTools(), // Раскомментируйте, если нужно
      viteStaticCopy({
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
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'moduls': path.resolve(__dirname, 'moduls'),
        buffer: 'buffer/',
      },
    },
    server: {
      host: isProduction ? '0.0.0.0' : 'localhost',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            // Логирование прокси только в development
            if (isDevelopment) {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log(`[Vite Proxy] ${req.method} ${req.url} -> ${options.target}`)
              })
            }
          },
        },
      },
      hmr: {
        overlay: isDevelopment // Оверлей ошибок только в development
      }
    },
    define: {
      // Глобальные переменные для клиентского кода
      '__APP_ENV__': JSON.stringify(mode),
      '__IS_PRODUCTION__': JSON.stringify(isProduction),
      '__IS_DEVELOPMENT__': JSON.stringify(isDevelopment),
      // Переменные окружения для клиента
      'import.meta.env.VITE_API_URL': JSON.stringify(apiTarget),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.PROD': JSON.stringify(isProduction),
      'import.meta.env.DEV': JSON.stringify(isDevelopment),
    },
    build: {
      sourcemap: isDevelopment, // sourcemap только в development
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
        },
      },
      chunkSizeWarningLimit: 1600,
      // Оптимизации для production
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true, // Удаляем console.log в production
        }
      } : {},
    },
    // Дополнительные настройки для development
    ...(isDevelopment && {
      clearScreen: false,
      logLevel: 'info',
    }),
    // Дополнительные настройки для production
    ...(isProduction && {
      logLevel: 'warn',
    }),
  }
})