// Vuetify
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'; // Импортируйте ваш store
import 'vuetify/styles'
import cors from 'cors';

const app = createApp(App)

// Регистрируем директиву v-focus
app.directive('focus', {
    mounted(el) {
        el.focus()
    }
})

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
    components,
    directives,
})

app.use(router)
app.use(store);

// Восстановление сессии с обработкой Promise
(async () => {
    try {
        await store.dispatch('restoreSession'); // Используем await
    } catch (error) {
        console.error('Ошибка при восстановлении сессии:', error);
    }
})()

// Обработчик для подавления конкретного предупреждения
app.config.warnHandler = (msg, instance, trace) => {
  // Игнорируем только предупреждение о selectedFolderHash
  if (msg.includes('Invalid prop: type check failed for prop "selectedFolderHash"')) {
    return
  }
  // Выводим все остальные предупреждения
  console.warn(msg, trace)
}

app.use(vuetify)
app.mount('#app')

