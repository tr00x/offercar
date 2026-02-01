import axios from 'axios'

export const API_BASE_URL = 'https://api.mashynbazar.com'
export const PLACEHOLDER_IMAGE = '/placeholder-car.png'

type ImageObject = { url?: string; path?: string; image?: string }

// Helper to get full image URL
export function getImageUrl(path: string | undefined | null | ImageObject, size: 's' | 'm' | 'l' = 'm'): string {
  if (!path) return PLACEHOLDER_IMAGE
  
  // Handle non-string paths (e.g. if API returns objects)
  if (typeof path !== 'string') {
    // Cast to ImageObject to access properties safely
    const imgObj = path as ImageObject
    if (imgObj.url && typeof imgObj.url === 'string') {
      path = imgObj.url
    } else if (imgObj.path && typeof imgObj.path === 'string') {
      path = imgObj.path
    } else if (imgObj.image && typeof imgObj.image === 'string') {
      path = imgObj.image
    } else {
      console.warn('getImageUrl received non-string path:', path)
      return PLACEHOLDER_IMAGE
    }
  }
  
  let finalPath = path as string
  
  // Handle car, generation, and user images that need size suffix and extension
  if ((finalPath.includes('/images/cars/') || finalPath.includes('/images/generations/') || finalPath.includes('/users/')) && !finalPath.match(/\.(jpg|jpeg|png|webp)$/i)) {
    finalPath = `${finalPath}_${size}.jpg`
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
  timeout: 60000, // 60 seconds timeout
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      // console.log(`[API] Attaching token to ${config.url}`)
    } else {
      // Filter out known public endpoints to reduce log noise
      const publicEndpoints = [
        '/api/v1/auth',
        '/api/v1/users/cities',
        '/api/v1/users/brands',
        '/api/v1/users/cars',
        '/api/v1/users/body-types',
        '/api/v1/users/colors',
        '/api/v1/users/transmissions',
        '/api/v1/users/drivetrains',
        '/api/v1/users/fuel-types',
        '/api/v1/users/engines',
        '/api/v1/users/third-party',
        '/api/v1/users/home'
      ]
      
      const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint)) || /\/api\/v1\/users\/\d+$/.test(config.url || '')
      
      if (!isPublic) {
        console.warn(`[API] No token found for ${config.url}`)
      }
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
          
          // Notify app about token refresh (useful for WebSocket reconnection)
          window.dispatchEvent(new Event('auth:token-refreshed'))

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        } catch {
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/'
        }
      } else {
        // No refresh token - redirect to home
        localStorage.removeItem('access_token')
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
