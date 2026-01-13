import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { BusinessHeader } from './BusinessHeader'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'

export function Layout() {
  const { pathname } = useLocation()
  
  // Check if we are in a business dashboard area
  const isBusinessDashboard = 
    pathname.startsWith('/biz/dealer') ||
    pathname.startsWith('/biz/logistic') ||
    pathname.startsWith('/biz/broker') ||
    pathname.startsWith('/biz/service') ||
    pathname === '/biz/profile'

  return (
    <div className="min-h-screen flex flex-col">
      {isBusinessDashboard ? <BusinessHeader /> : <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Spacer for BottomNav on mobile */}
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />
      <BottomNav />
    </div>
  )
}
