import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import {
  Car,
  MessageCircle,
  User,
  PlusCircle,
  LogIn,
  LayoutDashboard,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { UserSell } from '@/pages/user/UserSell'
import { DealerSell } from '@/pages/business/dealer/DealerSell'

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, openAuthModal } = useAuth()
  const isBusiness = user?.role_id && user.role_id >= 2
  const isDealer = user?.role_id === 2
  const [isUserSellOpen, setIsUserSellOpen] = useState(false)
  const [isDealerSellOpen, setIsDealerSellOpen] = useState(false)

  const getDashboardUrl = () => {
    if (!user?.role_id) return '/biz/dealer/garage'
    switch (user.role_id) {
      case 2: return '/biz/dealer/garage'
      case 3: return '/biz/logistic/dashboard'
      case 4: return '/biz/broker/dashboard'
      case 5: return '/biz/service/dashboard'
      default: return '/biz/dealer/garage'
    }
  }

  const getDashboardLabel = () => {
    if (!user?.role_id) return 'Garage'
    switch (user.role_id) {
      case 2: return 'Garage'
      case 3: return 'Routes'
      case 4: return 'Requests'
      case 5: return 'Services'
      default: return 'Garage'
    }
  }

  const getActionUrl = () => {
    if (!user?.role_id) return '/sell'
    switch (user.role_id) {
      case 2: return '/biz/dealer/new'
      case 3: return '/biz/logistic/new'
      case 4: return '/biz/broker/search'
      case 5: return '/biz/service/new'
      default: return '/sell'
    }
  }

  const getActionLabel = () => {
    if (!user?.role_id) return 'Sell'
    switch (user.role_id) {
      case 2: return 'Sell'
      case 3: return 'New Route'
      case 4: return 'Find Car'
      case 5: return 'Book'
      default: return 'Sell'
    }
  }

  const isActive = (path: string) => pathname.startsWith(path)

  const canCreateCar = isAuthenticated && (!user?.role_id || user.role_id === 1 || user.role_id === 2)

  const handlePrimaryClick = (path: string, label: string) => {
    if (label === 'Sell' && canCreateCar) {
      if (isDealer) {
        setIsDealerSellOpen(true)
      } else {
        setIsUserSellOpen(true)
      }
      return
    }

    navigate(path)
  }

  const getNavItems = () => {
    // Base items for everyone
    const homeItem = {
      label: 'Home',
      icon: Home,
      path: '/',
      authRequired: false,
      primary: false,
    }

    const catalog = {
      label: 'Catalog',
      icon: Car,
      path: '/cars',
      authRequired: false,
      primary: false,
    }
    const messages = {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      authRequired: true,
      primary: false,
    }
    
    // Non-business user items
    if (!isBusiness) {
      const sellItem = {
        label: 'Sell',
        icon: PlusCircle,
        path: '/sell',
        primary: true,
        authRequired: true,
      }

      return [
        homeItem,
        catalog,

        ...(canCreateCar ? [sellItem] : []),
        messages,
        {
          label: 'Profile',
          icon: User,
          path: '/profile',
          authRequired: true,
          primary: false,
        },
      ]
    }

    // Logist items (Role 3) - No dashboard, no add route
    if (user?.role_id === 3) {
      return [
        homeItem,
        catalog,
        messages,
        {
          label: 'Profile',
          icon: User,
          path: '/biz/profile',
          authRequired: true,
          primary: false,
        },
      ]
    }

    // Other business roles (Dealer, Broker, Service)
    const baseItems = [
      homeItem,
      {
        label: getDashboardLabel(),
        icon: LayoutDashboard,
        path: getDashboardUrl(),
        authRequired: true,
        primary: false,
      },
      catalog,
      messages,
      {
        label: 'Profile',
        icon: User,
        path: '/biz/profile',
        authRequired: true,
        primary: false,
      },
    ]

    if (user?.role_id === 2 && canCreateCar) {
      const sellItem = {
        label: getActionLabel(),
        icon: PlusCircle,
        path: getActionUrl(),
        primary: true,
        authRequired: true,
      }
      // Dealer items: Home, Dashboard, Sell, Messages, Profile (5 items)
      // baseItems = [Home, Dashboard, Catalog, Messages, Profile]
      // We drop Catalog in favor of Messages for the limited space
      return [homeItem, baseItems[1], sellItem, baseItems[3], baseItems[4]]
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-2 pb-2">
        {navItems.map((item) => {
          if (item.authRequired && !isAuthenticated) {
            if (item.label === 'Profile') {
              return (
                <button
                  key="auth"
                  type="button"
                  onClick={openAuthModal}
                  className="flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground"
                >
                  <LogIn className="h-6 w-6" />
                  <span>Sign In</span>
                </button>
              )
            }
            return null
          }

          if (item.primary) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handlePrimaryClick(item.path, item.label)}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-transform active:scale-95",
                  "bg-primary text-primary-foreground"
                )}>
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-medium mt-1 text-foreground">
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                isActive(item.path) 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive(item.path) && "fill-current")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <Dialog open={isUserSellOpen} onOpenChange={setIsUserSellOpen}>
        <DialogContent fullScreen>
          <UserSell onSuccess={() => setIsUserSellOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isDealerSellOpen} onOpenChange={setIsDealerSellOpen}>
        <DialogContent fullScreen>
          <DealerSell onSuccess={() => setIsDealerSellOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
