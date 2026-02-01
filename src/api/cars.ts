import apiClient from './client'
import type {
  Car,
  CarsResponse,
  CreateCarRequest,
  SuccessWithId,
  SuccessResponse,
  HomeResponse,
} from '@/types'

export interface CarsFilters {
  brand_id?: number
  model_id?: number
  year?: number
  generation_id?: number | number[]
  modification_id?: number
  city_id?: number
  year_from?: number
  year_to?: number
  price_from?: number
  price_to?: number
  odometer?: number
  body_type_id?: number
  transmission_id?: number
  fuel_type_id?: number
  drivetrain_id?: number
  engine_id?: number
  color_id?: number
  posted_by?: 'dealer' | 'private'
  wheel?: boolean
  new?: boolean
  crash?: boolean
  trade_in?: number
  owners?: number
  limit?: number
  last_id?: number
  user_id?: number
}

// Get home page data (popular brands, new cars, recent cars)
export async function getHome(): Promise<HomeResponse> {
  const response = await apiClient.get('/api/v1/users/home')
  return response.data
}

// Get cars list with filters
export async function getCars(filters?: CarsFilters): Promise<CarsResponse> {
  const params = new URLSearchParams()

  if (filters) {
    if (filters.brand_id) params.append('brands', String(filters.brand_id))
    if (filters.model_id) params.append('models', String(filters.model_id))
    if (filters.generation_id) {
      const genIds = Array.isArray(filters.generation_id) ? filters.generation_id : [filters.generation_id]
      genIds.forEach((id) => params.append('generations', String(id)))
    }
    if (filters.city_id) params.append('cities', String(filters.city_id))
    if (filters.body_type_id) params.append('body_types', String(filters.body_type_id))
    if (filters.transmission_id) params.append('transmissions', String(filters.transmission_id))
    if (filters.fuel_type_id) params.append('fuel_types', String(filters.fuel_type_id))
    if (filters.drivetrain_id) params.append('drivetrains', String(filters.drivetrain_id))
    if (filters.engine_id) params.append('engines', String(filters.engine_id))
    if (filters.color_id) params.append('colors', String(filters.color_id))

    // Year handling
    if (filters.year) {
      params.append('year_from', String(filters.year))
      params.append('year_to', String(filters.year))
    }
    if (filters.year_from) params.append('year_from', String(filters.year_from))
    if (filters.year_to) params.append('year_to', String(filters.year_to))

    // Ranges
    if (filters.price_from !== undefined) params.append('price_from', String(filters.price_from))
    if (filters.price_to !== undefined) params.append('price_to', String(filters.price_to))
    if (filters.odometer !== undefined) params.append('odometer', String(filters.odometer))

    // Booleans
    if (filters.wheel !== undefined) params.append('wheel', String(filters.wheel))
    if (filters.new) params.append('new', 'true')
    if (filters.crash) params.append('crash', 'true')
    if (filters.trade_in !== undefined) params.append('trade_in', String(filters.trade_in))
    if (filters.owners !== undefined) params.append('owners', String(filters.owners))

    // Pagination
    if (filters.limit) params.append('limit', String(filters.limit))
    if (filters.last_id) params.append('last_id', String(filters.last_id))
    // Backend uses 'dealers' param to filter by user_id (user_id param is ignored)
    if (filters.user_id) params.append('dealers', String(filters.user_id))
  }

  const response = await apiClient.get('/api/v1/users/cars', { params })
  // API returns array directly, wrap it in expected format
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

// Get single car by ID
export async function getCarById(id: number): Promise<Car> {
  const response = await apiClient.get(`/api/v1/users/cars/${id}`)
  return response.data
}

// Create a new car listing
export async function createCar(car: CreateCarRequest): Promise<SuccessWithId> {
  const response = await apiClient.post('/api/v1/users/cars', car)
  return response.data
}

// Update car listing
export async function updateCar(car: Partial<CreateCarRequest> & { id: number }): Promise<SuccessResponse> {
  const response = await apiClient.put('/api/v1/users/cars', car)
  return response.data
}

// Delete car listing
export async function deleteCar(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/users/cars/${carId}`)
  return response.data
}

// Get car edit data
export async function getCarEditData(carId: number): Promise<Car> {
  const response = await apiClient.get(`/api/v1/users/cars/${carId}/edit`)
  return response.data
}

// Upload car images
export async function uploadCarImages(carId: number, files: File[]): Promise<SuccessResponse> {
  const formData = new FormData()
  files.forEach((file) => {
    // Ensure extension is lowercase to avoid backend validation errors (it's case-sensitive)
    const nameParts = file.name.split('.')
    const ext = nameParts.pop()?.toLowerCase()
    // If no extension, just keep original name (though likely invalid)
    const name = ext ? `${nameParts.join('.')}.${ext}` : file.name
    
    formData.append('images', file, name)
  })

  const response = await apiClient.post(`/api/v1/users/cars/${carId}/images`, formData, {
    headers: {
      'Content-Type': undefined,
    } as Record<string, string | undefined>,
  })
  return response.data
}

// Delete car image
export async function deleteCarImage(carId: number, imageUrl: string): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/users/cars/${carId}/images`, {
    data: { image: imageUrl },
  })
  return response.data
}

// Upload car video
export async function uploadCarVideo(carId: number, file: File): Promise<SuccessResponse> {
  const formData = new FormData()
  formData.append('video', file)

  const response = await apiClient.post(`/api/v1/users/cars/${carId}/videos`, formData, {
    headers: {
      'Content-Type': undefined,
    } as unknown as Record<string, string>,
  })
  return response.data
}

// Delete car video
export async function deleteCarVideo(carId: number, videoUrl: string): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/users/cars/${carId}/videos`, {
    data: { video: videoUrl },
  })
  return response.data
}

// Mark car as sold (buy)
export async function markCarAsSold(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/users/cars/${carId}/buy`)
  return response.data
}

// Cancel car listing
export async function cancelCarListing(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/users/cars/${carId}/cancel`)
  return response.data
}

// Mark as "don't sell"
export async function markCarDontSell(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/users/cars/${carId}/dont-sell`)
  return response.data
}

// Re-list car for sale
export async function relistCarForSale(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/users/cars/${carId}/sell`)
  return response.data
}

// Get price recommendation
export async function getPriceRecommendation(params: {
  brand_id: number
  model_id: number
  year: number
  odometer: number
  generation_id?: number
}): Promise<{ min_price: number; max_price: number; avg_price: number }> {
  const response = await apiClient.get('/api/v1/users/cars/price-recommendation', { params })
  return response.data
}

// Get user's liked cars
export async function getLikedCars(): Promise<CarsResponse> {
  const response = await apiClient.get('/api/v1/users/likes')
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

// Like a car
export async function likeCar(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.post(`/api/v1/users/likes/${carId}`)
  return response.data
}

// Unlike a car
export async function unlikeCar(carId: number): Promise<SuccessResponse> {
  const response = await apiClient.delete(`/api/v1/users/likes/${carId}`)
  return response.data
}
