import apiClient from './client'
import type {
  Brand,
  Model,
  Generation,
  Modification,
  City,
  Color,
  BodyType,
  Transmission,
  Drivetrain,
  Engine,
  FuelType,
  Country,
  CompanyType,
  ActivityField,
} from '@/types'

// Brands
export async function getBrands(): Promise<Brand[]> {
  const response = await apiClient.get('/api/v1/users/brands')
  return response.data
}

export async function getFilterBrands(): Promise<Brand[]> {
  const response = await apiClient.get('/api/v1/users/filter-brands')
  // API returns { popular_brands: [...] }
  return response.data.popular_brands || response.data || []
}

// Models
export async function getModelsByBrand(brandId: number): Promise<Model[]> {
  const response = await apiClient.get(`/api/v1/users/brands/${brandId}/models`)
  return response.data
}

export async function getFilterModelsByBrand(brandId: number): Promise<Model[]> {
  const response = await apiClient.get(`/api/v1/users/brands/${brandId}/filter-models`)
  // API returns { popular_models, all_models }
  return response.data.all_models || response.data.popular_models || response.data || []
}

// Generations
export async function getGenerationsByModel(
  brandId: number,
  modelId: number,
  year: number,
  bodyTypeId: number,
  wheel?: boolean
): Promise<Generation[]> {
  const params: any = {
    year: String(year),
    body_type_id: String(bodyTypeId),
  }
  if (wheel !== undefined) {
    params.wheel = String(wheel)
  }
  const response = await apiClient.get(`/api/v1/users/brands/${brandId}/models/${modelId}/generations`, {
    params,
  })
  return response.data
}

export async function getModificationsByGeneration(
  brandId: number,
  modelId: number,
  generationId: number
): Promise<Modification[]> {
  const response = await apiClient.get(
    `/api/v1/users/brands/${brandId}/models/${modelId}/generations/${generationId}/modifications`
  )
  return response.data
}

export async function getGenerationsFromModels(modelIds: number[]): Promise<Generation[]> {
  const params = new URLSearchParams()
  modelIds.forEach((id) => params.append('model_ids', String(id)))
  const response = await apiClient.get('/api/v1/users/models/generations', { params })
  return response.data
}

// Years available for model
export async function getYearsForModel(brandId: number, modelId: number, wheel?: boolean): Promise<number[]> {
  const params: any = {}
  if (wheel !== undefined) {
    params.wheel = String(wheel)
  }
  const response = await apiClient.get(`/api/v1/users/brands/${brandId}/models/${modelId}/years`, {
    params,
  })
  return response.data
}

// Body types for model
export async function getBodyTypesForModel(
  brandId: number,
  modelId: number,
  year: number,
  wheel?: boolean
): Promise<BodyType[]> {
  const params: any = {
    year: String(year),
  }
  if (wheel !== undefined) {
    params.wheel = String(wheel)
  }
  const response = await apiClient.get(`/api/v1/users/brands/${brandId}/models/${modelId}/body-types`, {
    params,
  })
  return response.data
}

// All body types
export async function getBodyTypes(): Promise<BodyType[]> {
  const response = await apiClient.get('/api/v1/users/body-types')
  return response.data
}

// Cities
export async function getCities(): Promise<City[]> {
  const response = await apiClient.get('/api/v1/users/cities')
  return response.data
}

// Colors
export async function getColors(): Promise<Color[]> {
  const response = await apiClient.get('/api/v1/users/colors')
  return response.data
}

// Countries
export async function getCountries(): Promise<Country[]> {
  const response = await apiClient.get('/api/v1/users/countries')
  return response.data
}

// Transmissions
export async function getTransmissions(): Promise<Transmission[]> {
  const response = await apiClient.get('/api/v1/users/transmissions')
  return response.data
}

// Drivetrains
export async function getDrivetrains(): Promise<Drivetrain[]> {
  const response = await apiClient.get('/api/v1/users/drivetrains')
  return response.data
}

// Engines - API returns { value, id } instead of { name, id }
export async function getEngines(): Promise<Engine[]> {
  const response = await apiClient.get('/api/v1/users/engines')
  // Map 'value' to 'name' for consistency
  return (response.data || []).map((e: { id: number; value: string }) => ({
    id: e.id,
    name: e.value,
  }))
}

// Fuel types
export async function getFuelTypes(): Promise<FuelType[]> {
  const response = await apiClient.get('/api/v1/users/fuel-types')
  return response.data
}

// Company types (for business registration) - public endpoint
export async function getCompanyTypes(): Promise<CompanyType[]> {
  const response = await apiClient.get('/api/v1/third-party/registration-data')
  return response.data.company_types || []
}

// Activity fields (for business registration) - public endpoint
export async function getActivityFields(): Promise<ActivityField[]> {
  const response = await apiClient.get('/api/v1/third-party/registration-data')
  return response.data.activity_fields || []
}

// Get modifications for generation (if needed)
export async function getModifications(generationId: number): Promise<Modification[]> {
  // This endpoint may vary - adjust based on actual API
  const response = await apiClient.get(`/api/v1/users/generations/${generationId}/modifications`)
  return response.data
}
