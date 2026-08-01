import axios from "axios"

// Backend origin comes from .env (VITE_API_URL, baked in at build time).
// Left empty in dev, requests go to "/api" and Vite's proxy forwards them.
// In production set VITE_API_URL to the API origin, e.g. http://31.97.228.184:7003
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")

const api = axios.create({ baseURL: `${API_ORIGIN}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(err)
  }
)

export default api
