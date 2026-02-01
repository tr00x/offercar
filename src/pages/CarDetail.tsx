import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCarById } from '@/api/cars'
import { getPublicProfile } from '@/api/profile'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/api/client'
import { getBrands, getBodyTypes, getColors, getModelsByBrand, getTransmissions, getDrivetrains, getEngines, getFuelTypes } from '@/api/references'
import { getSocialIcon, getSocialLabel, getSocialColorClass } from '@/lib/social-icons'
import type { Brand, BodyType, Color } from '@/types'
import { CarDetailSkeleton } from '@/components/cars/CarDetailSkeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Heart,
  Upload,
  Phone,
  MessageCircle,
  MapPin,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  User,
  Copy,
  Check,
  Send,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Car,
  Palette,
  Users,
  RefreshCcw,
  FileText,
  Layers,
  Maximize2
} from 'lucide-react'
import { useEffect, useState, useMemo, useRef } from 'react'
import type React from 'react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/hooks/useFavorites'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

// Helper to get name from object or string
const getName = (value: { name: string } | string | null | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.name
}

// Helper to safely get ID
const getId = (value: unknown) => (value as { id?: number })?.id

export function CarDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showHeaderPhone, setShowHeaderPhone] = useState(false)
  const [showCardPhone, setShowCardPhone] = useState(false)
  const [showMobilePhone, setShowMobilePhone] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const { isLiked, toggleLike } = useFavorites()
  const isSaved = isLiked(Number(id))
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [showFullSpecs, setShowFullSpecs] = useState(false)
  const [showGalleryDialog, setShowGalleryDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [vinCopied, setVinCopied] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [loadedImageIndex, setLoadedImageIndex] = useState<number | null>(null)

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

  const { data: transmissions } = useQuery({
    queryKey: ['transmissions'],
    queryFn: getTransmissions,
    staleTime: Infinity,
  })

  const { data: drivetrains } = useQuery({
    queryKey: ['drivetrains'],
    queryFn: getDrivetrains,
    staleTime: Infinity,
  })

  const { data: fuelTypes } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: getFuelTypes,
    staleTime: Infinity,
  })

  const { data: engines } = useQuery({
    queryKey: ['engines'],
    queryFn: getEngines,
    staleTime: Infinity,
  })

  // Calculate brandId early to fetch models
  const carData = car as unknown as Record<string, unknown> | undefined
  const rawBrandId = carData ? getId(carData.brand) : undefined
  const brandNameRaw = carData ? getName(carData.brand as string) : undefined
  
  const brandId = useMemo(() => {
    if (!carData) return undefined
    const found = rawBrandId 
      ? brands?.find(b => b.id === rawBrandId)
      : brands?.find(b => b.name === brandNameRaw)
    const fallbackBrandId = 'brand_id' in (carData || {}) ? Number((carData as { brand_id?: number }).brand_id) : undefined
    return found?.id || rawBrandId || fallbackBrandId
  }, [carData, brands, rawBrandId, brandNameRaw])

  const { data: models } = useQuery({
    queryKey: ['models', brandId],
    queryFn: () => getModelsByBrand(brandId!),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const contactList = useMemo(() => {
    const list: { type: 'phone' | 'social', label: string, value: string, icon: any, href: string, colorClass?: string }[] = []
    const uniquePhones = new Set<string>()

    // Car phones
    if (car?.phone_numbers) {
      car.phone_numbers.forEach(p => {
        const clean = p.replace(/\s/g, '')
        if (!uniquePhones.has(clean)) {
          uniquePhones.add(clean)
          list.push({
            type: 'phone',
            label: p,
            value: p,
            icon: Phone,
            href: `tel:${p}`
          })
        }
      })
    }

    // Profile phone
    if (ownerProfile?.phone) {
      const clean = ownerProfile.phone.replace(/\s/g, '')
      if (!uniquePhones.has(clean)) {
        uniquePhones.add(clean)
        list.push({
          type: 'phone',
          label: ownerProfile.phone,
          value: ownerProfile.phone,
          icon: Phone,
          href: `tel:${ownerProfile.phone}`
        })
      }
    }

    // Socials
    if (ownerProfile?.contacts) {
      Object.entries(ownerProfile.contacts).forEach(([network, value]) => {
        if (!value) return
        
        let href = value
        if (!href.startsWith('http') && !href.startsWith('//')) {
             if (network === 'instagram') href = `https://instagram.com/${value}`
             else if (network === 'telegram') href = `https://t.me/${value}`
             else if (network === 'tiktok') href = `https://tiktok.com/@${value}`
             else if (network === 'whatsapp') href = `https://wa.me/${value.replace(/\+/g, '')}`
             else href = `https://${value}`
        }

        list.push({
          type: 'social',
          label: getSocialLabel(network), 
          value: value,
          icon: getSocialIcon(network),
          href: href,
          colorClass: getSocialColorClass(network)
        })
      })
    }

    return list
  }, [car?.phone_numbers, ownerProfile])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const activationOffset = 1
      setShowStickyHeader(scrollY > activationOffset)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const images = car?.images?.length
    ? car.images.map((img) => getImageUrl(img, 'l'))
    : [PLACEHOLDER_IMAGE]

  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  useEffect(() => {
    if (images.length <= 1) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      } else if (event.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [images.length])

  if (isLoading) {
    return <CarDetailSkeleton />
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

  // Handle both odometer and mileage from API
  const mileage = (car as unknown as Record<string, unknown>).mileage as number | undefined || car.odometer || 0

  // Get string values from API response
  const carRecord = car as unknown as Record<string, unknown>
  const modRecord = carRecord.modification as unknown as Record<string, unknown> | undefined

  const brandName = getName(carRecord.brand as string)
  const modelName = getName(carRecord.model as string)
  const cityName = getName(carRecord.city as string)
  const regionName = getName(carRecord.region as string)
  
  // Helper to resolve ID or object to name
  const resolveName = (
    val: unknown,
    list?: { id: number; name: string }[]
  ): string | undefined => {
    if (!val) return undefined
    if (typeof val === 'string') return val
    if (typeof val === 'number') {
      return list?.find(i => i.id === val)?.name
    }
    const obj = val as { name?: string; value?: string; id?: number }
    return obj.name || obj.value || (obj.id ? list?.find(i => i.id === obj.id)?.name : undefined)
  }
  
  // Try to get specs from root, fallback to modification
  const transmissionName = resolveName(carRecord.transmission, transmissions) || resolveName(modRecord?.transmission, transmissions)
  const fuelTypeName = resolveName(carRecord.fuel_type, fuelTypes) || resolveName(modRecord?.fuel_type, fuelTypes)
  const drivetrainName = resolveName(carRecord.drivetrain, drivetrains) || resolveName(modRecord?.drivetrain, drivetrains)
  const engineName = resolveName(carRecord.engine, engines) || resolveName(modRecord?.engine, engines)
  
  const bodyTypeName = getName(carRecord.body_type as string)
  const generationName = getName(carRecord.generation as string)
  const modificationName = getName(carRecord.modification as string)
  const colorName = getName(carRecord.color as string)


  // Get images from related objects or fallback to references
  const brandData = car.brand as unknown as Brand
  let brandLogo = brandData?.logo ? getImageUrl(brandData.logo) : undefined
  
  // Find brand ID reliably
  // Already calculated above as 'brandId'
  const foundBrand = brands?.find(b => b.id === brandId)
  
  if (!brandLogo && foundBrand?.logo) {
    brandLogo = getImageUrl(foundBrand.logo)
  }

  // Try to find model ID
  const rawModelId = getId(car.model)
  // We don't have all models loaded, so we rely on what's in the car object or fetched models
  let modelId = rawModelId || (car as { model_id?: number }).model_id
  
  if (!modelId && models && modelName) {
    const foundModel = models.find(m => m.name === modelName)
    if (foundModel) modelId = foundModel.id
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
    // Simplify logic as requested: only Dealer or Private seller (From owner)
    // We ignore specific company types or "Company" strings
    
    if (ownerRoleId >= 2) return 'Dealer'
    if (ownerRoleId === 1) return 'Private seller'
    
    // Fallback if role_id is not set but we have data
    if (ownerData || ownerProfile) {
        // If it was detected as company/business before, assume Dealer
        if (ownerProfile?.company_type || (ownerData?.type && ownerData.type !== 'Private')) {
            return 'Dealer'
        }
    }
    
    return 'Private seller'
  }
  const sellerType = getSellerType()
  const sellerBadgeLabel = ownerRoleId >= 2 ? 'Dealer' : 'From owner'
  const sellerCarsPath = ownerId ? `/cars?user_id=${ownerId}` : '/cars'

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)

  const formatMileage = (km: number) =>
    new Intl.NumberFormat('en-US').format(km) + ' km'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    
    // Reset hours to compare dates only
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const diffTime = d2.getTime() - d1.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`
    if (diffDays === 7) return '1 week ago'
    if (diffDays === 30 || diffDays === 31) return '1 month ago'

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const shareTitle = `${brandName || ''} ${modelName || ''}`.trim()
  const shareText = `${shareTitle}${car.year ? ` ${car.year}` : ''}`
  const shareUrl = `${window.location.origin}/cars/${id}`
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }
  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return
    const deltaX = touchStartX.current - touchEndX.current
    const threshold = 40
    if (Math.abs(deltaX) > threshold && images.length > 1) {
      if (deltaX > 0) {
        nextImage()
      } else {
        prevImage()
      }
    }
    touchStartX.current = null
    touchEndX.current = null
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

  const headerSubtitleParts: string[] = []
  if (bodyTypeName) headerSubtitleParts.push(bodyTypeName)
  if (engineName) headerSubtitleParts.push(engineName)
  else if (fuelTypeName) headerSubtitleParts.push(fuelTypeName)
  if (transmissionName) headerSubtitleParts.push(transmissionName)
  const headerSubtitle = headerSubtitleParts.join(' • ')

  const headerTitle = `${brandName || ''} ${modelName || ''} ${car.year || ''}`.trim()

  const keySpecs: { label: string; value?: string }[] = [
    { label: 'Mileage', value: mileage ? formatMileage(mileage) : undefined },
    { label: 'Engine', value: engineName },
    { label: 'Transmission', value: transmissionName },
    { label: 'Drivetrain', value: drivetrainName },
    { label: 'Color', value: colorName },
    { label: 'Owners', value: car.owners != null ? String(car.owners) : undefined },
  ].filter((item) => item.value)

  const fullSpecs = [
    { icon: Calendar, label: 'Year', value: car.year },
    { icon: Gauge, label: 'Mileage', value: mileage ? formatMileage(mileage) : undefined },
    { icon: Settings, label: 'Engine', value: engineName },
    { icon: Fuel, label: 'Fuel', value: fuelTypeName },
    { icon: Settings, label: 'Transmission', value: transmissionName },
    { icon: Layers, label: 'Drivetrain', value: drivetrainName },
    { icon: Car, label: 'Body', value: bodyTypeName, image: bodyTypeImage },
    { icon: Layers, label: 'Generation', value: generationName },
    { icon: Layers, label: 'Modification', value: modificationName },
    { icon: Settings, label: 'Steering Wheel', value: car.wheel ? 'Left' : 'Right' },
    { icon: Palette, label: 'Color', value: colorName, image: colorImage },
    { icon: Users, label: 'Owners', value: car.owners != null ? String(car.owners) : undefined },
    { icon: RefreshCcw, label: 'Trade-in', value: car.trade_in != null ? getTradeInLabel(car.trade_in) : undefined },
    { icon: FileText, label: 'VIN Code', value: car.vin_code, className: 'font-mono' },
  ].filter((item) => item.value)

  return (
    <>
      <div>
      {showStickyHeader && (
        <div className="hidden md:block">
          <div className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-b">
            <div className="container mx-auto px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="inline-flex"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={images[0]}
                    alt={headerTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {headerTitle}
                  </p>
                  {headerSubtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {headerSubtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 relative">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Price
                  </span>
                  <span className="text-lg font-bold text-primary leading-tight whitespace-nowrap">
                    {formatPrice(car.price)}
                  </span>
                </div>
                {/* Header Call button removed as requested */}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm h-[68px]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="text-foreground hover:text-primary transition-colors -ml-1"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm text-muted-foreground font-medium">{headerTitle}</h1>
            <p className="text-lg font-bold text-foreground leading-tight">
              {formatPrice(car.price)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleLike(Number(id), car)}
            className="text-foreground hover:text-red-500 transition-colors"
          >
            <Heart className={cn("w-6 h-6", isSaved && "fill-red-500 text-red-500")} />
          </button>
          <button
            onClick={() => setShowShareDialog(true)}
            className="text-foreground hover:text-primary transition-colors"
          >
            <Upload className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 pt-[80px] md:pt-6">
        <div className="overflow-x-auto whitespace-nowrap pb-2 -mx-4 px-4 md:mx-0 md:px-0 mb-3 md:mb-6 scrollbar-hide">
          <Breadcrumbs 
            items={[
              { label: 'Главная', href: '/' },
              ...(brandName && brandId ? [{ label: brandName, href: `/cars?brand_id=${brandId}` }] : []),
              ...(brandName && modelName && brandId && modelId ? [{ label: modelName, href: `/cars?brand_id=${brandId}&model_id=${modelId}` }] : []),
              { label: headerTitle, active: true }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Images & Details */}
          {/* Image gallery */}
          <Card className="order-1 lg:col-span-2 overflow-hidden border-0 bg-transparent shadow-none">
            <div className="p-1.5 sm:p-2">
              <div className="flex gap-1 sm:gap-1.5 md:h-[360px] lg:h-[380px] xl:h-[420px]">
                <div className="relative flex-1 rounded-xl overflow-hidden bg-muted">
                  <div
                    className="aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:h-full"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={images[currentImageIndex]}
                      alt={`${brandName || ''} ${modelName || ''}`}
                      className={cn(
                        "w-full h-full object-cover cursor-default transition-opacity transition-transform duration-300",
                        loadedImageIndex === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      )}
                      onLoad={() => setLoadedImageIndex(currentImageIndex)}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
                          img.src = PLACEHOLDER_IMAGE
                        }
                      }}
                    />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {car.new && <Badge className="rounded-md bg-green-500/80 backdrop-blur-md text-white border-0 shadow-sm hover:bg-green-500/90">New</Badge>}
                    {car.crash && <Badge className="rounded-md bg-red-500/80 backdrop-blur-md text-white border-0 shadow-sm hover:bg-red-500/90">Crashed</Badge>}
                    {car.trade_in && car.trade_in > 1 && (
                      <Badge className="rounded-md bg-blue-500/80 backdrop-blur-md text-white border-0 shadow-sm hover:bg-blue-500/90">
                        Trade-in: {getTradeInLabel(car.trade_in)}
                      </Badge>
                    )}
                  </div>

                  {/* Save / Share controls */}
                  <div className="absolute top-3 right-3 hidden md:flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleLike(Number(id), car)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl bg-black/35 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-black/55",
                        isSaved && "bg-black/65"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShareDialog(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/35 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-black/55"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 text-white backdrop-blur-md border border-white/15 transition-colors hover:bg-black/55"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 hidden md:flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 text-white backdrop-blur-md border border-white/15 transition-colors hover:bg-black/55"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 bg-black/55 text-white px-3 py-1 rounded-lg text-xs backdrop-blur-md">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGalleryDialog(true)}
                    className="absolute left-3 bottom-3 inline-flex items-center justify-center rounded-lg bg-black/55 h-9 w-9 text-xs text-white backdrop-blur-md border border-white/15 shadow-sm hover:bg-black/75 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

                {images.length > 1 && (
                  <div className="hidden md:flex flex-col gap-1 w-12 lg:w-14 xl:w-16 h-full overflow-y-auto pl-0.5">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          'relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors',
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
              </div>

              {car.description && (
                <div className="mt-4">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <div className="relative">
                    <p className={cn("text-muted-foreground whitespace-pre-wrap", !isDescriptionExpanded && "line-clamp-4")}>
                      {car.description}
                    </p>
                    {(car.description.length > 150 || car.description.split('\n').length > 4) && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="mt-2 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {isDescriptionExpanded ? 'Hide' : 'Read more'}
                        <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
          {/* Price + Seller column */}
          <div className="order-2 lg:col-start-3 lg:row-start-1 flex flex-col gap-4 h-fit">
            <Card className="rounded-xl">
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

                <p className="text-3xl font-bold text-primary">
                  {formatPrice(car.price)}
                </p>

                {sellerBadgeLabel && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <User className="h-4 w-4" />
                      <span>{sellerBadgeLabel}</span>
                    </span>
                  </div>
                )}

                {keySpecs.length > 0 && (
                  <div className="mt-4 mb-4 rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Key specs
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-colors"
                        onClick={() => setShowFullSpecs(true)}
                      >
                        Full spec
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {keySpecs.slice(0, 4).map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <span className="text-xs font-medium text-right text-foreground">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3 hidden md:block">
                  {contactList.length > 0 && (
                    <div className="relative">
                      <Button
                        className="w-full rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                        size="lg"
                        onClick={() => setShowCardPhone((prev) => !prev)}
                      >
                        <div className="flex w-full items-center justify-center gap-3">
                          <Phone className="h-4 w-4" />
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-sm font-semibold">
                              Call now
                            </span>
                            <span className="text-[11px] text-primary-foreground/80">
                              numbers
                            </span>
                          </div>
                        </div>
                      </Button>
                      {showCardPhone && (
                        <div className="absolute left-0 right-0 mt-1 rounded-b-lg rounded-t-none bg-background shadow-lg border overflow-hidden z-10 max-h-[300px] overflow-y-auto">
                          {contactList.map((contact, i) => (
                            <a
                              key={i}
                              href={contact.href}
                              target={contact.type === 'social' ? '_blank' : undefined}
                              rel={contact.type === 'social' ? 'noopener noreferrer' : undefined}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                            >
                              <contact.icon className={cn("h-4 w-4", contact.colorClass || "text-muted-foreground")} />
                              <span className="font-medium">{contact.label}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Button variant="outline" className="w-full" size="lg" asChild>
                    <Link to={`/chat/${ownerId}?carId=${car.id}`}>
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Send message
                    </Link>
                  </Button>
                </div>

                {(cityName || regionName || car.view_count || car.created_at) && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-t pt-4">
                    {cityName && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {cityName}
                          {regionName && `, ${regionName}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{car.view_count || 0} views</span>
                    </div>
                    {car.created_at && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(car.created_at)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {ownerData && (
            <Card className="overflow-hidden h-fit rounded-xl">
                <CardContent className="p-0">
                  <Link to={sellerCarsPath} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    {ownerData.avatar && !avatarError && ownerRoleId >= 2 ? (
                      <img
                        src={getImageUrl(ownerData.avatar as string)}
                        alt={ownerName}
                        className="w-11 h-11 rounded-full object-cover border border-border/50"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-lg font-semibold text-primary">
                          {ownerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Seller</p>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{ownerName}</h3>
                        {ownerRoleId >= 2 && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sellerType && (
                          <Badge 
                            variant={ownerRoleId >= 2 ? "default" : "secondary"}
                            className="rounded-md px-2 py-0.5 h-auto text-[10px] font-medium"
                          >
                            {sellerType}
                          </Badge>
                        )}
                        {ownerProfile?.address && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{ownerProfile.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-lg border-t z-40 md:hidden grid grid-cols-2 gap-3 safe-area-pb">
        {contactList.length > 0 ? (
          <div className="relative">
            <Button
              className="w-full rounded-lg bg-primary text-primary-foreground shadow-sm h-12"
              onClick={() => setShowMobilePhone((prev) => !prev)}
            >
              <div className="flex w-full items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-semibold">Call</span>
              </div>
            </Button>
            {showMobilePhone && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                {contactList.map((contact, i) => (
                  <a
                    key={i}
                    href={contact.href}
                    target={contact.type === 'social' ? '_blank' : undefined}
                    rel={contact.type === 'social' ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted border-b last:border-0 text-sm font-medium"
                  >
                    <contact.icon className={cn("h-4 w-4", contact.colorClass || "text-muted-foreground")} />
                    {contact.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        <Button variant="outline" className="w-full rounded-lg h-12" asChild>
          <Link to={`/chat/${car.id}`}>
            <div className="flex w-full items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-semibold">Message</span>
            </div>
          </Link>
        </Button>
      </div>
    </div>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-lg" hideCloseOnMobile>
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">Поделиться объявлением</DialogTitle>
          </DialogHeader>
          <div className="flex items-center mt-2">
             <div className="relative flex-1">
               <label htmlFor="link" className="sr-only">Link</label>
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
               onClick={handleCopy}
             >
               {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
             </Button>
          </div>
          <div className="mt-6">
             <p className="text-xs text-muted-foreground uppercase mb-3 text-left tracking-wider font-medium">ОТПРАВИТЬ ДРУЗЬЯМ И ЗНАКОМЫМ</p>
             <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => openShare(telegramUrl)}>
                  <Send className="h-5 w-5" />
                  <span className="text-sm font-medium">Telegram</span>
                </Button>
                <Button variant="outline" className="h-12 flex items-center justify-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200" onClick={() => openShare(whatsappUrl)}>
                   <MessageCircle className="h-5 w-5" />
                   <span className="text-sm font-medium">WhatsApp</span>
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
        <DialogContent fullScreen className="flex items-center justify-center">
          <div
            className="relative flex h-full w-full items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute inset-y-0 left-0 w-1/3 sm:hidden"
                />
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute inset-y-0 right-0 w-1/3 sm:hidden"
                />
              </>
            )}
            <img
              src={images[currentImageIndex]}
              alt={`${brandName || ''} ${modelName || ''}`}
              className={cn(
                "max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl transition-opacity transition-transform duration-300",
                loadedImageIndex === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
              onLoad={() => setLoadedImageIndex(currentImageIndex)}
              onError={(e) => {
                const img = e.target as HTMLImageElement
                if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
                  img.src = PLACEHOLDER_IMAGE
                }
              }}
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 px-3 py-2 bg-black/65 rounded-xl backdrop-blur-md">
                <div className="text-[11px] text-white">
                  {currentImageIndex + 1} / {images.length}
                </div>
                <div className="flex items-center gap-1 max-w-[80vw] overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0",
                        idx === currentImageIndex ? "border-primary" : "border-transparent"
                      )}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const thumbnail = e.target as HTMLImageElement
                          if (!thumbnail.src.endsWith(PLACEHOLDER_IMAGE)) {
                            thumbnail.src = PLACEHOLDER_IMAGE
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullSpecs} onOpenChange={setShowFullSpecs}>
        <DialogContent className="max-w-2xl p-0">
          <div className="max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide rounded-xl">
            <DialogHeader className="p-6 pb-2 sticky top-0 bg-card z-10 border-b border-border/40 backdrop-blur-sm">
              <DialogTitle className="text-lg font-semibold text-center">
                Full specification
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fullSpecs.map((spec) => {
                  const isBody = spec.label === 'Body'
                  const isVin = spec.label === 'VIN Code'

                  return (
                    <div
                      key={spec.label}
                      className={cn(
                        "flex flex-col gap-2 p-3 rounded-lg bg-muted/30 border border-border/50",
                        isVin && "col-span-2"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <spec.icon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{spec.label}</span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-2 border-t border-border/40 pt-2",
                          !isBody && !isVin && "justify-center"
                        )}
                      >
                        {spec.image && isBody && (
                          <img
                            src={spec.image}
                            alt={spec.value}
                            className="w-10 h-10 object-contain"
                          />
                        )}
                        {spec.image && !isBody && (
                          <div className="w-8 h-8 rounded-full border border-border bg-background p-1 shadow-sm shrink-0 flex items-center justify-center">
                            <img
                              src={spec.image}
                              alt={spec.value}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        {isVin ? (
                          <div className="flex items-center gap-2">
                            <p className={cn("font-semibold text-sm text-foreground", spec.className)}>{spec.value}</p>
                            {spec.value && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof spec.value === 'string') {
                                    navigator.clipboard.writeText(spec.value).then(() => {
                                      setVinCopied(true)
                                      setTimeout(() => setVinCopied(false), 1500)
                                    }).catch(() => {})
                                  }
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground hover:bg-background"
                              >
                                {vinCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p
                            className={cn(
                              "font-semibold text-sm text-foreground break-words",
                              spec.className,
                              !isBody && "text-center"
                            )}
                          >
                            {spec.value}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
