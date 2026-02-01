import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ArrowRight,
  Info,
  CheckCircle2,
  Map as MapIcon,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getPublicProfile } from '@/api/profile'
import { getCars } from '@/api/cars'
import { getImageUrl } from '@/api/client'
import { getCities } from '@/api/references'
import { CarCard } from '@/components/cars/CarCard'
import type { Business } from '@/api/businesses'
import type { CarsResponse, ThirdPartyProfile } from '@/types'
import { getSocialIcon, getSocialLabel } from '@/lib/social-icons'

interface BusinessDetailsModalProps {
  business: Business | null
  isOpen: boolean
  onClose: () => void
}

export function BusinessDetailsModal({ business, isOpen, onClose }: BusinessDetailsModalProps) {
  const navigate = useNavigate()

  const { data: profile } = useQuery<ThirdPartyProfile | null>({
    queryKey: ['public-profile', business?.id],
    queryFn: async () => {
      if (!business) return null
      return getPublicProfile(business.id)
    },
    enabled: !!business && isOpen,
    staleTime: 1000 * 60 * 10,
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: carsData } = useQuery<CarsResponse | null>({
    queryKey: ['business-cars-slider', business?.id],
    queryFn: async () => {
      if (!business) return null
      return getCars({ user_id: business.id, limit: 10 })
    },
    enabled: !!business && isOpen,
  })

  if (!business) return null

  const registeredDate = business.registered ? new Date(business.registered) : null
  const memberSinceLabel = registeredDate
    ? registeredDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    : null

  const roleId = profile?.role_id || 1
  const isDealer = roleId === 2
  const isLogist = roleId === 3
  const isBroker = roleId === 4
  const isService = roleId === 5
  const canSellCars = roleId === 1 || roleId === 2

  const businessRoleLabel = (() => {
    switch (roleId) {
      case 2:
        return 'Dealer'
      case 3:
        return 'Logist'
      case 4:
        return 'Broker'
      case 5:
        return 'Service'
      default:
        return 'User'
    }
  })()

  const phones = profile?.phone
    ? profile.phone
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
    : []

  const cars = carsData?.items || []

  const cityNameFromProfile = profile?.city?.name
  const cityIdFromProfile = (profile as unknown as { city_id?: number } | null)?.city_id
  const cityNameFromId =
    cityIdFromProfile && cities ? cities.find((city) => city.id === cityIdFromProfile)?.name : undefined
  const firstCar = cars[0]
  const cityVal = firstCar?.city as unknown as string | { name: string } | undefined
  const cityNameFromCar = typeof cityVal === 'string' ? cityVal : cityVal?.name
  const cityName = cityNameFromProfile || cityNameFromId || business.city?.name || cityNameFromCar

  const socialLinks =
    profile?.contacts
      ? Object.entries(profile.contacts)
          .map(([key, value]) => ({
            key,
            value,
            label: getSocialLabel(key),
            icon: getSocialIcon(key),
          }))
          .filter((link) => !!link.value)
      : []

  const openMap = () => {
    if (profile?.coordinates) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${profile.coordinates}`, '_blank')
    } else if (profile?.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`,
        '_blank',
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[90vw] p-0 flex flex-col"
        closeButtonClassName="bg-white/10 hover:bg-white/20 border-transparent text-white sm:-right-10 sm:-top-2 sm:translate-x-0 sm:translate-y-0 fixed sm:absolute z-50 right-4 top-4"
      >
        <div className="flex flex-col w-full h-full overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Business Details</DialogTitle>
          <div className="overflow-y-auto scrollbar-hide">
            <div className="relative h-48 sm:h-64 bg-muted">
            {business.banner || profile?.banner ? (
              <img
                src={getImageUrl(business.banner || profile?.banner || '')}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center">
                <Building2 className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute -bottom-10 left-6 sm:left-10 flex items-end">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-xl">
                {business.avatar || profile?.avatar ? (
                  <img
                    src={getImageUrl(business.avatar || profile?.avatar || '')}
                    alt={business.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <Building2 className="w-8 h-8 sm:w-12 sm:h-12" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-14 px-6 sm:px-10 pb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {business.username || 'Unknown Business'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {businessRoleLabel}
                  </span>
                  {cityName && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{cityName}</span>
                      </div>
                      {(profile?.coordinates || profile?.address) && (
                        <button
                          type="button"
                          onClick={openMap}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>Google Maps</span>
                        </button>
                      )}
                    </div>
                  )}
                  {memberSinceLabel && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Since {memberSinceLabel}</span>
                    </div>
                  )}
                </div>
                {profile?.about_us && (
                  <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                    {profile.about_us}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  {phones[0] && (
                    <Button
                      asChild
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <a href={`tel:${phones[0]}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Позвонить
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2 border-border hover:bg-muted text-foreground"
                    onClick={() => {
                      navigate(`/chat/${business.id}`)
                      onClose()
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Написать
                  </Button>
                </div>

                {(profile?.address || profile?.phone || profile?.email) && (
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                      Contacts
                    </div>
                    {profile.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5" />
                        <span className="break-words">{profile.address}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {socialLinks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                      Social media
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((link) => {
                        const Icon = link.icon
                        return (
                          <a
                            key={link.key}
                            href={link.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs text-foreground hover:bg-muted transition-colors"
                          >
                            <Icon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            <span>{link.label}</span>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {canSellCars && (
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                >
                  <Link to={`/cars?user_id=${business.id}`} onClick={onClose}>
                    View all cars
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>

            {profile && (
              <div className="mt-10 flex flex-col gap-6">
                <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Info className="w-4 h-4 text-primary" />
                    <span>Business info</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium text-foreground">{businessRoleLabel}</span>
                    </div>
                    {profile.company_type && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Company type</span>
                        <span className="font-medium text-right text-foreground">{profile.company_type}</span>
                      </div>
                    )}
                    {profile.activity_field && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Activity</span>
                        <span className="font-medium text-right text-foreground">{profile.activity_field}</span>
                      </div>
                    )}
                    {cityName && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">City</span>
                        <span className="font-medium text-right text-foreground">{cityName}</span>
                      </div>
                    )}
                    {profile.vat_number && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">VAT</span>
                        <span className="font-mono text-xs tracking-wide text-right text-foreground">
                          {profile.vat_number}
                        </span>
                      </div>
                    )}
                    {memberSinceLabel && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Member since</span>
                        <span className="font-medium text-right text-foreground">Since {memberSinceLabel}</span>
                      </div>
                    )}
                    {isDealer && carsData && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Cars on site</span>
                        <span className="font-medium text-right text-foreground">
                          {carsData.total ?? cars.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isLogist && profile.destinations && profile.destinations.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MapIcon className="w-4 h-4 text-primary" />
                      <span>Destinations</span>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                      {profile.destinations.map((dest, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-2">
                            {dest.from_country.flag && (dest.from_country.flag.includes('/') || dest.from_country.flag.length > 4) ? (
                              <img src={getImageUrl(dest.from_country.flag)} alt={dest.from_country.name} className="w-6 h-4 object-cover rounded-sm" />
                            ) : (
                              <span className="text-lg">{dest.from_country.flag}</span>
                            )}
                            <span className="text-sm font-medium text-foreground">{dest.from_country.name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-right text-foreground">
                              {dest.to_country.name}
                            </span>
                            {dest.to_country.flag && (dest.to_country.flag.includes('/') || dest.to_country.flag.length > 4) ? (
                              <img src={getImageUrl(dest.to_country.flag)} alt={dest.to_country.name} className="w-6 h-4 object-cover rounded-sm" />
                            ) : (
                              <span className="text-lg">{dest.to_country.flag}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(isBroker || isService) && (profile.coordinates || profile.address) && (
                  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MapIcon className="w-4 h-4 text-primary" />
                      <span>Location</span>
                    </div>
                    <button
                      type="button"
                      onClick={openMap}
                      className="mt-2 w-full h-40 bg-muted/30 rounded-xl border border-border flex items-center justify-center relative overflow-hidden group"
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                          backgroundSize: '20px 20px',
                        }}
                      />
                      <div className="text-center z-10">
                        <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          <MapIcon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">View on Map</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto px-4 truncate">
                          {profile.address || 'Open location'}
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {canSellCars && cars.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Recent arrivals</h3>
                  <Link
                    to={`/cars?user_id=${business.id}`}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                    onClick={onClose}
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 sm:-mx-10 sm:px-10 scrollbar-hide scroll-smooth">
                  {cars.map((car) => (
                    <div key={car.id} className="w-[280px] shrink-0">
                      <CarCard car={car} variant="grid" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
