import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicProfile } from '@/api/profile'
import { getCars } from '@/api/cars'
import { getImageUrl } from '@/api/client'
import { CarCard } from '@/components/cars/CarCard'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { 
  User, Mail, Phone, MapPin, Globe, 
  Instagram, Facebook, Twitter, Linkedin, Youtube, 
  Send, MessageCircle, Video, Info, Car as CarIcon,
  CheckCircle2, Map as MapIcon, ChevronRight, ArrowLeft
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/store/auth'

const SOCIAL_NETWORKS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'telegram', label: 'Telegram', icon: Send },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'tiktok', label: 'TikTok', icon: Video },
]

export function PublicProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = id ? parseInt(id) : undefined

  const { user } = useAuth()
  const isOwnProfile = user?.id === userId

  // State for Dealer modals/toggles
  const [showDetails, setShowDetails] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => userId ? getPublicProfile(userId) : Promise.reject('No ID'),
    enabled: !!userId
  })

  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ['user-cars', userId],
    queryFn: () => userId ? getCars({ user_id: userId, limit: 100 }) : Promise.reject('No ID'),
    enabled: !!userId // Fetch cars for all user types
  })

  // Derived state
  const roleId = profile?.role_id || 1
  const isDealer = roleId === 2
  const isLogist = roleId === 3
  const isBroker = roleId === 4
  const isService = roleId === 5
  const isUser = roleId === 1

  // Get name from cars if available (fallback for when profile endpoint misses name)
  // We cast to any because the strict type might miss 'username' which exists in API
  const firstCar = carsData?.items?.[0]
  const ownerFromCar = firstCar?.owner as unknown as { username?: string, name?: string } | undefined
  const carsOwnerName = ownerFromCar?.username || ownerFromCar?.name

  const displayName = profile?.company_name 
    || carsOwnerName
    || profile?.username 
    || profile?.name 
    || (isOwnProfile ? user?.name : undefined)
    || 'User'

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
      </div>
    )
  }

  const getRoleLabel = () => {
    if (profile.company_type) return profile.company_type
    switch (roleId) {
      case 2: return 'Dealer'
      case 3: return 'Logist'
      case 4: return 'Broker'
      case 5: return 'Tuning service'
      default: return 'User'
    }
  }

  const phones = profile.phone 
    ? profile.phone.split(',').map(p => p.trim()).filter(Boolean)
    : []

  const socialLinks = Object.entries(profile.contacts || {}).map(([key, value]) => {
    const network = SOCIAL_NETWORKS.find(n => n.value === key)
    return {
      key,
      value,
      network
    }
  }).filter((link): link is { key: string, value: string, network: NonNullable<typeof link.network> } => !!link.network)

  const openMap = () => {
    if (profile.coordinates) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${profile.coordinates}`, '_blank')
    } else if (profile.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header Section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 overflow-hidden relative">
          {profile.banner ? (
            <img 
              src={getImageUrl(profile.banner)} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          
          {/* Back button */}
          <div className="absolute top-4 left-4 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-background/40 hover:bg-background/60 text-foreground rounded-full backdrop-blur-sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Profile Info Card - Overlapping Banner */}
        <div className="container mx-auto px-4 -mt-12 relative z-10">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background bg-muted overflow-hidden shrink-0 -mt-10 md:-mt-12 shadow-lg">
                {profile.avatar ? (
                  <img 
                    src={getImageUrl(profile.avatar)} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    {displayName}
                    {roleId >= 2 && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="text-primary font-medium">{getRoleLabel()}</span>
                    {profile.activity_field && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>{profile.activity_field}</span>
                      </>
                    )}
                    {profile.registered && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>Since {new Date(profile.registered).getFullYear()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Location & Contact Summary */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {profile.address && (
                    <div className="flex items-center gap-1.5 text-foreground/80">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{profile.address}</span>
                    </div>
                  )}
                  {phones.length > 0 && (
                    <div className="flex items-center gap-1.5 text-foreground/80">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{phones[0]}{phones.length > 1 && ` (+${phones.length - 1})`}</span>
                    </div>
                  )}
                </div>

                {/* Social Icons Row */}
                {socialLinks.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {socialLinks.map((link) => (
                      <a 
                        key={link.key} 
                        href={link.value} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <link.network.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions (Desktop) */}
              <div className="hidden md:flex flex-col gap-2 min-w-[140px]">
                {phones.length > 0 && (
                  phones.length === 1 ? (
                    <Button className="w-full" asChild>
                      <a href={`tel:${phones[0]}`}>Call Now</a>
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full">Call Now</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        {phones.map((phone, i) => (
                          <DropdownMenuItem key={i} asChild>
                            <a href={`tel:${phone}`} className="w-full cursor-pointer">
                              {phone}
                            </a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                )}
                <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
                  More Info
                </Button>
              </div>
            </div>
            
            {/* Mobile Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4 md:hidden">
              {phones.length > 0 ? (
                phones.length === 1 ? (
                  <Button className="w-full" asChild>
                    <a href={`tel:${phones[0]}`}>Call</a>
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full">Call</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      {phones.map((phone, i) => (
                        <DropdownMenuItem key={i} asChild>
                          <a href={`tel:${phone}`} className="w-full cursor-pointer">
                            {phone}
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              ) : (
                <Button className="w-full" disabled>No Phone</Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 mt-6 space-y-6">
        
        {/* Dealer Inventory or User Garage */}
        {(isDealer || isUser) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{isDealer ? 'Inventory' : 'Garage'}</h2>
              <span className="text-sm text-muted-foreground">{carsData?.total || 0} cars</span>
            </div>
            
            {carsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : carsData?.items && carsData.items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {carsData.items.map(car => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
                <CarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-muted-foreground">No vehicles currently available</h3>
              </div>
            )}
          </div>
        )}

        {/* Logist Destinations */}
        {isLogist && profile.destinations && profile.destinations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Destinations</h3>
            <div className="space-y-2">
              {profile.destinations.map((dest, idx) => (
                <div key={idx} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{dest.from_country.flag}</span>
                    <span className="font-medium">{dest.from_country.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-right">{dest.to_country.name}</span>
                    <span className="text-lg">{dest.to_country.flag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About Section (Inline for Non-Dealers or if short) */}
        {!isDealer && profile.about_us && (
          <div className="space-y-2 bg-card/50 p-4 rounded-xl border border-border">
            <h3 className="font-semibold text-lg">About</h3>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {profile.about_us}
            </p>
          </div>
        )}

        {/* Map Section for Broker/Service */}
        {(isBroker || isService) && (profile.coordinates || profile.address) && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Location</h3>
            <div 
              className="h-48 bg-muted rounded-xl border border-border flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors relative overflow-hidden group"
              onClick={openMap}
            >
              {/* Map Pattern/Placeholder */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }} />
              
              <div className="text-center z-10">
                <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <MapIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium">View on Map</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto px-4 truncate">
                  {profile.address || 'Open location'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0 gap-0 bg-card border-border">
          <DialogHeader className="p-6 pb-2 sticky top-0 bg-card z-10 border-b border-border/40 backdrop-blur-sm">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {profile.avatar ? (
                <img 
                  src={getImageUrl(profile.avatar)} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              Profile Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-8">
            {/* About Section */}
            {profile.about_us && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  About Us
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {profile.about_us}
                </div>
              </section>
            )}

            {/* Business Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Business Info
              </h3>
              <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                <div className="grid grid-cols-[100px_1fr] divide-y divide-border/50">
                  <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">Type</div>
                  <div className="px-4 py-3 text-sm font-medium">{profile.company_type || 'Private Seller'}</div>
                  
                  {profile.activity_field && (
                    <>
                      <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">Activity</div>
                      <div className="px-4 py-3 text-sm">{profile.activity_field}</div>
                    </>
                  )}
                  
                  {profile.vat_number && (
                    <>
                      <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">VAT</div>
                      <div className="px-4 py-3 text-sm font-mono tracking-wide">{profile.vat_number}</div>
                    </>
                  )}
                  
                  {profile.registered && (
                    <>
                      <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">Member</div>
                      <div className="px-4 py-3 text-sm">Since {new Date(profile.registered).getFullYear()}</div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Contact Info */}
            {(profile.address || profile.phone || profile.email) && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contacts
                </h3>
                <div className="space-y-3">
                  {profile.address && (
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                        <p className="text-sm font-medium leading-tight mb-1">{profile.address}</p>
                        <button 
                          onClick={openMap}
                          className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                        >
                          View on Map <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {phones.length > 0 && (
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Phone{phones.length > 1 ? 's' : ''}</p>
                        <div className="space-y-1">
                          {phones.map((phone, i) => (
                            <a key={i} href={`tel:${phone}`} className="text-sm font-medium hover:text-primary transition-colors block">
                              {phone}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.email && (
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${profile.email}`} className="text-sm font-medium hover:text-primary transition-colors block truncate">
                          {profile.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Social Links List */}
            {socialLinks.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Social Media
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {socialLinks.map((link) => (
                    <a 
                      key={link.key}
                      href={link.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <link.network.icon className="h-4 w-4 text-foreground/70" />
                      </div>
                      <span className="text-sm font-medium truncate">{link.network.label}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
