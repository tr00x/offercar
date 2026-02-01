import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { getBusinesses, type Business } from '@/api/businesses'
import { getImageUrl } from '@/api/client'
import { getPublicProfile } from '@/api/profile'
import { getCities } from '@/api/references'
import { getCars } from '@/api/cars'
import type { ThirdPartyProfile } from '@/types'

interface DealerCardProps {
  dealer: Business
  onSelect?: (dealer: Business) => void
}

function DealerCard({ dealer, onSelect }: DealerCardProps) {
  const { data: profile } = useQuery({
    queryKey: ['public-profile', dealer.id],
    queryFn: () => getPublicProfile(dealer.id),
    staleTime: 1000 * 60 * 10,
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: carsData } = useQuery({
    queryKey: ['user-cars', dealer.id],
    queryFn: () => getCars({ user_id: dealer.id, limit: 1 }),
  })

  const thirdParty = profile as unknown as ThirdPartyProfile | undefined
  const bannerPath = thirdParty?.banner || dealer.banner
  const avatarPath = thirdParty?.avatar || dealer.avatar
  const cityNameFromPublic = (profile as unknown as { city?: { name?: string } } | null)?.city?.name
  const cityIdFromPublic = (profile as unknown as { city_id?: number } | null)?.city_id
  const cityNameFromId =
    cityIdFromPublic && cities ? cities.find((city) => city.id === cityIdFromPublic)?.name : undefined
  const firstCar = carsData?.items?.[0]
  const cityVal = firstCar?.city as unknown as string | { name: string } | undefined
  const cityNameFromCar = typeof cityVal === 'string' ? cityVal : cityVal?.name
  const cityName = cityNameFromPublic || cityNameFromId || cityNameFromCar

  return (
    <button
      type="button"
      className="group relative rounded-xl overflow-hidden bg-card border border-border transition-transform hover:-translate-y-1 block h-full w-64 shrink-0 text-left"
      onClick={() => onSelect?.(dealer)}
    >
      <div className="h-24 w-full relative bg-secondary">
        {bannerPath ? (
          <img
            src={getImageUrl(bannerPath)}
            alt={dealer.username}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="p-4 relative -mt-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-2 border-card overflow-hidden bg-secondary mb-2 shrink-0">
          {avatarPath ? (
            <img
              src={getImageUrl(avatarPath)}
              alt={dealer.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-medium">
              {dealer.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <h4 className="text-foreground font-medium text-center truncate w-full group-hover:text-primary transition-colors">
          {dealer.username || 'Unknown Dealer'}
        </h4>
        {cityName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-full">{cityName}</span>
          </div>
        )}
      </div>
    </button>
  )
}

interface DealersRailProps {
  onSelect?: (dealer: Business) => void
}

export function DealersRail({ onSelect }: DealersRailProps) {
  const listRef = useRef<HTMLDivElement | null>(null)

  const { data: dealers, isLoading } = useQuery({
    queryKey: ['businesses', 'home-dealers'],
    queryFn: () => getBusinesses({ role_id: 2 }),
  })

  const items = dealers?.slice(0, 10) || []

  if (!isLoading && items.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-foreground">Dealers</h3>
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="bg-secondary hover:bg-secondary/80 text-foreground"
        >
          <Link to="/biz?tab=dealer">See all</Link>
        </Button>
      </div>

      <div className="relative">
        <div
          ref={listRef}
          className="w-full overflow-x-auto pb-4 scrollbar-hide"
        >
          <div className="flex gap-4 min-w-max">
            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-64 h-40 rounded-xl bg-card border border-border animate-pulse shrink-0"
                  />
                ))
              : items.map((dealer) => (
                  <DealerCard key={dealer.id} dealer={dealer} onSelect={onSelect} />
                ))}
          </div>
        </div>

        {!isLoading && items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                listRef.current?.scrollBy({
                  left: -260,
                  behavior: 'smooth',
                })
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
              aria-label="Previous dealers"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                listRef.current?.scrollBy({
                  left: 260,
                  behavior: 'smooth',
                })
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
              aria-label="Next dealers"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
