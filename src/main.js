// Vuetify
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'; // Импортируйте ваш store
import 'vuetify/styles'

const app = createApp(App)

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
app.use(vuetify)
app.mount('#app')

