import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  withCredentials: true,
})

// Placeholder — token attachment will be implemented in Step 3

export default api
