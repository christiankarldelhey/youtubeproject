import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './locales/index.ts'; 

const app = createApp(App);
app.use(i18n);
app.mount('#app');