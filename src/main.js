import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
const app = createApp(App)
// Отключение Vue Devtools
app.config.devtools = false;
app.use(router)
app.mount('#app')

