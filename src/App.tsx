import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/store/auth'
import { ThemeProvider } from '@/store/theme'
import { ChatProvider } from '@/store/chat'
import { Layout } from '@/components/layout/Layout'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Pages
import { Index } from '@/pages/Index'
import { Home } from '@/pages/Home'
import { CarDetail } from '@/pages/CarDetail'
import { Profile } from '@/pages/Profile'
import { UserGarage } from '@/pages/UserGarage'
import { UserSell } from '@/pages/user/UserSell'
import { DealerSell } from '@/pages/business/dealer/DealerSell'
import { Messages } from '@/pages/Messages'
import { Chat } from '@/pages/Chat'
import { BusinessApply } from '@/pages/business/Apply'
import { Garage } from '@/pages/business/dealer/Garage'
import { BrokerDashboard } from '@/pages/business/broker/Dashboard'
import { SearchCars } from '@/pages/business/broker/SearchCars'
import { ServiceDashboard } from '@/pages/business/service/Dashboard'
import { NewAppointment } from '@/pages/business/service/NewAppointment'
import { BusinessProfile } from '@/pages/business/Profile'
import { Businesses } from '@/pages/Businesses'

// Info pages
import { HelpCenter } from '@/pages/info/HelpCenter'
import { Contact } from '@/pages/info/Contact'
import { Privacy } from '@/pages/info/Privacy'
import { Terms } from '@/pages/info/Terms'

import './index.css'

import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: number[]
}

function getBusinessDashboardPath(roleId?: number) {
  switch (roleId) {
    case 2:
      return '/biz/dealer/garage'
    case 3:
      return '/biz/logistic/dashboard'
    case 4:
      return '/biz/broker/dashboard'
    case 5:
      return '/biz/service/dashboard'
    default:
      return '/'
  }
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, openAuthModal } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal()
    }
  }, [isLoading, isAuthenticated, openAuthModal])

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roleId = user?.role_id
    if (!roleId || !allowedRoles.includes(roleId)) {
      const redirectPath = getBusinessDashboardPath(roleId)
      return <Navigate to={redirectPath} replace />
    }
  }

  return <>{children}</>
}

function BizGarageRedirect() {
  const { user } = useAuth()
  const to = getBusinessDashboardPath(user?.role_id)
  return <Navigate to={to} replace />
}

function ScrollToTop() {
  const location = useLocation()

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return null
}

function HomeWithKey() {
  const location = useLocation()
  return <Home key={location.search} />
}

function UserSellModalRoute() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user?.role_id && user.role_id !== 2) {
    const redirectPath = getBusinessDashboardPath(user.role_id)
    return <Navigate to={redirectPath} replace />
  }

  return (
    <Dialog open onOpenChange={(open) => !open && navigate(-1)}>
      <DialogContent fullScreen>
        <UserSell />
      </DialogContent>
    </Dialog>
  )
}

function DealerSellModalRoute() {
  const navigate = useNavigate()

  return (
    <Dialog open onOpenChange={(open) => !open && navigate(-1)}>
      <DialogContent fullScreen>
        <DealerSell />
      </DialogContent>
    </Dialog>
  )
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Index />} />
        <Route path="index" element={<Index />} />
        <Route path="cars" element={<HomeWithKey />} />
        <Route path="cars/:id" element={<CarDetail />} />

        {/* Protected user routes */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="garage"
          element={
            <ProtectedRoute>
              <UserGarage />
            </ProtectedRoute>
          }
        />
        <Route
          path="sell"
          element={
            <ProtectedRoute>
              <UserSellModalRoute />
            </ProtectedRoute>
          }
        />

        <Route
          path="messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat/:id"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Business routes */}
        <Route path="biz" element={<Businesses />} />
        <Route path="biz/apply" element={<BusinessApply />} />
        <Route
          path="biz/garage"
          element={
            <ProtectedRoute allowedRoles={[2, 3, 4, 5]}>
              <BizGarageRedirect />
            </ProtectedRoute>
          }
        />
        
        {/* Dealer Routes */}
        <Route
          path="biz/dealer/garage"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <Garage />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/dealer/new"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <DealerSellModalRoute />
            </ProtectedRoute>
          }
        />

        {/* Logistic Routes - Redirect to Profile */}
        <Route
          path="biz/logistic/dashboard"
          element={<Navigate to="/biz/profile" replace />}
        />
        <Route
          path="biz/logistic/new"
          element={<Navigate to="/biz/profile" replace />}
        />

        {/* Broker Routes */}
        <Route
          path="biz/broker/dashboard"
          element={
            <ProtectedRoute allowedRoles={[4]}>
              <BrokerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/broker/search"
          element={
            <ProtectedRoute allowedRoles={[4]}>
              <SearchCars />
            </ProtectedRoute>
          }
        />

        {/* Service Routes */}
        <Route
          path="biz/service/dashboard"
          element={
            <ProtectedRoute allowedRoles={[5]}>
              <ServiceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/service/new"
          element={
            <ProtectedRoute allowedRoles={[5]}>
              <NewAppointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="biz/profile"
          element={
            <ProtectedRoute>
              <BusinessProfile />
            </ProtectedRoute>
          }
        />

        {/* Info pages */}
        <Route path="help" element={<HelpCenter />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ChatProvider>
            <AppRoutes />
            <Toaster
            position={isMobile ? 'top-center' : 'top-right'}
            toastOptions={{
              className:
                'mt-16 rounded-xl border border-white/10 bg-slate-900 text-slate-50 shadow-lg shadow-black/40 px-4 py-3 text-sm',
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#020617',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#020617',
                },
              },
            }}
          />
            </ChatProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
