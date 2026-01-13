import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCarById } from '@/api/cars'
import { getPublicProfile } from '@/api/profile'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/api/client'
import { getBrands, getBodyTypes, getColors } from '@/api/references'
import type { Brand, BodyType, Color } from '@/types'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  CircleDot,
  Car,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  Layers,
  Repeat,
  CheckCircle2
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'

// Helper to get name from object or string
const getName = (value: { name: string } | string | null | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.name
}

export function CarDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPhone, setShowPhone] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const { isLiked, toggleLike } = useFavorites()
  const isSaved = isLiked(Number(id))

  const {
    data: car,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['car', id],
    queryFn: () => getCarById(Number(id)),
    enabled: !!id,
  })

  const ownerId = (car?.owner as unknown as { id: number })?.id

  const { data: ownerProfile } = useQuery({
    queryKey: ['public-profile', ownerId],
    queryFn: () => getPublicProfile(ownerId),
    enabled: !!ownerId
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const { data: bodyTypes } = useQuery({
    queryKey: ['bodyTypes'],
    queryFn: getBodyTypes,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: getColors,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-destructive text-lg mb-4">Failed to load car details.</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to catalog
          </Link>
        </Button>
      </div>
    )
  }

  const images = car.images?.length
    ? car.images.map((img) => getImageUrl(img, 'l'))
    : [PLACEHOLDER_IMAGE]

  // Handle both odometer and mileage from API
  const mileage = (car as unknown as Record<string, unknown>).mileage as number | undefined || car.odometer || 0

  // Get string values from API response
  const brandName = getName((car as unknown as Record<string, unknown>).brand as string)
  const modelName = getName((car as unknown as Record<string, unknown>).model as string)
  const cityName = getName((car as unknown as Record<string, unknown>).city as string)
  const regionName = getName((car as unknown as Record<string, unknown>).region as string)
  const transmissionName = getName((car as unknown as Record<string, unknown>).transmission as string)
  const fuelTypeName = getName((car as unknown as Record<string, unknown>).fuel_type as string)
  const drivetrainName = getName((car as unknown as Record<string, unknown>).drivetrain as string)
  const bodyTypeName = getName((car as unknown as Record<string, unknown>).body_type as string)
  const generationName = getName((car as unknown as Record<string, unknown>).generation as string)
  const modificationName = getName((car as unknown as Record<string, unknown>).modification as string)
  const engineName = getName((car as unknown as Record<string, unknown>).engine as string)
  const colorName = getName((car as unknown as Record<string, unknown>).color as string)

  // Helper to safely get ID
  const getId = (value: unknown) => (value as { id?: number })?.id

  // Get images from related objects or fallback to references
  const brandData = car.brand as unknown as Brand
  let brandLogo = brandData?.logo ? getImageUrl(brandData.logo) : undefined
  if (!brandLogo && brands) {
    const brandId = getId(car.brand)
    const foundBrand = brandId 
      ? brands.find(b => b.id === brandId)
      : brands.find(b => b.name === brandName)
    if (foundBrand?.logo) brandLogo = getImageUrl(foundBrand.logo)
  }

  const bodyTypeData = car.body_type as unknown as BodyType
  let bodyTypeImage = bodyTypeData?.image ? getImageUrl(bodyTypeData.image) : undefined
  if (!bodyTypeImage && bodyTypes) {
    const bodyTypeId = getId(car.body_type)
    const foundBodyType = bodyTypeId
      ? bodyTypes.find(b => b.id === bodyTypeId)
      : bodyTypes.find(b => b.name === bodyTypeName)
    if (foundBodyType?.image) bodyTypeImage = getImageUrl(foundBodyType.image)
  }
  
  const colorData = car.color as unknown as Color
  let colorImage = colorData?.image ? getImageUrl(colorData.image) : undefined
  if (!colorImage && colors) {
    const colorId = getId(car.color)
    const foundColor = colorId
      ? colors.find(c => c.id === colorId)
      : colors.find(c => c.name === colorName)
    if (foundColor?.image) colorImage = getImageUrl(foundColor.image)
  }

  // Owner can have username instead of name
  const ownerData = car.owner as unknown as Record<string, unknown> | null
  // Prefer profile data if available
  const ownerName = ownerProfile?.company_name 
    || ownerProfile?.username 
    || ownerProfile?.name 
    || ownerData?.username as string 
    || ownerData?.name as string 
    || 'Seller'
    
  const ownerRoleId = ownerProfile?.role_id ? Number(ownerProfile.role_id) : (ownerData?.role_id ? Number(ownerData.role_id) : 0)

  // Determine seller type from role_id or type field
  const getSellerType = () => {
    if (ownerProfile?.company_type) return ownerProfile.company_type
    
    if (!ownerData && !ownerProfile) return ''
    
    const roleId = ownerRoleId
    const sellerType = ownerData?.type as string || ownerData?.seller_type as string
    
    if (sellerType) return sellerType
    // Map role_id to seller type if available
    if (roleId === 1) return 'Private seller'
    if (roleId === 2) return 'Dealer'
    if (roleId === 3) return 'Logist'
    if (roleId === 4) return 'Broker'
    if (roleId === 5) return 'Tuning service'
    return ''
  }
  const sellerType = getSellerType()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)

  const formatMileage = (km: number) =>
    new Intl.NumberFormat('en-US').format(km) + ' km'

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const shareTitle = `${brandName || ''} ${modelName || ''}`.trim()
  const shareText = `${shareTitle}${car.year ? ` ${car.year}` : ''}`
  const shareUrl = `${window.location.origin}/cars/${id}`
  const tryNativeShare = async () => {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareTitle || 'Car', text: shareText, url: shareUrl })
      } catch {}
    }
  }
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {}
  }
  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(shareTitle || 'Car')}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const getTradeInLabel = (value: number) => {
    switch (value) {
      case 2: return 'Equal value'
      case 3: return 'More expensive'
      case 4: return 'Cheaper'
      case 5: return 'Not a car'
      default: return 'No exchange'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10] bg-muted">
              <img
                src={images[currentImageIndex]}
                alt={`${brandName || ''} ${modelName || ''}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
                    img.src = PLACEHOLDER_IMAGE
                  }
                }}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {car.new && <Badge variant="success">New</Badge>}
                {car.crash && <Badge variant="destructive">Crash</Badge>}
                {car.trade_in && car.trade_in > 1 && (
                  <Badge variant="secondary" className="bg-blue-600/90 hover:bg-blue-600 text-white border-0 shadow-sm backdrop-blur-[2px]">
                    Trade-in: {getTradeInLabel(car.trade_in)}
                  </Badge>
                )}
              </div>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1 rounded-lg text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      'shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-colors',
                      idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const imgEl = e.target as HTMLImageElement
                        if (!imgEl.src.endsWith(PLACEHOLDER_IMAGE)) {
                          imgEl.src = PLACEHOLDER_IMAGE
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Specifications */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{car.year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="font-medium">{formatMileage(mileage)}</p>
                  </div>
                </div>

                {transmissionName && (
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Transmission</p>
                      <p className="font-medium">{transmissionName}</p>
                    </div>
                  </div>
                )}

                {fuelTypeName && (
                  <div className="flex items-center gap-3">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel</p>
                      <p className="font-medium">{fuelTypeName}</p>
                    </div>
                  </div>
                )}

                {drivetrainName && (
                  <div className="flex items-center gap-3">
                    <CircleDot className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Drivetrain</p>
                      <p className="font-medium">{drivetrainName}</p>
                    </div>
                  </div>
                )}

                {bodyTypeName && (
                  <div className="flex items-center gap-3">
                    {bodyTypeImage ? (
                      <img 
                        src={bodyTypeImage} 
                        alt={bodyTypeName} 
                        className="h-6 w-6 object-contain opacity-70" 
                      />
                    ) : (
                      <Car className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Body</p>
                      <p className="font-medium">{bodyTypeName}</p>
                    </div>
                  </div>
                )}

                {generationName && (
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Generation</p>
                      <p className="font-medium">{generationName}</p>
                    </div>
                  </div>
                )}

                {modificationName && (
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Modification</p>
                      <p className="font-medium">{modificationName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                     <svg 
                       xmlns="http://www.w3.org/2000/svg" 
                       width="20" 
                       height="20" 
                       viewBox="0 0 24 24" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2" 
                       strokeLinecap="round" 
                       strokeLinejoin="round" 
                       className="text-muted-foreground"
                     >
                       <circle cx="12" cy="12" r="10"/>
                       <path d="M12 2v20"/>
                       <path d="M2 12h20"/>
                     </svg>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Steering Wheel</p>
                    <p className="font-medium">{car.wheel ? 'Left' : 'Right'}</p>
                  </div>
                </div>

                {engineName && (
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Engine</p>
                      <p className="font-medium">{engineName}</p>
                    </div>
                  </div>
                )}

                {colorName && (
                  <div className="flex items-center gap-3">
                    {colorImage ? (
                      <img 
                        src={colorImage} 
                        alt={colorName} 
                        className="w-6 h-6 rounded-full border object-cover shadow-sm" 
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border bg-muted" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p className="font-medium">{colorName}</p>
                    </div>
                  </div>
                )}

                {car.owners !== undefined && car.owners !== null && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-muted-foreground font-bold">
                      #
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Owners</p>
                      <p className="font-medium">{car.owners}</p>
                    </div>
                  </div>
                )}

                {car.trade_in !== undefined && car.trade_in !== null && (
                  <div className="flex items-center gap-3">
                    <Repeat className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Trade-in</p>
                      <p className="font-medium">
                        {getTradeInLabel(car.trade_in)}
                      </p>
                    </div>
                  </div>
                )}

                {car.vin_code && (
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-muted-foreground text-xs font-bold">
                      VIN
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">VIN Code</p>
                      <p className="font-medium font-mono">{car.vin_code}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {car.description && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{car.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Price & Contact */}
        <div className="space-y-6">
          {/* Price card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                {brandLogo && (
                  <img 
                    src={brandLogo} 
                    alt={brandName} 
                    className="w-12 h-12 object-contain" 
                  />
                )}
                <h1 className="text-2xl font-bold">
                  {brandName} {modelName}
                </h1>
              </div>

              <p className="text-3xl font-bold text-primary mb-6">
                {formatPrice(car.price)}
              </p>

              {/* Action buttons */}
              <div className="space-y-3">
                {car.phone_numbers && car.phone_numbers.length > 0 && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowPhone(!showPhone)}
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      {showPhone ? 'Hide contacts' : 'Show contacts'}
                    </Button>
                    {showPhone && (
                      <div className="bg-muted p-4 rounded-lg text-center space-y-2 border animate-in fade-in slide-in-from-top-2">
                        {car.phone_numbers.map((phone, i) => (
                          <a
                            key={i}
                            href={`tel:${phone}`}
                            className="block text-lg font-semibold hover:text-primary transition-colors"
                          >
                            {phone}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link to={`/chat/${car.id}`}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send message
                  </Link>
                </Button>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className={cn("flex-1", isSaved && "text-red-500 hover:text-red-600 border-red-200 bg-red-50 hover:bg-red-100")}
                    onClick={() => toggleLike(Number(id), car)}
                  >
                    <Heart className={cn("h-5 w-5 mr-2", isSaved && "fill-current")} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="h-5 w-5 mr-2" />
                        Share
                      </Button>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {cityName && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Location</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {cityName}
                    {regionName && `, ${regionName}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seller info */}
          {ownerData && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Seller</h3>
                <Link to={`/user/${ownerData.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {ownerData.avatar && !avatarError ? (
                    <img
                      src={getImageUrl(ownerData.avatar as string)}
                      alt={ownerName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {ownerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium">{ownerName}</p>
                      {ownerRoleId >= 2 && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {sellerType && (
                      <Badge 
                        variant={ownerRoleId >= 2 ? "default" : "secondary"}
                        className="w-fit"
                      >
                        {sellerType}
                      </Badge>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {car.view_count || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {car.created_at && formatDate(car.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
