import { createApp } from 'vue'
import './style.css'
import App from './app/App.vue'
import i18n from './app/providers/i18n'
import pinia from './app/providers/store'

const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.mount('#app')