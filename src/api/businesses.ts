import apiClient from './client'

export interface Business {
  id: number
  username?: string
  avatar?: string
  registered?: string
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
