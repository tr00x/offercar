import apiClient from './client'
import { isAxiosError } from 'axios'
import type { Profile, ThirdPartyProfile, UpdateProfileRequest, UpdateThirdPartyProfileRequest, SuccessResponse, CarsResponse, Country } from '@/types'

interface RawProfile extends Profile {
  phoneNumber?: string
  username?: string
  birth_date?: string
  birthDate?: string
  about?: string
  description?: string
  aboutMe?: string
  experience?: number
  drivingExperience?: number
  socials?: Record<string, string>
  social_networks?: Record<string, string>
  city_id?: number
  cityId?: number
}

// Get current user profile
export async function getProfile(): Promise<Profile> {
  const response = await apiClient.get('/api/v1/users/profile')
  const data = response.data
  // Map backend fields to frontend model
  if (data) {
    const rawData = data as RawProfile
    if (!data.name && data.username) {
      data.name = data.username
    }
    if (!data.phone && data.phone_number) {
      data.phone = data.phone_number
    }
    if (!data.phone && rawData.phoneNumber) {
      data.phone = rawData.phoneNumber
    }
    // Map username to name
    if (!data.name && rawData.username) {
      data.name = rawData.username
    }
    // Map potential field mismatches
    if (!data.birthday && rawData.birth_date) {
      data.birthday = rawData.birth_date
    }
    if (!data.birthday && rawData.birthDate) {
      data.birthday = rawData.birthDate
    }
    if (!data.about_me && rawData.about) {
      data.about_me = rawData.about
    }
    if (!data.about_me && rawData.description) {
      data.about_me = rawData.description
    }
    if (!data.about_me && rawData.aboutMe) {
      data.about_me = rawData.aboutMe
    }
    if (!data.driving_experience && rawData.experience) {
      data.driving_experience = rawData.experience
    }
    if (!data.driving_experience && rawData.drivingExperience) {
      data.driving_experience = rawData.drivingExperience
    }
    // Map social networks
    if (!data.contacts && rawData.socials) {
      data.contacts = rawData.socials
    }
    if (!data.contacts && rawData.social_networks) {
      data.contacts = rawData.social_networks
    }
    // Ensure city_id is mapped if available but city object is missing
    if (!data.city && rawData.city_id) {
      data.city_id = rawData.city_id
    }
    if (!data.city && rawData.cityId) {
      data.city_id = rawData.cityId
    }
    // If city is object, ensure city_id is set
    if (data.city && data.city.id) {
        data.city_id = data.city.id
    }
  }
  return data
}

// Get third-party profile (includes avatar and registration date)
export async function getThirdPartyProfile(): Promise<ThirdPartyProfile> {
  // If the user is not authenticated, don't try to fetch third-party profile
  // The interceptor will handle 401s, but we can avoid the call if we know we don't have a token
  // However, since this function is called by react-query, we should handle the error gracefully
  try {
    const response = await apiClient.get('/api/v1/third-party/profile', {
      // @ts-expect-error - Custom property for auth interceptor
      skipAuthRefresh: true
    })
    return response.data
  } catch (error) {
    // If 403 or 404, it just means the user doesn't have a third-party profile or permission
    // Return empty object or throw depending on needs. Returning empty makes UI handling easier for "no profile"
    if (isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404)) {
      return {} as ThirdPartyProfile
    }
    throw error
  }
}

// Update user profile
export async function updateProfile(data: UpdateProfileRequest): Promise<SuccessResponse> {
  // Send only strict snake_case fields matching the interface
  // Removed aliases to prevent 400 Bad Request due to strict backend validation
  const payload = {
    username: data.username,
    about_me: data.about_me,
    address: data.address,
    birthday: data.birthday,
    city_id: data.city_id,
    driving_experience: data.driving_experience,
    email: data.email,
    google: data.google,
    phone_number: data.phone_number,
    notification: data.notification,
    
    // Contacts - only send if not empty
    contacts: (data.contacts && Object.keys(data.contacts).length > 0) ? data.contacts : undefined,
  }
  
  // Clean up undefined and null values
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined && v !== null)
  )
  
  console.log('Updating profile with payload:', cleanPayload)
  
  const response = await apiClient.put('/api/v1/users/profile', cleanPayload)
  return response.data
}

// Delete user account (all roles)
export async function deleteAccount(userId: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/auth/account/${userId}`)
  return response.data
}

// Update third-party profile
export async function updateThirdPartyProfile(data: UpdateThirdPartyProfileRequest): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/third-party/profile', data)
  return response.data
}

// Upload profile avatar
export async function uploadUserAvatar(file: File): Promise<SuccessResponse> {
  const formData = new FormData()
  
  // Create a blob with explicit type to ensure the browser sends this Content-Type
  // and filename to match strict backend validation (similar to Flutter app behavior)
  const blob = new Blob([file], { type: 'image/jpeg' })
  // Use 'avatar_image' as it is supported by backend and consistent with ThirdParty handler
  formData.append('avatar_image', blob, 'avatar.jpg')
  // Also append 'avatar' for compatibility
  formData.append('avatar', blob, 'avatar.jpg')

  const response = await apiClient.post('/api/v1/users/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Alias for compatibility
export const uploadAvatar = uploadUserAvatar

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

// Delete user profile avatar (Regular User)
export async function deleteUserAvatar(): Promise<SuccessResponse> {
  const response = await apiClient.delete('/api/v1/users/profile/images')
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

// Get user's cars on sale (Regular User)
export async function getUserCarsOnSale(params?: { limit?: number; last_id?: number }): Promise<CarsResponse> {
  const response = await apiClient.get('/api/v1/users/profile/on-sale', { params })
  const data = response.data
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      last_id: data.length > 0 ? data[data.length - 1]?.id : undefined,
    }
  }
  return data
}

// Get user's cars on sale (Third Party)
export async function getMyCarsOnSale(params?: { limit?: number; last_id?: number }): Promise<CarsResponse> {
  try {
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
  } catch (error) {
    // If 403 or 404, it means the user doesn't have a third-party profile or permission
    // Return empty list to avoid UI errors
    if (isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404)) {
      return {
        items: [],
        total: 0,
      }
    }
    throw error
  }
}

// Get third-party user profile by ID (Public Profile)
export async function getPublicProfile(userId: number): Promise<ThirdPartyProfile> {
  // Check if we have a token, if not, we can still fetch public profile but backend might behave differently
  // The interceptor handles token attachment if available.
  // We added a whitelist in client.ts for this endpoint to avoid "No token found" warnings.
  const response = await apiClient.get(`/api/v1/users/${userId}`)
  const data = response.data
  if (data) {
    if (!data.name && data.username) {
      data.name = data.username
    }
    // Also ensure company_name is prioritized for dealers if available, 
    // but we can't easily change the object structure here without affecting types.
    // The frontend component handles the priority (company_name -> name -> username).
  }
  return data
}

// Get countries list
export async function getCountries(): Promise<Country[]> {
  const response = await apiClient.get('/api/v1/users/countries')
  return response.data
}

// Save destinations (Logistics/Dealer) - Replaces all existing destinations
export async function saveDestinations(destinations: { from_id: number; to_id: number }[]): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/third-party/logist/destinations', destinations)
  return response.data
}

// Delete destination
export async function deleteDestination(id: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/third-party/logist/destinations/${id}`)
  return response.data
}
