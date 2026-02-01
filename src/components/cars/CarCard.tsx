import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Trash2, Edit, ArrowRight, Upload, Eye, Clock, Check, Copy, Send, MessageCircle, XCircle, CheckCircle, Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/api/client'
import { deleteCar } from '@/api/cars'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { Car } from '@/types'

import { useFavorites } from '@/hooks/useFavorites'

type CarCardCar = Car

interface CarCardProps {
  car: CarCardCar
  onLike?: (carId: number) => void
  isLiked?: boolean
  showActions?: boolean
  variant?: 'grid' | 'list'
  onDeactivate?: () => void
  onReactivate?: () => void
  disableDeactivate?: boolean
  disableReactivate?: boolean
  onEdit?: (carId: number) => void
}

// Helper to get name from object or string
const getName = (value: { name: string } | string | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.name
}

const shortenLocation = (name: string | undefined): string | undefined => {
  if (!name) return undefined
  return name
    .replace(/United Arab Emirates/g, 'UAE')
    .replace(/United States/g, 'USA')
    .replace(/United Kingdom/g, 'UK')
    .replace(/Saudi Arabia/g, 'KSA')
}

export function CarCard({
  car,
  onLike,
  isLiked,
  showActions = false,
  variant = 'grid',
  onDeactivate,
  onReactivate,
  disableDeactivate,
  disableReactivate,
  onEdit,
}: CarCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isLiked: checkLiked, toggleLike } = useFavorites()

  const isHeartFilled = isLiked ?? checkLiked(car.id)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)

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
      const prevMyCars = queryClient.getQueryData(['my-cars']) as { items: Car[] } | undefined
      const prevOnSale = queryClient.getQueryData(['my-cars-on-sale']) as { items: Car[] } | undefined
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
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car'] })
      queryClient.invalidateQueries({ queryKey: ['liked-cars'] })
    },
  })

  const shareTitle = `${getName(car.brand) || ''} ${getName(car.model) || ''}`.trim()
  const shareText = `${shareTitle}${car.year ? ` ${car.year}` : ''}`
  const shareUrl = `${window.location.origin}/cars/${car.id}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowShareDialog(true)
  }

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
    if (onEdit) {
      onEdit(car.id)
    } else {
      navigate(`/sell?editId=${car.id}`)
    }
  }

  const imageUrl = getImageUrl(car.images?.[0] || car.generation?.image)

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffTime = d2.getTime() - d1.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const brandName = getName(car.brand)
  const modelName = getName(car.model)
  const modificationName = getName(car.modification)
  const cityName = shortenLocation(getName(car.city))
  const transmissionName = getName(car.transmission)
  const fuelTypeName = getName(car.fuel_type)
  const engineName = getName(car.engine)

  // Simplify transmission name (e.g. "Automatic Transmission" -> "Automatic")
  const simpleTransmission = transmissionName?.split(' ')[0] || transmissionName

  const isList = variant === 'list'

  const specs: string[] = []
  if (fuelTypeName) specs.push(fuelTypeName)
  if (simpleTransmission) specs.push(simpleTransmission)
  const engineLabel = engineName || modificationName
  if (engineLabel) specs.push(engineLabel)

  return (
    <>
      <Card
        className={cn(
          'group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300',
          isList ? 'hover:-translate-y-0' : 'hover:-translate-y-1'
        )}
      >
      <div className={cn(isList ? 'flex gap-3 md:gap-4' : '')}>
        <div
          className={cn('relative', isList && 'w-24 sm:w-28 md:w-56 flex-shrink-0')}
        >
          <Link to={`/cars/${car.id}`} className="block">
            <div
              className={cn(
                'relative overflow-hidden bg-muted',
                isList
                  ? 'aspect-[16/9] md:aspect-[4/3] rounded-md border border-white/15'
                  : 'aspect-[16/9] md:aspect-[3/2]'
              )}
            >
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </Link>

          <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
            {car.new && (
              <Badge className="bg-green-500/90 hover:bg-green-500 text-white border-0 shadow-sm backdrop-blur-[2px]">
                New
              </Badge>
            )}
            {car.crash && (
              <Badge variant="destructive" className="shadow-sm opacity-90 backdrop-blur-[2px]">
                Crashed
              </Badge>
            )}
            {car.trade_in && car.trade_in > 1 && (
              <Badge variant="secondary" className="bg-blue-600/90 hover:bg-blue-600 text-white border-0 shadow-sm backdrop-blur-[2px]">
                Trade-in
              </Badge>
            )}
          </div>

          <div className="absolute top-3 right-3 z-10 flex items-start gap-2 pointer-events-none">
            {!car.my_car && !isList && (
              <div className="flex gap-2">
                <button
                  onClick={handleShareClick}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl bg-black/35 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-black/55',
                    'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                  )}
                  aria-label="Share"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLike}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl bg-black/35 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-black/55',
                    isHeartFilled
                      ? 'opacity-100 bg-black/65 pointer-events-auto'
                      : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                  )}
                  aria-label="Favorite"
                >
                  <Heart className={cn('h-4 w-4', isHeartFilled && 'fill-current')} />
                </button>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
            {cityName && (
               <Badge variant="secondary" className="bg-black/50 hover:bg-black/60 text-white backdrop-blur-md border-0 h-9 px-3 shadow-sm pointer-events-none">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                  {cityName}
               </Badge>
            )}
          </div>
        </div>

        <div
          className={cn(
            isList
              ? 'flex flex-col flex-1 p-3 md:p-4 space-y-2.5 md:space-y-4'
              : 'p-3 space-y-3 md:p-4 md:space-y-4'
          )}
        >
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    to={`/cars/${car.id}`}
                    state={{ from: location }}
                    className="group-hover:text-primary transition-colors min-w-0"
                  >
                    <h3
                      className={cn(
                        'font-bold leading-tight line-clamp-1',
                        isList ? 'text-base md:text-lg' : 'text-lg'
                      )}
                    >
                      {brandName} {modelName}
                    </h3>
                  </Link>
                  {car.year && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {car.year}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    'font-bold text-primary mt-1',
                    isList ? 'text-lg md:text-xl' : 'text-xl'
                  )}
                >
                  {formatPrice(car.price)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {car.my_car && showActions && (
                  <div className="-mr-1 -mt-1 flex gap-1">
                    {onDeactivate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeactivate()
                        }}
                        disabled={disableDeactivate}
                        title="Deactivate"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {onReactivate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onReactivate()
                        }}
                        disabled={disableReactivate}
                        title="Activate"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
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

                {!car.my_car && isList && (
                  <>
                    <button
                      onClick={handleShareClick}
                      className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                      aria-label="Share"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleLike}
                      className={cn(
                        'p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors',
                        isHeartFilled && 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      )}
                      aria-label="Favorite"
                    >
                      <Heart className={cn('h-4 w-4', isHeartFilled && 'fill-current')} />
                    </button>
                  </>
                )}

                {isList && (
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground shadow-sm transition-all hover:bg-primary hover:text-primary-foreground"
                    variant="secondary"
                    asChild
                  >
                    <Link to={`/cars/${car.id}`} aria-label="View details">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {specs.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {specs.map((spec, index) => (
                <span key={`${spec}-${index}`} className="truncate">
                  {spec}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              {car.odometer !== undefined && (
                <div className="inline-flex items-center gap-1.5" title="Mileage">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>{formatOdometer(car.odometer).replace(' km', '')}</span>
                </div>
              )}
              {car.created_at && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <div className="inline-flex items-center gap-1.5" title="Date listed">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(car.created_at)}</span>
                  </div>
                </>
              )}
              {typeof car.view_count === 'number' && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <div className="inline-flex items-center gap-1.5" title="Views">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{car.view_count}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent className="sm:max-w-lg" hideCloseOnMobile>
        <DialogHeader>
          <DialogTitle className="text-left text-2xl font-bold">
            Поделиться объявлением
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center mt-2">
          <div className="relative flex-1">
            <label htmlFor="link" className="sr-only">
              Link
            </label>
            <Input
              id="link"
              defaultValue={shareUrl}
              readOnly
              className="h-12 rounded-r-none bg-muted/50 border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="px-4 h-12 rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={copyLink}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
        <div className="mt-6">
          <p className="text-xs text-muted-foreground uppercase mb-3 text-left tracking-wider font-medium">
            ОТПРАВИТЬ ДРУЗЬЯМ И ЗНАКОМЫМ
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              onClick={() => openShare(telegramUrl)}
            >
              <Send className="h-5 w-5" />
              <span className="text-sm font-medium">Telegram</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex items-center justify-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
              onClick={() => openShare(whatsappUrl)}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">WhatsApp</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    </>
  )
}
