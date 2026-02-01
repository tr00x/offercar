import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { BusinessHeader } from './BusinessHeader'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { GlobalAuthModal } from '@/components/modals/GlobalAuthModal'

export function Layout() {
  const { pathname } = useLocation()
  
  // Check if we are in a business dashboard area
  const isBusinessDashboard = 
    pathname.startsWith('/biz/dealer') ||
    pathname.startsWith('/biz/logistic') ||
    pathname.startsWith('/biz/broker') ||
    pathname.startsWith('/biz/service') ||
    pathname === '/biz/profile'

  // Hide bottom nav on car detail pages
  const isCarDetail = /^\/cars\/[^/]+$/.test(pathname)
  const showBottomNav = !isCarDetail

  return (
    <div className="min-h-[100svh] flex flex-col">
      <div className={isCarDetail ? "hidden md:block" : ""}>
        {isBusinessDashboard ? <BusinessHeader /> : <Header />}
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Spacer for BottomNav on mobile */}
      {showBottomNav && <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />}
      {showBottomNav && <BottomNav />}
      <GlobalAuthModal />
    </div>
  )
}
