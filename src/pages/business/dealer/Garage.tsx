import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDealerCars, getDealerCarsOnSale, setDealerCarDontSell, setDealerCarOnSale, deleteDealerCar } from '@/api/dealer'
import { getLikedCars } from '@/api/cars'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Plus,
  Car,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Heart,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/api/client'
import { toast } from 'react-hot-toast'
import type { Car as CarType } from '@/types'

// Helper to get name from object or string
const getName = (value: { name: string } | string | undefined): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.name
}

type TabType = 'on_sale' | 'favorites' | 'drafts'

export function Garage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('on_sale')

  // Fetch drafts (status=2)
  const { data: draftsResponse, isLoading: draftsLoading } = useQuery({
    queryKey: ['dealer-cars-drafts'],
    queryFn: () => getDealerCars({ limit: 100 }),
  })

  // Fetch active cars (On Sale, status=3)
  const { data: activeCarsResponse, isLoading: activeLoading } = useQuery({
    queryKey: ['dealer-cars-active'],
    queryFn: () => getDealerCarsOnSale({ limit: 50 }),
  })

  // Fetch favorites
  const { data: favoritesResponse, isLoading: favoritesLoading } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => getLikedCars(),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id }: { id: number; car: CarType }) => setDealerCarDontSell(id),
    onMutate: async ({ car }) => {
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-active'] })
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-drafts'] })
      const prevActive = queryClient.getQueryData(['dealer-cars-active']) as { items: CarType[] } | undefined
      const prevDrafts = queryClient.getQueryData(['dealer-cars-drafts']) as { items: CarType[] } | undefined
      if (prevActive) {
        queryClient.setQueryData(['dealer-cars-active'], {
          ...prevActive,
          items: prevActive.items.filter(c => c.id !== car.id),
        })
      }
      if (prevDrafts) {
        queryClient.setQueryData(['dealer-cars-drafts'], {
          ...prevDrafts,
          items: [car, ...prevDrafts.items],
        })
      }
      return { prevActive, prevDrafts }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevActive) queryClient.setQueryData(['dealer-cars-active'], ctx.prevActive)
      if (ctx?.prevDrafts) queryClient.setQueryData(['dealer-cars-drafts'], ctx.prevDrafts)
      toast.error('Failed to deactivate listing')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })
      toast.success('Listing deactivated successfully')
    },
  })

  const relistMutation = useMutation({
    mutationFn: ({ id }: { id: number; car: CarType }) => setDealerCarOnSale(id),
    onMutate: async ({ car }) => {
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-active'] })
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-drafts'] })
      const prevActive = queryClient.getQueryData(['dealer-cars-active']) as { items: CarType[] } | undefined
      const prevDrafts = queryClient.getQueryData(['dealer-cars-drafts']) as { items: CarType[] } | undefined
      if (prevDrafts) {
        queryClient.setQueryData(['dealer-cars-drafts'], {
          ...prevDrafts,
          items: prevDrafts.items.filter(c => c.id !== car.id),
        })
      }
      if (prevActive) {
        queryClient.setQueryData(['dealer-cars-active'], {
          ...prevActive,
          items: [car, ...prevActive.items],
        })
      }
      return { prevActive, prevDrafts }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevActive) queryClient.setQueryData(['dealer-cars-active'], ctx.prevActive)
      if (ctx?.prevDrafts) queryClient.setQueryData(['dealer-cars-drafts'], ctx.prevDrafts)
      toast.error('Failed to relist car')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })
      toast.success('Car relisted successfully')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDealerCar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })
      toast.success('Car deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete car')
    }
  })

  const draftCars = draftsResponse?.items || []
  const activeCars = activeCarsResponse?.items || []
  const favorites = favoritesResponse?.items || []
  
  const displayedCars = activeTab === 'on_sale'
    ? activeCars
    : activeTab === 'favorites'
    ? favorites
    : draftCars

  const isLoading = activeTab === 'on_sale' 
    ? activeLoading 
    : activeTab === 'favorites' 
    ? favoritesLoading 
    : draftsLoading

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)

  const CarItem = ({ car }: { car: CarType }) => {
    const imageUrl = getImageUrl(car.images?.[0])
    // Determine status for badge
    const isActive = activeCars.some(c => c.id === car.id)
    const isSold = car.status === 'sold' || car.status === 3
    
    const brandName = getName((car as unknown as Record<string, unknown>).brand as { name: string } | string)
    const modelName = getName((car as unknown as Record<string, unknown>).model as { name: string } | string)
    const cityName = getName((car as unknown as Record<string, unknown>).city as { name: string } | string)
    const mileage = (car as unknown as Record<string, unknown>).mileage as number | undefined || car.odometer || 0

    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <Link to={`/cars/${car.id}`} className="sm:w-48 shrink-0">
            <div className="aspect-video sm:aspect-square relative bg-muted">
              <img
                src={imageUrl}
                alt={`${brandName || ''} ${modelName || ''}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
                    img.src = PLACEHOLDER_IMAGE
                  }
                }}
              />
              {!isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant={isSold ? 'success' : 'secondary'}>
                    {isSold ? 'Sold' : 'Draft/Inactive'}
                  </Badge>
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/cars/${car.id}`}>
                  <h3 className="font-semibold hover:text-primary transition-colors">
                    {brandName} {modelName}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground">
                  {car.year} &bull; {mileage?.toLocaleString()} km
                </p>
              </div>
              <p className="text-lg font-bold text-primary">{formatPrice(car.price)}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {car.view_count || 0} views
              </span>
              {cityName && (
                <span>{cityName}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              {/* Edit button available for own cars */}
              <Button size="sm" variant="outline" asChild>
                <Link to={`/biz/dealer/new?editId=${car.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>

              {isActive ? (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(car.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelMutation.mutate({ id: car.id, car })}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                </>
              ) : !isSold && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => relistMutation.mutate({ id: car.id, car })}
                    disabled={relistMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Reactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(car.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Garage</h1>
          <p className="text-muted-foreground">Manage your car listings</p>
        </div>
        <Button asChild>
          <Link to="/biz/dealer/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCars.length}</p>
                <p className="text-sm text-muted-foreground">On Sale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favorites.length}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {draftCars.length}
                </p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: 'on_sale', label: 'On Sale', count: activeCars.length },
          { id: 'favorites', label: 'Favorites', count: favorites.length },
          { id: 'drafts', label: 'Drafts', count: draftCars.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'px-4 py-2 font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Car list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : displayedCars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cars found</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === 'on_sale' ? 'You have no active listings.' :
               activeTab === 'favorites' ? 'You haven\'t liked any cars yet.' :
               'You have no drafts.'}
            </p>
            {activeTab === 'on_sale' && (
              <Button asChild>
                <Link to="/biz/dealer/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first car
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedCars.map((car) => (
            <CarItem key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  )
}
