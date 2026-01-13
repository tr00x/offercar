import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Calendar, Gauge, Trash2, Edit, Fuel, Settings2, Zap, ArrowRight, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/api/client'
import { deleteCar } from '@/api/cars'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'

import { useFavorites } from '@/hooks/useFavorites'

// Car type that handles both object and string formats from API
interface CarData {
  id: number
  brand?: { name: string } | string
  model?: { name: string } | string
  modification?: { name: string } | string
  city?: { name: string } | string
  transmission?: { name: string } | string
  fuel_type?: { name: string } | string
  engine?: { name: string } | string
  year: number
  price: number
  odometer?: number
  images?: string[]
  new?: boolean
  crash?: boolean
  trade_in?: number
  my_car?: boolean
  status?: number | string
}

interface CarCardProps {
  car: CarData
  onLike?: (carId: number) => void
  isLiked?: boolean
  showActions?: boolean
}

// Helper to get name from object or string
const getName = (value: { name: string } | string | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.name
}

export function CarCard({ car, onLike, isLiked, showActions = false }: CarCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isLiked: checkLiked, toggleLike } = useFavorites()

  const isHeartFilled = isLiked ?? checkLiked(car.id)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onLike) {
      onLike(car.id)
    } else {
      toggleLike(car.id, car)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: deleteCar,
    onMutate: async (carId: number) => {
      await queryClient.cancelQueries({ queryKey: ['my-cars'] })
      await queryClient.cancelQueries({ queryKey: ['my-cars-on-sale'] })
      const prevMyCars = queryClient.getQueryData(['my-cars']) as { items: any[] } | undefined
      const prevOnSale = queryClient.getQueryData(['my-cars-on-sale']) as { items: any[] } | undefined
      if (prevMyCars) {
        queryClient.setQueryData(['my-cars'], {
          ...prevMyCars,
          items: prevMyCars.items.filter((c) => c.id !== carId),
        })
      }
      if (prevOnSale) {
        queryClient.setQueryData(['my-cars-on-sale'], {
          ...prevOnSale,
          items: prevOnSale.items.filter((c) => c.id !== carId),
        })
      }
      return { prevMyCars, prevOnSale }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevMyCars) queryClient.setQueryData(['my-cars'], ctx.prevMyCars)
      if (ctx?.prevOnSale) queryClient.setQueryData(['my-cars-on-sale'], ctx.prevOnSale)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars-on-sale'] })
    },
  })

  const shareTitle = `${getName(car.brand) || ''} ${getName(car.model) || ''}`.trim()
  const shareText = `${shareTitle}${car.year ? ` ${car.year}` : ''}`
  const shareUrl = `${window.location.origin}/cars/${car.id}`

  const tryNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle || 'Car', text: shareText, url: shareUrl })
      } catch {
        toast.error('Share cancelled')
      }
    } else {
      toast('Native share not available')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(shareTitle || 'Car')}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteMutation.mutate(car.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/sell?editId=${car.id}`)
  }

  const imageUrl = getImageUrl(car.images?.[0])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatOdometer = (km: number) => {
    return new Intl.NumberFormat('en-US').format(km) + ' km'
  }

  const brandName = getName(car.brand)
  const modelName = getName(car.model)
  const modificationName = getName(car.modification)
  const cityName = getName(car.city)
  const transmissionName = getName(car.transmission)
  const fuelTypeName = getName(car.fuel_type)
  const engineName = getName(car.engine)

  // Simplify transmission name (e.g. "Automatic Transmission" -> "Automatic")
  const simpleTransmission = transmissionName?.split(' ')[0] || transmissionName

  return (
    <Card className="group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <Link to={`/cars/${car.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
          {car.new && (
            <Badge className="bg-green-500/90 hover:bg-green-500 text-white border-0 shadow-sm backdrop-blur-[2px]">
              New
            </Badge>
          )}
          {car.crash && (
            <Badge variant="destructive" className="shadow-sm opacity-90 backdrop-blur-[2px]">
              Crash
            </Badge>
          )}
          {/* Show Trade-in badge if value > 1 (1 means "No exchange") */}
          {car.trade_in && car.trade_in > 1 && (
            <Badge variant="secondary" className="bg-blue-600/90 hover:bg-blue-600 text-white border-0 shadow-sm backdrop-blur-[2px]">
              Trade-in
            </Badge>
          )}
        </div>

        {/* Like Button (Top Right) */}
        {!car.my_car && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className={cn(
                    "absolute top-3 right-12 z-10 p-2 rounded-full transition-all duration-300",
                    "bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white"
                  )}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={tryNativeShare}>Share</DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>Copy link</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(whatsappUrl)}>WhatsApp</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(telegramUrl)}>Telegram</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(facebookUrl)}>Facebook</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(twitterUrl)}>Twitter/X</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(emailUrl)}>Email</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleLike}
              className={cn(
                "absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300",
                "bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white",
                isHeartFilled && "bg-red-500/20 text-red-500 hover:bg-red-500/30"
              )}
            >
              <Heart className={cn("h-5 w-5", isHeartFilled && "fill-current")} />
            </button>
          </>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Header: Title & Price */}
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <Link to={`/cars/${car.id}`} state={{ from: location }} className="group-hover:text-primary transition-colors">
              <h3 className="font-bold text-lg leading-tight line-clamp-1">
                {brandName} {modelName}
              </h3>
            </Link>
            {car.my_car && showActions && (
              <div className="flex gap-1 -mr-2 -mt-1">
                 <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleEdit}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-primary">
            {formatPrice(car.price)}
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Year">
            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="truncate">{car.year}</span>
          </div>
          
          {car.odometer !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Mileage">
              <Gauge className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{formatOdometer(car.odometer).replace(' km', '')} km</span>
            </div>
          )}

          {simpleTransmission && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Transmission">
              <Settings2 className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{simpleTransmission}</span>
            </div>
          )}

          {fuelTypeName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Fuel Type">
              <Fuel className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{fuelTypeName}</span>
            </div>
          )}

          {(engineName || modificationName) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Engine">
              <Zap className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{engineName || modificationName}</span>
            </div>
          )}
        </div>

        {/* Footer: Location & Action */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          {cityName ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{cityName}</span>
            </div>
          ) : <div />}
          
          <Button size="sm" className="h-8 gap-1.5 rounded-full px-4 group/btn" variant="secondary" asChild>
            <Link to={`/cars/${car.id}`}>
              View
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
