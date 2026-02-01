import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getBusinesses, type Business } from '@/api/businesses'
import { getImageUrl } from '@/api/client'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Truck, Search, Wrench, Calendar, MapPin, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPublicProfile } from '@/api/profile'
import { getCities } from '@/api/references'
import { getCars } from '@/api/cars'
import { BusinessDetailsModal } from '@/components/modals/BusinessDetailsModal'

type TabType = 'dealer' | 'logistic' | 'broker' | 'service'

const TABS: { id: TabType; label: string; icon: LucideIcon; roleId?: number }[] = [
  { id: 'dealer', label: 'Dealers', icon: Building2, roleId: 2 },
  { id: 'logistic', label: 'Logistics', icon: Truck, roleId: 3 },
  { id: 'broker', label: 'Brokers', icon: Search, roleId: 4 },
  { id: 'service', label: 'Services', icon: Wrench, roleId: 5 },
]

interface BusinessCardProps {
  business: Business
  onSelect?: (business: Business) => void
}

function BusinessCard({ business, onSelect }: BusinessCardProps) {
  const { data: profile } = useQuery({
    queryKey: ['public-profile', business.id],
    queryFn: () => getPublicProfile(business.id),
    staleTime: 1000 * 60 * 10,
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: carsData } = useQuery({
    queryKey: ['user-cars', business.id],
    queryFn: () => getCars({ user_id: business.id, limit: 1 }),
  })

  const cityNameFromPublic = (profile as unknown as { city?: { name?: string } } | null)?.city?.name
  const cityIdFromPublic = (profile as unknown as { city_id?: number } | null)?.city_id
  const cityNameFromId =
    cityIdFromPublic && cities ? cities.find((city) => city.id === cityIdFromPublic)?.name : undefined
  const firstCar = carsData?.items?.[0]
  const cityVal = firstCar?.city as unknown as string | { name: string } | undefined
  const cityNameFromCar = typeof cityVal === 'string' ? cityVal : cityVal?.name
  const cityName = cityNameFromPublic || cityNameFromId || cityNameFromCar

  const registeredDate = business.registered ? new Date(business.registered) : null
  const memberSinceLabel = registeredDate
    ? registeredDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })
    : null

  return (
    <button
      type="button"
      key={business.id}
      className="group text-left w-full"
      onClick={() => onSelect?.(business)}
    >
      <Card className="h-full bg-card border-border overflow-hidden hover:border-primary/30 transition-all duration-300 group-hover:-translate-y-1">
        <div className="aspect-[16/9] bg-secondary relative overflow-hidden">
          {business.avatar ? (
            <img
              src={getImageUrl(business.avatar)}
              alt={business.username}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card text-muted-foreground">
              <Building2 className="w-12 h-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-foreground truncate mb-1">
              {business.username || 'Unknown Business'}
            </h3>
            {cityName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{cityName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {memberSinceLabel && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Since {memberSinceLabel}</span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Badge variant="secondary" className="bg-secondary text-muted-foreground hover:bg-secondary/80">
              View details
            </Badge>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Card>
    </button>
  )
}

export function Businesses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const param = searchParams.get('tab') as TabType | null
  const allowed = TABS.map((t) => t.id)
  const activeTab: TabType = param && allowed.includes(param) ? param : 'dealer'

  useEffect(() => {
    if (!param || !allowed.includes(param)) {
      const next = new URLSearchParams(searchParams)
      next.set('tab', activeTab)
      setSearchParams(next, { replace: true })
    }
  }, [activeTab, allowed, param, searchParams, setSearchParams])

  const activeRole = TABS.find((t) => t.id === activeTab)?.roleId

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: businesses, isLoading, error } = useQuery({
    queryKey: ['businesses', activeTab],
    queryFn: () => getBusinesses({ role_id: activeRole }),
  })

  return (
    <div className="min-h-screen bg-background">
      <BusinessDetailsModal
        business={selectedBusiness}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border py-16 sm:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Trusted Business Partners
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Find verified dealers, logistics experts, brokers, and service centers for all your automotive needs.
          </p>

          {/* Custom Tabs */}
          <div className="inline-flex flex-wrap justify-center gap-2 p-1.5 bg-secondary/50 backdrop-blur-sm rounded-2xl border border-border">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('tab', tab.id)
                    setSearchParams(next, { replace: false })
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Failed to load businesses</h3>
            <p className="text-muted-foreground mb-6">Something went wrong while fetching the data.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : !businesses || businesses.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No businesses found</h3>
            <p className="text-muted-foreground">
              {`No ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()} found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onSelect={(b) => {
                  setSelectedBusiness(b)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ArrowUpRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}
