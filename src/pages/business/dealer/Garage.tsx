import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDealerCars, getDealerCarsOnSale, setDealerCarDontSell, setDealerCarOnSale, deleteDealerCar } from '@/api/dealer'
import { getLikedCars } from '@/api/cars'
import { CarCardSkeleton } from '@/components/cars/CarCardSkeleton'
import { CarCard } from '@/components/cars/CarCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Plus,
  Car,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react'
import { cn, getErrorMessage } from '@/lib/utils'
import { getImageUrl } from '@/api/client'
import { toast } from 'react-hot-toast'
import type { Car as CarType } from '@/types'
import { DealerSell } from '@/pages/business/dealer/DealerSell'

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
  const [isDealerSellOpen, setIsDealerSellOpen] = useState(false)
  const [activeEditId, setActiveEditId] = useState<string | null>(null)

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
    onMutate: async ({ car }: { id: number; car: CarType }) => {
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-active'] })
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-drafts'] })
      const prevActive = queryClient.getQueryData<{ items: CarType[] }>(['dealer-cars-active'])
      const prevDrafts = queryClient.getQueryData<{ items: CarType[] }>(['dealer-cars-drafts'])
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
    onError: (err: unknown, _vars, ctx) => {
      if (ctx?.prevActive) queryClient.setQueryData(['dealer-cars-active'], ctx.prevActive)
      if (ctx?.prevDrafts) queryClient.setQueryData(['dealer-cars-drafts'], ctx.prevDrafts)
      
      toast.error(getErrorMessage(err, 'Failed to deactivate listing'))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })
      toast.success('Listing deactivated successfully')
    },
  })

  const relistMutation = useMutation({
    mutationFn: ({ id }: { id: number; car: CarType }) => setDealerCarOnSale(id),
    onMutate: async ({ car }: { id: number; car: CarType }) => {
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-active'] })
      await queryClient.cancelQueries({ queryKey: ['dealer-cars-drafts'] })
      const prevActive = queryClient.getQueryData<{ items: CarType[] }>(['dealer-cars-active'])
      const prevDrafts = queryClient.getQueryData<{ items: CarType[] }>(['dealer-cars-drafts'])
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
    onError: (err, _vars, ctx) => {
      if (ctx?.prevActive) queryClient.setQueryData(['dealer-cars-active'], ctx.prevActive)
      if (ctx?.prevDrafts) queryClient.setQueryData(['dealer-cars-drafts'], ctx.prevDrafts)
      
      toast.error(getErrorMessage(err, 'Failed to relist car'))
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Failed to delete car'))
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

  const handleAddCarClick = () => {
    setActiveEditId(null)
    setIsDealerSellOpen(true)
  }

  const handleEditCarClick = (carId: number) => {
    setActiveEditId(String(carId))
    setIsDealerSellOpen(true)
  }

  const CarItem = ({ car }: { car: CarType }) => {
    const imageUrl = getImageUrl(car.images?.[0])
    // Determine status for badge
    const isActive = activeCars.some(c => c.id === car.id)
    const isSold = car.status === 'sold' || car.status === 3
    
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video w-full relative bg-gray-100">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={getName(car.model)} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Car className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "On Sale" : isSold ? "Sold" : "Draft"}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">
                {getName(car.brand)} {getName(car.model)}
              </h3>
              <p className="text-sm text-gray-500">
                {car.year} • {car.odometer} km
              </p>
            </div>
            <p className="font-bold text-lg text-primary">
              {formatPrice(car.price)}
            </p>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              asChild
            >
              <Link to={`/cars/${car.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleEditCarClick(car.id)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {isActive ? (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => cancelMutation.mutate({ id: car.id, car })}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => relistMutation.mutate({ id: car.id, car })}
                disabled={relistMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this car?')) {
                  deleteMutation.mutate(car.id)
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Garage</h1>
        <Button onClick={handleAddCarClick}>
          <Plus className="w-4 h-4 mr-2" />
          Add Car
        </Button>
      </div>

      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('on_sale')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'on_sale' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-background/50"
          )}
        >
          On Sale ({activeCars.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'favorites' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-background/50"
          )}
        >
          Favorites ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'drafts' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-background/50"
          )}
        >
          Drafts ({draftCars.length})
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCars.map((car) => (
            activeTab === 'favorites' ? (
              <CarCard key={car.id} car={car} />
            ) : (
              <CarItem key={car.id} car={car} />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No cars found in this section</p>
        </div>
      )}

      <Dialog open={isDealerSellOpen} onOpenChange={setIsDealerSellOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          <DealerSell 
            editId={activeEditId} 
            onSuccess={() => {
              setIsDealerSellOpen(false)
              setActiveEditId(null)
              queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })
              queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
