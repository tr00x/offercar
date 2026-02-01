import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/api/client'
import type { Car } from '@/types'

const getName = (value: { name: string } | string | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.name
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)

interface HotDealCardProps {
  car: Car
}

export function HotDealCard({ car }: HotDealCardProps) {
  const brandName = getName(car.brand)
  const modelName = getName(car.model)
  const cityName = getName(car.city)
  const imageUrl = getImageUrl(car.images?.[0])

  return (
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/20 hover:shadow-xl transition-all duration-300">
      <Link to={`/cars/${car.id}`} className="block">
        <div className="relative aspect-[16/9] bg-muted">
          <img
            src={imageUrl}
            alt={`${brandName || ''} ${modelName || ''}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
                img.src = PLACEHOLDER_IMAGE
              }
            }}
          />

          <div className="absolute inset-x-0 bottom-0 p-3 pt-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-between h-full">
            <p className="text-[13px] text-slate-100 line-clamp-2">
              {brandName} {modelName}
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span className="inline-flex items-center rounded-md border border-red-500 bg-black/60 px-2 py-0.5 text-xs font-semibold text-red-400">
                {formatPrice(car.price)}
              </span>
              {cityName && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
                  <MapPin className="h-3 w-3" />
                  <span className={cn('truncate max-w-[120px] text-right')}>{cityName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}
