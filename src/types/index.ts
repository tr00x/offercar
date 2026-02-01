// Auth types
export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export interface User {
  id: number
  name: string
  email?: string
  phone?: string
  avatar?: string
  role_id: number
}

// Car types
export interface Brand {
  id: number
  name: string
  name_ru?: string
  logo?: string
  popular?: boolean
}

export interface Model {
  id: number
  name: string
  name_ru?: string
  brand_id: number
}

export interface Generation {
  id: number
  name: string
  name_ru?: string
  model_id: number
  start_year?: number
  end_year?: number
  modifications?: Modification[]
  image?: string
}

export interface Modification {
  id: number
  name: string
  generation_id: number
  body_type_id?: number
  engine_id?: number
  transmission_id?: number
  drivetrain_id?: number
  fuel_type_id?: number
  // Expanded fields for display if available
  engine?: string
  transmission?: string
  drivetrain?: string
  fuel_type?: string
}

export interface City {
  id: number
  name: string
  name_ru?: string
  region_id?: number
}

export interface Region {
  id: number
  name: string
  name_ru?: string
}

export interface Color {
  id: number
  name: string
  name_ru?: string
  image?: string
}

export interface BodyType {
  id: number
  name: string
  name_ru?: string
  image?: string
}

export interface Transmission {
  id: number
  name: string
  name_ru?: string
}

export interface Drivetrain {
  id: number
  name: string
  name_ru?: string
}

export interface Engine {
  id: number
  name: string
  name_ru?: string
}

export interface FuelType {
  id: number
  name: string
  name_ru?: string
}

export interface CarOwner {
  id: number
  name: string
  phone_numbers?: string[]
  avatar?: string
}

export interface Car {
  id: number
  brand: Brand
  model: Model
  generation?: Generation
  modification?: Modification
  city: City
  region?: Region
  color: Color
  body_type?: BodyType
  transmission?: Transmission
  drivetrain?: Drivetrain
  engine?: Engine
  fuel_type?: FuelType
  year: number
  price: number
  odometer: number
  vin_code?: string
  description?: string
  images: string[]
  videos?: string[]
  phone_numbers: string[]
  trade_in: number
  wheel: boolean
  crash?: boolean
  new?: boolean
  owners?: number
  view_count?: number
  created_at: string
  updated_at?: string
  owner?: CarOwner
  status?: string | number
  my_car?: boolean
}

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export interface CarsResponse {
  items: Car[]
  total?: number
  last_id?: number
}

// Create car request
export interface CreateCarRequest {
  brand_id: number
  model_id: number
  body_type_id: number
  modification_id: number
  city_id: number
  color_id: number
  year: number
  price: number
  odometer: number
  phone_numbers: string[]
  trade_in: number
  vin_code: string
  wheel: boolean
  crash?: boolean
  new?: boolean
  owners?: number
  description?: string
}

// Business application types
export interface UserApplication {
  role_id: number
  company_name: string
  company_type_id: number
  activity_field_id: number
  full_name: string
  phone: string
  email: string
  address: string
  vat_number: string
  licence_issue_date: string
  licence_expiry_date: string
  password?: string
}

export interface CompanyType {
  id: number
  name: string
  name_ru?: string
}

export interface ActivityField {
  id: number
  name: string
  name_ru?: string
}

// Profile types
export interface Profile {
  id: number
  name: string
  email?: string
  phone?: string
  avatar?: string
  role_id?: number
  created_at?: string
  // Fields from GetProfileResponse
  username?: string
  about_me?: string
  address?: string
  birthday?: string
  city?: City
  contacts?: Record<string, string>
  driving_experience?: number
  google?: string
  notification?: boolean
  registered_by?: string
  city_id?: number
}

export interface ThirdPartyProfile {
  user_id?: number
  name?: string
  username?: string
  about_us?: string
  contacts?: Record<string, string>
  address?: string
  coordinates?: string
  avatar?: string
  banner?: string
  company_name?: string
  message?: string
  vat_number?: string
  company_type?: string
  activity_field?: string
  registered?: string
  email?: string
  phone?: string
  destinations?: Destination[]
  role_id?: number
  city?: City
}

export interface UpdateProfileRequest {
  username: string
  email?: string
  phone_number?: string
  about_me?: string
  address?: string
  birthday?: string
  city_id?: number
  driving_experience?: number
  notification?: boolean
  contacts?: Record<string, string>
  google?: string
}

export interface UpdateThirdPartyProfileRequest {
  username?: string
  about_us?: string
  address?: string
  coordinates?: string
  contacts?: Record<string, string>
  email?: string
  phone?: string
}

// Home response
export interface HomeResponse {
  popular_brands: Brand[]
  new_cars: Car[]
  recent_cars: Car[]
}

// Filter response
export interface FilterBrandsResponse {
  brands: Brand[]
}

export interface FilterModelsResponse {
  models: Model[]
}

// Conversation/Message types for chat stubs
export interface Conversation {
  id: number
  user_id: number
  car_id?: number
  last_message?: string
  created_at: string
  updated_at?: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  message: string
  type: number
  created_at: string
}

// Country type
export interface Country {
  id: number
  name: string
  name_ru?: string
  country_code?: string
  flag?: string
}

export interface Destination {
  id: number
  from_country: Country
  to_country: Country
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
}

export interface SuccessResponse {
  success: boolean
  message?: string
}

export interface SuccessWithId {
  success: boolean
  id: number
}

// Chat types (matching backend WebSocket models)
export interface ChatConversation {
  id: number
  user_id: number
  username: string
  avatar?: string
  last_message: string
  last_message_type: number
  last_message_id: number
  unread_messages: number
  last_active_date: string
}

export interface ChatMessage {
  id: number
  conversation_id?: number
  sender_id: number
  message: string
  type: number // 1=text, 2=item/car, 3=video, 4=image
  status?: number // 1=unread, 2=read
  created_at: string
}

export interface ChatUser {
  id: number
  username: string
  avatar?: string
  last_active_date?: string
  messages: ChatMessage[]
}

// WebSocket event types
export type WSEventType = 'ping' | 'private_message' | 'ack' | 'new_message' | 'connected' | 'error'

export interface WSMessage {
  event: WSEventType
  target_user_id?: number
  data?: unknown
}

export interface WSPrivateMessageData {
  message: string
  type: number
  time: string
  target_user_id: number
}

export interface WSNewMessageData {
  id: number
  username: string
  avatar?: string
  last_active_date?: string
  messages: ChatMessage[]
}

// Message types (numeric values matching backend)
export const MESSAGE_TYPE = {
  Text: 1,
  Item: 2,
  Video: 3,
  Image: 4,
} as const

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]

// Local message status for UI (not from backend)
export type MessageStatus = 'pending' | 'sent' | 'failed'

export interface LocalMessage {
  id: number
  localId?: string
  conversation_id?: number
  sender_id: number
  message: string
  type: number
  created_at: string
  status?: MessageStatus
}
