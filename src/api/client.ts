import axios from 'axios'

export const API_BASE_URL = 'https://api.mashynbazar.com'
export const PLACEHOLDER_IMAGE = '/placeholder-car.svg'

// Helper to get full image URL
export function getImageUrl(path: string | undefined | null, size: 's' | 'm' | 'l' = 'm'): string {
  if (!path) return PLACEHOLDER_IMAGE
  
  let finalPath = path
  
  // Handle car, generation, and user images that need size suffix and extension
  if ((path.includes('/images/cars/') || path.includes('/images/generations/') || path.includes('/users/')) && !path.match(/\.(jpg|jpeg|png|webp)$/i)) {
    finalPath = `${path}_${size}.jpg`
  }

  // If already absolute URL, return with modification
  if (finalPath.startsWith('http://') || finalPath.startsWith('https://')) {
    return finalPath
  }
  
  // Prepend API base URL for relative paths
  return `${API_BASE_URL}${finalPath.startsWith('/') ? '' : '/'}${finalPath}`
}

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '' : API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      // console.log(`[API] Attaching token to ${config.url}`)
    } else {
      console.warn(`[API] No token found for ${config.url}`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and we haven't tried refreshing yet
    // @ts-ignore
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          // Try to refresh token - adjust endpoint if needed
          const baseUrl = import.meta.env.DEV ? '' : API_BASE_URL
          const response = await axios.post(`${baseUrl}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        } catch {
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/auth'
        }
      } else {
        // No refresh token - redirect to login
        localStorage.removeItem('access_token')
        window.location.href = '/auth'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
