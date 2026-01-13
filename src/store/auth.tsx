import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getProfile, getThirdPartyProfile } from '@/api/profile'
import { clearTokens, getAccessToken, setTokens } from '@/api/auth'
import type { Profile } from '@/types'

interface AuthContextType {
  user: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => {
    try {
      const savedUser = localStorage.getItem('user_profile')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(!user)

  const isAuthenticated = !!user

  const fetchUser = async (options: { clearOn400?: boolean } = {}) => {
    // If no token, don't try to fetch
    if (!getAccessToken()) {
      return
    }

    try {
      const profile = await getProfile()
      
      // Try to fetch third-party profile to ensure we have the correct role and avatar
      // This handles cases where base profile might not reflect the full business status
      try {
        const thirdParty = await getThirdPartyProfile()
        if (thirdParty) {
          if (thirdParty.avatar) {
            profile.avatar = thirdParty.avatar
          }
          // Merge role_id if available in third-party profile
          if (thirdParty.role_id) {
            profile.role_id = thirdParty.role_id
          }
        }
      } catch (e) {
        // Ignore third-party profile errors (expected for regular users)
        // console.log('Failed to fetch third party profile', e)
      }

      setUser(profile)
      localStorage.setItem('user_profile', JSON.stringify(profile))
    } catch (error: any) {
      // Only log errors that are not 400 (Bad Request)
      // 400 is expected during business registration before documents are uploaded
      if (error?.response?.status !== 400) {
        console.error('Fetch user failed', error)
      } else {
        console.warn('Profile incomplete or pending verification (400 expected during registration)')
      }
      
      // If specified, clear tokens on 400 error (useful for initial load cleanup)
      if (error?.response?.status === 400 && options.clearOn400) {
        clearTokens()
        setUser(null)
        localStorage.removeItem('user_profile')
        return
      }

      // Don't clear user state if it's just a 400 error (e.g. business profile incomplete)
      // This allows the user to proceed with document upload even if profile fetch fails
      if (error?.response?.status !== 400) {
        setUser(null)
        localStorage.removeItem('user_profile')
      }
      
      // Only clear tokens if unauthorized (401)
      if (error?.response?.status === 401) {
        clearTokens()
        setUser(null)
        localStorage.removeItem('user_profile')
      }
    }
  }

  const login = async (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken)
    await fetchUser()
  }

  const logout = () => {
    clearTokens()
    setUser(null)
    localStorage.removeItem('user_profile')
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken()
      if (token) {
        // Always fetch user to ensure we have the latest data (roles, avatar, etc.)
        // even if we have a stale user in localStorage
        await fetchUser({ clearOn400: true })
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
