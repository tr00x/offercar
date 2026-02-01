import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { getImageUrl } from '@/api/client'
import { Button } from '@/components/ui/button'
import logo from '@/assets/logo.png'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, LogOut, Plus, Settings, LayoutDashboard, ChevronDown, Ship, Wrench, Briefcase, Store, Sun, Moon, MessageCircle, Globe, Palette } from 'lucide-react'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { AuthCard } from '@/pages/Auth'
import { BusinessLoginCard } from '@/pages/business/Login'
import { Profile as UserProfile } from '@/pages/Profile'
import { BusinessProfile } from '@/pages/business/Profile'
import { UserSell } from '@/pages/user/UserSell'
import { DealerSell } from '@/pages/business/dealer/DealerSell'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isUserLoginOpen, setIsUserLoginOpen] = useState(false)
  const [isBusinessLoginOpen, setIsBusinessLoginOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isUserSellOpen, setIsUserSellOpen] = useState(false)
  const [isDealerSellOpen, setIsDealerSellOpen] = useState(false)

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
  const isDealer = user?.role_id === 2
  const canCreateCar = isAuthenticated && (!user?.role_id || user.role_id === 1 || user.role_id === 2)

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

  const handleCreateAdClick = () => {
    if (!isAuthenticated) {
      setIsUserLoginOpen(true)
      return
    }

    if (isDealer) {
      setIsDealerSellOpen(true)
    } else {
      setIsUserSellOpen(true)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo + Main Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link 
            to={isBusiness ? getDashboardUrl() : "/"} 
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <img src={logo} alt="OfferCars" className="h-8 w-auto sm:h-10" />
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline-block">OfferCars</span>
          </Link>

          {/* Main Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === '/' ? "text-primary" : "text-muted-foreground"
              )}
            >
              Home
            </Link>
            <Link
              to="/cars?posted_by=private"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === '/cars' && location.search.includes('posted_by=private')
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              From owner
            </Link>
            <Link
              to="/cars?new=true"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === '/cars' && location.search.includes('new=true')
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              New cars
            </Link>
            <Link
              to="/cars"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === '/cars' && !location.search ? "text-primary" : "text-muted-foreground"
              )}
            >
              Catalog
            </Link>

             {isAuthenticated && isBusiness && (
               <Link
               to={getDashboardUrl()}
               className={cn(
                 "text-sm font-medium transition-colors hover:text-primary",
                 location.pathname.startsWith('/biz') ? "text-primary" : "text-muted-foreground"
               )}
             >
               {getDashboardLabel()}
             </Link>
            )}
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          {/* Verified Accounts Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span>Verified accounts</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 mt-2 bg-card border-border text-card-foreground"
            >
              <DropdownMenuLabel className="text-xs uppercase text-slate-400">
                Business types
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                <Link to="/biz?tab=dealer" className="cursor-pointer w-full flex items-center">
                  <Store className="mr-2 h-4 w-4" />
                  <span>Dealers</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                <Link to="/biz?tab=logistic" className="cursor-pointer w-full flex items-center">
                  <Ship className="mr-2 h-4 w-4" />
                  <span>Logistics</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                <Link to="/biz?tab=broker" className="cursor-pointer w-full flex items-center">
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>Brokers</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                <Link to="/biz?tab=service" className="cursor-pointer w-full flex items-center">
                  <Wrench className="mr-2 h-4 w-4" />
                  <span>Services</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Ad Button */}
          {canCreateCar && (
            <Button
              className="hidden sm:flex bg-whiteover:bg-neneuttll-2 0text-bbl ckounded-lg px-6"
              onClick={handleCreateAdClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Ad
            </Button>
          )}
          
          {/* Auth / Profile */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full border border-border p-0 hover:bg-accent focus-visible:ring-0 overflow-hidden"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user?.avatar ? getImageUrl(user.avatar) : undefined} alt={user?.name || "User"} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 bg-card border-border text-card-foreground" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || user?.phone}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="focus:bg-white/5 focus:text-white cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                  <Link to="/messages" className="cursor-pointer w-full flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </Link>
                </DropdownMenuItem>

                {isBusiness ? (
                  <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                    <Link to={getDashboardUrl()} className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>{getDashboardLabel()}</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white">
                    <Link to="/garage" className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>My Garage</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="focus:bg-white/5 focus:text-white cursor-pointer">
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Language</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-card border-border text-card-foreground">
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                      <span>English</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                      <span>Русский</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                      <span>Türkmen</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={toggleTheme} className="focus:bg-white/5 focus:text-white cursor-pointer">
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                  {theme === 'dark' ? <Moon className="ml-auto h-3 w-3" /> : <Sun className="ml-auto h-3 w-3" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Dialog open={isUserLoginOpen} onOpenChange={setIsUserLoginOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    Log in
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <AuthCard
                    onSuccess={() => setIsUserLoginOpen(false)}
                    onBusinessLoginClick={() => {
                      setIsUserLoginOpen(false)
                      setIsBusinessLoginOpen(true)
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={isBusinessLoginOpen} onOpenChange={setIsBusinessLoginOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-slate-200 hover:text-white hover:bg-white/5"
                  >
                    Log in as business
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <BusinessLoginCard
                    onSuccess={() => setIsBusinessLoginOpen(false)}
                    onUserLoginClick={() => {
                      setIsBusinessLoginOpen(false)
                      setIsUserLoginOpen(true)
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* User Sell Modal */}
      <Dialog open={isUserSellOpen} onOpenChange={setIsUserSellOpen}>
        <DialogContent fullScreen>
          <UserSell />
        </DialogContent>
      </Dialog>

      {/* Dealer Sell Modal */}
      <Dialog open={isDealerSellOpen} onOpenChange={setIsDealerSellOpen}>
        <DialogContent fullScreen>
          <DealerSell />
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-lg">
          {isBusiness ? <BusinessProfile /> : <UserProfile />}
        </DialogContent>
      </Dialog>
    </header>
  )
}
