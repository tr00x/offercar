import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import {
  Car,
  Heart,
  MessageCircle,
  User,
  PlusCircle,
  LogIn,
  LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { pathname } = useLocation()
  const { isAuthenticated, user } = useAuth()
  const isBusiness = user?.role_id && user.role_id >= 2

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

  const isActive = (path: string) => pathname === path

  const navItems = isBusiness ? [
    {
      label: getDashboardLabel(),
      icon: LayoutDashboard,
      path: getDashboardUrl(),
      authRequired: true,
    },
    {
      label: 'Catalog',
      icon: Car,
      path: '/',
    },
    {
      label: getActionLabel(),
      icon: PlusCircle,
      path: getActionUrl(),
      primary: true,
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      authRequired: true,
    },
    {
      label: 'Profile',
      icon: User,
      path: '/biz/profile',
      authRequired: true,
    },
  ] : [
    {
      label: 'Catalog',
      icon: Car,
      path: '/',
    },
    {
      label: 'Favorites',
      icon: Heart,
      path: '/favorites',
      authRequired: true,
    },
    {
      label: 'Sell',
      icon: PlusCircle,
      path: '/sell',
      primary: true,
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      authRequired: true,
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile',
      authRequired: true,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-2 pb-2">
        {navItems.map((item) => {
          if (item.authRequired && !isAuthenticated) {
            if (item.label === 'Profile') {
              return (
                <Link
                  key="auth"
                  to="/auth"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                    isActive('/auth') 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LogIn className="h-6 w-6" />
                  <span>Sign In</span>
                </Link>
              )
            }
            return null
          }

          if (item.primary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                )}>
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-medium mt-1 text-foreground">
                  {item.label}
                </span>
              </Link>
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
    </div>
  )
}
