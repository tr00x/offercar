import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
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
  Truck,
  FileText,
  Wrench,
  Search,
  MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/api/client'

export function BusinessHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
    }
    return 'B'
  }

  const roleId = user?.role_id || 0

  const getDashboardLink = () => {
    switch (roleId) {
      case 2: return '/biz/dealer/garage'
      case 3: return '/biz/logistic/dashboard'
      case 4: return '/biz/broker/dashboard'
      case 5: return '/biz/service/dashboard'
      default: return '/biz'
    }
  }

  const getNavItems = () => {
    switch (roleId) {
      case 2: // Dealer
        return [
          { label: 'Garage', path: '/biz/dealer/garage', icon: LayoutDashboard },
          { label: 'Sell Car', path: '/biz/dealer/new', icon: Plus },
        ]
      case 3: // Logistic
        return [
          { label: 'Dashboard', path: '/biz/logistic/dashboard', icon: LayoutDashboard },
          { label: 'New Route', path: '/biz/logistic/new', icon: Plus },
        ]
      case 4: // Broker
        return [
          { label: 'Dashboard', path: '/biz/broker/dashboard', icon: LayoutDashboard },
          { label: 'Find Car', path: '/biz/broker/search', icon: Search },
        ]
      case 5: // Service
        return [
          { label: 'Dashboard', path: '/biz/service/dashboard', icon: LayoutDashboard },
          { label: 'New Appointment', path: '/biz/service/new', icon: Plus },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          to={getDashboardLink()} 
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <img src={logo} alt="MashynBazar Business" className="h-12 w-auto" />
          <span className="font-bold text-xl hidden sm:inline-block">Business</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                "text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Link>
          ))}
          <Link
            to="/messages"
            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Messages
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={user?.avatar ? getImageUrl(user.avatar) : undefined} alt={user?.name} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/biz/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">
                  <Search className="mr-2 h-4 w-4" />
                  <span>Public Catalog</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
