import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { useAuthStore } from '../stores/AuthStore'

const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 5000
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token

    if (token !== null) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})
export default api