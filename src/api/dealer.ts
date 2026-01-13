import apiClient from './client'
import type { SuccessResponse, CarsResponse, CreateCarRequest, SuccessWithId, Car } from '@/types'

// Get dealer's cars (all)
export async function getDealerCars(params?: { limit?: number; last_id?: number }): Promise<CarsResponse> {
  const response = await apiClient.get('/api/v1/third-party/profile/my-cars', { params })
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

// Get dealer's cars on sale
export async function getDealerCarsOnSale(params?: { limit?: number; last_id?: number }): Promise<CarsResponse> {
  const response = await apiClient.get('/api/v1/third-party/profile/on-sale', { params })
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

// Create dealer car
export async function createDealerCar(car: CreateCarRequest): Promise<SuccessWithId> {
  const response = await apiClient.post('/api/v1/third-party/dealer/car', car)
  return response.data
}

// Update dealer car
export async function updateDealerCar(car: Partial<CreateCarRequest> & { id: number }): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/third-party/dealer/car/${car.id}`, car)
  return response.data
}

// Get dealer car edit data
export async function getDealerCarEditData(id: number): Promise<Car> {
  const response = await apiClient.get(`/api/v1/third-party/dealer/car/${id}/edit`)
  return response.data
}

// Put dealer car on sale
export async function setDealerCarOnSale(id: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/third-party/dealer/car/${id}/sell`)
  return response.data
}

// Remove dealer car from sale (Draft/Dont Sell)
export async function setDealerCarDontSell(id: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/third-party/dealer/car/${id}/dont-sell`)
  return response.data
}

// Delete dealer car
export async function deleteDealerCar(id: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/third-party/dealer/car/${id}`)
  return response.data
}

// Upload dealer car images
export async function uploadDealerCarImages(carId: number, files: File[]): Promise<SuccessResponse> {
  const formData = new FormData()
  files.forEach((file) => {
    const nameParts = file.name.split('.')
    const ext = nameParts.pop()?.toLowerCase()
    const name = ext ? `${nameParts.join('.')}.${ext}` : file.name
    formData.append('images', file, name)
  })

  const response = await apiClient.post(`/api/v1/third-party/dealer/car/${carId}/images`, formData)
  return response.data
}

// Delete dealer car image
export async function deleteDealerCarImage(carId: number, imageUrl: string): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/third-party/dealer/car/${carId}/images`, {
    data: { image: imageUrl },
  })
  return response.data
}

// Upload dealer car video
export async function uploadDealerCarVideo(carId: number, file: File): Promise<SuccessResponse> {
  const formData = new FormData()
  formData.append('videos', file)

  const response = await apiClient.post(`/api/v1/third-party/dealer/car/${carId}/videos`, formData)
  return response.data
}

// Delete dealer car video
export async function deleteDealerCarVideo(carId: number, videoUrl: string): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/third-party/dealer/car/${carId}/videos`, {
    data: { video: videoUrl },
  })
  return response.data
}
