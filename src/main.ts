import { createApp } from 'vue'
import './style.css'
import App from './app/App.vue'
import i18n from './app/providers/i18n'
import pinia from './app/providers/store'
import router from './app/router'

const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.use(router)
app.mount('#app')