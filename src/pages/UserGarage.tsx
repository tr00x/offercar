import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getUserCarsOnSale, getMyCars } from '@/api/profile'
import { markCarDontSell, relistCarForSale } from '@/api/cars'
import { useAuth } from '@/store/auth'
import { CarCard } from '@/components/cars/CarCard'
import { CarCardSkeleton } from '@/components/cars/CarCardSkeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Car, Heart, FileText, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useFavorites } from '@/hooks/useFavorites'
import type { Car as CarType } from '@/types'
import { UserSell } from '@/pages/user/UserSell'

export function UserGarage() {
  const navigate = useNavigate()
  const { isAuthenticated, openAuthModal } = useAuth()
  const queryClient = useQueryClient()

  const [activeGarageTab, setActiveGarageTab] = useState<'on_sale' | 'favorites' | 'drafts'>('on_sale')
  const [isUserSellOpen, setIsUserSellOpen] = useState(false)
  const [activeEditId, setActiveEditId] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      openAuthModal()
    }
  }, [isAuthenticated, navigate, openAuthModal])

  const { data: myCarsOnSaleResponse, isLoading: carsOnSaleLoading } = useQuery({
    queryKey: ['my-cars-on-sale'],
    queryFn: () => getUserCarsOnSale({ limit: 10 }),
  })

  const { data: myDraftsResponse, isLoading: draftsLoading } = useQuery({
    queryKey: ['my-cars'],
    queryFn: () => getMyCars({ limit: 100 }),
  })

  const { likedCars: favoriteCars, isLoading: favoritesLoading } = useFavorites()

  const deactivateListingMutation = useMutation({
    mutationFn: ({ id }: { id: number; car: CarType }) => markCarDontSell(id),
    onMutate: async ({ car }) => {
      await queryClient.cancelQueries({ queryKey: ['my-cars-on-sale'] })
      const prevOnSale = queryClient.getQueryData(['my-cars-on-sale']) as { items: CarType[] } | undefined
      if (prevOnSale) {
        queryClient.setQueryData(['my-cars-on-sale'], {
          ...prevOnSale,
          items: prevOnSale.items.filter((c) => c.id !== car.id),
        })
      }
      return { prevOnSale }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevOnSale) {
        queryClient.setQueryData(['my-cars-on-sale'], ctx.prevOnSale)
      }
      toast.error('Failed to deactivate listing')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cars-on-sale'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      toast.success('Listing deactivated')
    },
  })

  const relistListingMutation = useMutation({
    mutationFn: ({ id }: { id: number; car: CarType }) => relistCarForSale(id),
    onMutate: async ({ car }) => {
      await queryClient.cancelQueries({ queryKey: ['my-cars-on-sale'] })
      const prevOnSale = queryClient.getQueryData(['my-cars-on-sale']) as { items: CarType[] } | undefined
      if (prevOnSale) {
        queryClient.setQueryData(['my-cars-on-sale'], {
          ...prevOnSale,
          items: [car, ...prevOnSale.items.filter((c) => c.id !== car.id)],
        })
      }
      return { prevOnSale }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevOnSale) {
        queryClient.setQueryData(['my-cars-on-sale'], ctx.prevOnSale)
      }
      toast.error('Failed to reactivate listing')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-cars-on-sale'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      toast.success('Listing reactivated')
    },
  })

  const activeCars = myCarsOnSaleResponse?.items || []
  const allMyCars = myDraftsResponse?.items || []
  const draftCars = allMyCars.filter(car => !activeCars.some(active => active.id === car.id))
  const favoritesList = favoriteCars || []
  const totalGarageCars = activeCars.length + draftCars.length

  const handleAddCarClick = () => {
    setActiveEditId(null)
    setIsUserSellOpen(true)
  }

  const handleEditCarClick = (carId: number) => {
    setActiveEditId(String(carId))
    setIsUserSellOpen(true)
  }

  if (carsOnSaleLoading && activeGarageTab === 'on_sale') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="container mx-auto px-4 pt-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Garage</h2>
              <p className="text-sm text-muted-foreground">
                On Sale, Favorites and Drafts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline-flex">
                {totalGarageCars} cars total
              </span>
              <Button size="sm" onClick={handleAddCarClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add car
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{activeCars.length}</p>
                  <p className="text-xs text-muted-foreground">On Sale</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{favoritesList.length}</p>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-500/10">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{draftCars.length}</p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mb-4 border-b border-border">
            {[
              { id: 'on_sale', label: 'On Sale', count: activeCars.length },
              { id: 'favorites', label: 'Favorites', count: favoritesList.length },
              { id: 'drafts', label: 'Drafts', count: draftCars.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGarageTab(tab.id as typeof activeGarageTab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeGarageTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {(() => {
            const isLoading =
              activeGarageTab === 'on_sale'
                ? carsOnSaleLoading
                : activeGarageTab === 'favorites'
                ? favoritesLoading
                : draftsLoading

            const carsToShow =
              activeGarageTab === 'on_sale'
                ? activeCars
                : activeGarageTab === 'favorites'
                ? favoritesList
                : draftCars

            if (isLoading) {
              return (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <CarCardSkeleton key={i} variant="list" />
                  ))}
                </div>
              )
            }

            if (carsToShow.length === 0) {
              return (
                <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-muted-foreground">
                  {activeGarageTab === 'on_sale'
                      ? 'No vehicles currently on sale'
                      : activeGarageTab === 'favorites'
                      ? 'No favorites yet'
                      : 'No drafts yet'}
                  </h3>
                  {activeGarageTab === 'on_sale' && (
                    <Button className="mt-4" onClick={handleAddCarClick}>
                      Add First Car
                    </Button>
                  )}
                </div>
              )
            }

            return (
              <div className="space-y-4">
                {carsToShow.map((car) => (
                  <div key={car.id} className="space-y-2">
                    <CarCard
                      car={activeGarageTab === 'on_sale' || activeGarageTab === 'drafts' ? {
                        ...car,
                        my_car: true,
                      } : car}
                      showActions={true}
                      variant="list"
                      onDeactivate={
                        activeGarageTab === 'on_sale'
                          ? () => deactivateListingMutation.mutate({ id: car.id, car })
                          : undefined
                      }
                      disableDeactivate={deactivateListingMutation.isPending}
                      onReactivate={
                        activeGarageTab === 'drafts'
                          ? () => relistListingMutation.mutate({ id: car.id, car })
                          : undefined
                      }
                      disableReactivate={relistListingMutation.isPending}
                      onEdit={activeGarageTab !== 'favorites' ? handleEditCarClick : undefined}
                    />
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* User Sell Modal */}
      <Dialog open={isUserSellOpen} onOpenChange={setIsUserSellOpen}>
        <DialogContent fullScreen>
          <UserSell editId={activeEditId} onSuccess={() => setIsUserSellOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
