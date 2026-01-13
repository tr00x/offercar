import apiClient from './client'
import type { LoginResponse, UserApplication, SuccessResponse } from '@/types'

// Email login - sends OTP
export async function loginWithEmail(email: string): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/auth/user-login-email', { email })
  return response.data
}

// Confirm email OTP
export async function confirmEmailOtp(email: string, otp: string): Promise<LoginResponse> {
  const response = await apiClient.post('/api/v1/auth/user-email-confirmation', { email, otp })
  return response.data
}

// Phone login - sends OTP
export async function loginWithPhone(phone: string): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/auth/user-login-phone', { phone })
  return response.data
}

// Confirm phone OTP
export async function confirmPhoneOtp(phone: string, otp: string): Promise<LoginResponse> {
  const response = await apiClient.post('/api/v1/auth/user-phone-confirmation', { phone, otp })
  return response.data
}

// Google login
export async function loginWithGoogle(tokenId: string): Promise<LoginResponse> {
  const response = await apiClient.post('/api/v1/auth/user-login-google', { token_id: tokenId })
  return response.data
}

// Forgot password
export async function forgotPassword(email: string): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/auth/user-forget-password', { email })
  return response.data
}

// Reset password
export async function resetPassword(email: string, otp: string, password: string): Promise<SuccessResponse> {
  const response = await apiClient.post('/api/v1/auth/user-reset-password', {
    email,
    otp,
    password,
  })
  return response.data
}

// Send business application
export async function sendBusinessApplication(application: UserApplication): Promise<LoginResponse> {
  const normalizeDate = (d?: string) => {
    if (!d) return d as string
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/)
    return m ? `${m[1]}-${m[2]}-${m[3]}` : d
  }

  const payload: UserApplication = {
    ...application,
    licence_issue_date: normalizeDate(application.licence_issue_date),
    licence_expiry_date: normalizeDate(application.licence_expiry_date),
  }

  const response = await apiClient.post('/api/v1/auth/send-application', payload)
  return response.data
}

// Business login (Third party login)
export async function loginBusiness(data: { email: string; password: string }): Promise<LoginResponse> {
  const response = await apiClient.post('/api/v1/auth/third-party-login', data)
  return response.data
}

// Upload application documents (licence, memorandum, copy_of_id)
export async function uploadApplicationDocuments(
  licence: File,
  memorandum: File,
  copyOfId: File
): Promise<SuccessResponse> {
  const formData = new FormData()
  formData.append('licence', licence, 'trade_licence.pdf')
  formData.append('memorandum', memorandum, 'memorandum.pdf')
  formData.append('copy_of_id', copyOfId, 'id_copy.pdf')

  // Log what we are sending
  console.log('Uploading documents:', {
    licence: { name: licence.name, size: licence.size, type: licence.type },
    memorandum: { name: memorandum.name, size: memorandum.size, type: memorandum.type },
    copyOfId: { name: copyOfId.name, size: copyOfId.size, type: copyOfId.type },
  })

  try {
    const response = await apiClient.post('/api/v1/auth/send-application-document', formData, {
      headers: {
        'Content-Type': undefined,
      },
    })
    console.log('Upload response:', response.data)
    return response.data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Token management helpers
export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
