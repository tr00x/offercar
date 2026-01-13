import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { getImageUrl } from '@/api/client'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.svg'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  LogOut,
  Plus,
  Settings,
  LayoutDashboard,
  Car,
  Heart,
  MessageCircle,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Helper to get initials
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
        .slice(0, 2)
    }
    return 'U'
  }

  const isBusiness = user?.role_id && user.role_id >= 2

  const getDashboardUrl = () => {
    if (!user?.role_id) return '/'
    switch (user.role_id) {
      case 2: return '/biz/dealer/garage'
      case 3: return '/biz/logistic/dashboard'
      case 4: return '/biz/broker/dashboard'
      case 5: return '/biz/service/dashboard'
      default: return '/biz/dealer/garage'
    }
  }

  const getDashboardLabel = () => {
    if (!user?.role_id) return 'My Business'
    switch (user.role_id) {
      case 2: return 'My Garage'
      case 3: return 'My Routes'
      case 4: return 'My Requests'
      case 5: return 'My Services'
      default: return 'My Business'
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
    if (!user?.role_id) return 'Sell Car'
    switch (user.role_id) {
      case 2: return 'Sell Car'
      case 3: return 'New Route'
      case 4: return 'Find Car'
      case 5: return 'Book'
      default: return 'Sell Car'
    }
  }

  const navItems = [
    { label: 'Catalog', path: '/', icon: Car },
    { label: 'Dealers', path: '/biz', icon: Briefcase },
    ...(isAuthenticated && !isBusiness ? [{ label: 'Favorites', path: '/favorites', icon: Heart }] : []),
    ...(isAuthenticated && isBusiness ? [{ label: getDashboardLabel(), path: getDashboardUrl(), icon: LayoutDashboard }] : []),
    ...(isAuthenticated ? [{ label: 'Messages', path: '/messages', icon: MessageCircle }] : []),
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          to={isBusiness ? getDashboardUrl() : "/"} 
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <img src={logo} alt="MashynBazar" className="h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                isActive(item.path) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button 
            asChild 
            className="rounded-full shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/90 hover:scale-105"
          >
            <Link to={getActionUrl()}>
              <Plus className="mr-2 h-4 w-4" />
              {getActionLabel()}
            </Link>
          </Button>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full border border-border/50 p-0 hover:bg-transparent focus-visible:ring-0 overflow-hidden transition-transform hover:scale-105"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={getImageUrl(user?.avatar)} alt={user?.name || "User"} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 bg-background border-border shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || user?.phone}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={isBusiness ? "/biz/profile" : "/profile"} className="cursor-pointer w-full flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {isBusiness ? (
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardUrl()} className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>{getDashboardLabel()}</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>My Listings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
