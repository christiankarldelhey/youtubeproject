import axios from 'axios'

const DEFAULT_BACKEND_URL = 'http://localhost:4000'

export const backendHttpClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? DEFAULT_BACKEND_URL,
  timeout: 15000,
})
