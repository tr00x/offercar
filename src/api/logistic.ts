import apiClient from './client'
import type { SuccessResponse, SuccessWithId } from '@/types'

export interface LogistDestination {
  id: number
  from_city_id: number
  to_city_id: number
  price: number
  days: number
  type: string
}

export async function getLogistDestinations(): Promise<LogistDestination[]> {
  const response = await apiClient.get('/api/v1/third-party/logist/destinations')
  return response.data
}

export async function createLogistDestination(data: Omit<LogistDestination, 'id'>): Promise<SuccessWithId> {
  const response = await apiClient.post('/api/v1/third-party/logist/destinations', data)
  return response.data
}

export async function deleteLogistDestination(id: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/third-party/logist/destinations/${id}`)
  return response.data
}
