import apiClient from './client'
import type { Profile, ThirdPartyProfile, UpdateProfileRequest, UpdateThirdPartyProfileRequest, SuccessResponse, CarsResponse, Country } from '@/types'

// Get current user profile
export async function getProfile(): Promise<Profile> {
  const response = await apiClient.get('/api/v1/users/profile')
  const data = response.data
  // Map backend fields to frontend model
  if (data) {
    if (!data.name && data.username) {
      data.name = data.username
    }
    if (!data.phone && data.phone_number) {
      data.phone = data.phone_number
    }
  }
  return data
}

// Get third-party profile (includes avatar and registration date)
export async function getThirdPartyProfile(): Promise<ThirdPartyProfile> {
  const response = await apiClient.get('/api/v1/third-party/profile', {
    // @ts-ignore
    skipAuthRefresh: true
  })
  return response.data
}

// Update user profile
export async function updateProfile(data: UpdateProfileRequest): Promise<SuccessResponse> {
  const response = await apiClient.put('/api/v1/users/profile', data)
  return response.data
}

// Update third-party profile
export async function updateThirdPartyProfile(data: UpdateThirdPartyProfileRequest): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/third-party/profile', data)
  return response.data
}

// Upload profile avatar
export async function uploadAvatar(file: File): Promise<SuccessResponse> {
  const formData = new FormData()
  formData.append('avatar_image', file)

  const response = await apiClient.post('/api/v1/third-party/profile/images', formData, {
    headers: {
      'Content-Type': undefined,
    },
  })
  return response.data
}

// Upload profile banner
export async function uploadBanner(file: File): Promise<SuccessResponse> {
  const formData = new FormData()
  
  // Force Content-Type to image/jpeg and filename to banner.jpg to match Flutter behavior
  // Flutter uses: contentType: DioMediaType('image', 'jpg'), filename: 'banner.jpg'
  // We create a blob with explicit type to ensure the browser sends this Content-Type
  const blob = new Blob([file], { type: 'image/jpeg' })
  // 'banner_image' is the field name defined in the backend (ThirdPartyHandler.BannerImage)
  formData.append('banner_image', blob, 'banner.jpg')

  const response = await apiClient.post('/api/v1/third-party/profile/banner', formData, {
    headers: {
      'Content-Type': undefined,
    },
  })
  return response.data
}

// Delete profile banner
export async function deleteBanner(): Promise<SuccessResponse> {
  const response = await apiClient.delete('/api/v1/third-party/profile/banner')
  return response.data
}

// Delete profile avatar
export async function deleteAvatar(): Promise<SuccessResponse> {
  const response = await apiClient.delete('/api/v1/third-party/profile/images')
  return response.data
}

// Get user's cars (my listings)
export async function getMyCars(params?: { limit?: number; last_id?: number }): Promise<CarsResponse> {
  const response = await apiClient.get('/api/v1/users/profile/my-cars', { params })
  const data = response.data
  // API might return array directly
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      last_id: data.length > 0 ? data[data.length - 1]?.id : undefined,
    }
  }
  return data
}

// Get user's cars on sale
export async function getMyCarsOnSale(params?: { limit?: number; last_id?: number }): Promise<CarsResponse> {
  const response = await apiClient.get('/api/v1/third-party/profile/on-sale', { params })
  const data = response.data
  // API might return array directly
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      last_id: data.length > 0 ? data[data.length - 1]?.id : undefined,
    }
  }
  return data
}

// Get third-party user profile by ID (Public Profile)
export async function getPublicProfile(userId: number): Promise<ThirdPartyProfile> {
  const response = await apiClient.get(`/api/v1/users/${userId}`)
  return response.data
}

// Get countries list
export async function getCountries(): Promise<Country[]> {
  const response = await apiClient.get('/api/v1/users/countries')
  return response.data
}

// Add destination (Logistics/Dealer)
export async function addDestination(fromId: number, toId: number): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/third-party/logist/destinations', {
    from_id: fromId,
    to_id: toId
  })
  return response.data
}

// Delete destination
export async function deleteDestination(id: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/third-party/logist/destinations/${id}`)
  return response.data
}
