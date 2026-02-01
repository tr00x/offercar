import { Link } from 'react-router-dom'
import { Ship, Wrench, Briefcase } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { getBusinesses, type Business } from '@/api/businesses'
import { getImageUrl } from '@/api/client'
import { getPublicProfile } from '@/api/profile'
import { getCities } from '@/api/references'
import { getCars } from '@/api/cars'

interface BusinessColumnProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  roleId: number
  link: string
  onSelect?: (business: Business) => void
}

interface BusinessRowProps {
  item: Business
  onSelect?: (business: Business) => void
}

function BusinessRow({ item, onSelect }: BusinessRowProps) {
  const { data: profile } = useQuery({
    queryKey: ['public-profile', item.id],
    queryFn: () => getPublicProfile(item.id),
    staleTime: 1000 * 60 * 10,
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: carsData } = useQuery({
    queryKey: ['user-cars', item.id],
    queryFn: () => getCars({ user_id: item.id, limit: 1 }),
  })

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
      className="flex items-center gap-3 group w-full text-left"
      onClick={() => onSelect?.(item)}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border group-hover:border-primary/20 transition-colors">
        {item.avatar ? (
          <img src={getImageUrl(item.avatar)} alt={item.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-xs text-muted-foreground">{item.username?.[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {item.username || 'Unknown'}
        </p>
        {cityName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{cityName}</span>
          </div>
        )}
      </div>
    </button>
  )
}

function BusinessColumn({ title, icon: Icon, roleId, link, onSelect }: BusinessColumnProps) {
  const { data: businesses } = useQuery({
    queryKey: ['businesses', 'home-grid', roleId],
    queryFn: () => getBusinesses({ role_id: roleId }),
  })

  const items = businesses?.slice(0, 5) || []

  return (
    <div className="bg-card rounded-2xl p-5 border border-border flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-medium">{title}</h3>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-4 flex-1">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No businesses found
          </div>
        ) : (
          items.map((item: Business) => (
            <BusinessRow key={item.id} item={item} onSelect={onSelect} />
          ))
        )}
      </div>

      <Button asChild variant="secondary" className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-foreground border-none">
        <Link to={link}>
          See all
        </Link>
      </Button>
    </div>
  )
}

interface BusinessGridProps {
  onSelect?: (business: Business) => void
}

export function BusinessGrid({ onSelect }: BusinessGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BusinessColumn 
        title="Logistics companies" 
        icon={Ship} 
        roleId={3}
        link="/biz?tab=logistic"
        onSelect={onSelect}
      />
      <BusinessColumn 
        title="Service centers" 
        icon={Wrench} 
        roleId={5}
        link="/biz?tab=service"
        onSelect={onSelect}
      />
      <BusinessColumn 
        title="Brokers" 
        icon={Briefcase} 
        roleId={4}
        link="/biz?tab=broker"
        onSelect={onSelect}
      />
    </div>
  )
}
