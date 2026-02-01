import apiClient from './client'
import type { City } from '@/types'

export interface Business {
  id: number
  username?: string
  avatar?: string
  banner?: string
  address?: string
  registered?: string
  city?: City
  city_id?: number
}

export interface GetBusinessesParams {
  from_id?: number
  to_id?: number
  role_id?: number
  search?: string
}

export async function getBusinesses(params?: GetBusinessesParams) {
  const { data } = await apiClient.get<Business[]>('/api/v1/users/third-party', { params })
  return data
}
