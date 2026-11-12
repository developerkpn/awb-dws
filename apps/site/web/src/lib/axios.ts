import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})
