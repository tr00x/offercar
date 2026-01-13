import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/store/auth'
import { Layout } from '@/components/layout/Layout'
import { Spinner } from '@/components/ui/spinner'

// Pages
import { Home } from '@/pages/Home'
import { CarDetail } from '@/pages/CarDetail'
import { Auth } from '@/pages/Auth'
import { Profile } from '@/pages/Profile'
import { PublicProfile } from '@/pages/PublicProfile'
import { UserSell } from '@/pages/user/UserSell'
import { DealerSell } from '@/pages/business/dealer/DealerSell'
import { Favorites } from '@/pages/Favorites'
import { Messages } from '@/pages/Messages'
import { Chat } from '@/pages/Chat'
import { BusinessApply } from '@/pages/business/Apply'
import { BusinessLogin } from '@/pages/business/Login'
import { Garage } from '@/pages/business/dealer/Garage'
import { LogisticDashboard } from '@/pages/business/logistic/Dashboard'
import { NewRoute } from '@/pages/business/logistic/NewRoute'
import { BrokerDashboard } from '@/pages/business/broker/Dashboard'
import { SearchCars } from '@/pages/business/broker/SearchCars'
import { ServiceDashboard } from '@/pages/business/service/Dashboard'
import { NewAppointment } from '@/pages/business/service/NewAppointment'
import { BusinessProfile } from '@/pages/business/Profile'
import { Businesses } from '@/pages/Businesses'

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

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="cars" element={<Home />} />
        <Route path="cars/:id" element={<CarDetail />} />
        <Route path="user/:id" element={<PublicProfile />} />
        <Route path="auth" element={<Auth />} />

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
          path="sell"
          element={
            <ProtectedRoute>
              <UserSell />
            </ProtectedRoute>
          }
        />
        <Route
          path="favorites"
          element={
            <ProtectedRoute>
              <Favorites />
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
        <Route path="biz/auth" element={<BusinessLogin />} />
        <Route path="biz/garage" element={<Navigate to="/biz/dealer/garage" replace />} />
        
        {/* Dealer Routes */}
        <Route
          path="biz/dealer/garage"
          element={
            <ProtectedRoute>
              <Garage />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/dealer/new"
          element={
            <ProtectedRoute>
              <DealerSell />
            </ProtectedRoute>
          }
        />

        {/* Logistic Routes */}
        <Route
          path="biz/logistic/dashboard"
          element={
            <ProtectedRoute>
              <LogisticDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/logistic/new"
          element={
            <ProtectedRoute>
              <NewRoute />
            </ProtectedRoute>
          }
        />

        {/* Broker Routes */}
        <Route
          path="biz/broker/dashboard"
          element={
            <ProtectedRoute>
              <BrokerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/broker/search"
          element={
            <ProtectedRoute>
              <SearchCars />
            </ProtectedRoute>
          }
        />

        {/* Service Routes */}
        <Route
          path="biz/service/dashboard"
          element={
            <ProtectedRoute>
              <ServiceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="biz/service/new"
          element={
            <ProtectedRoute>
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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
