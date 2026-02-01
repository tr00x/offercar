import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getCars, type CarsFilters } from '@/api/cars'
import { CarCard } from '@/components/cars/CarCard'
import { CarCardSkeleton } from '@/components/cars/CarCardSkeleton'
import { CarFilters } from '@/components/cars/CarFilters'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

const buildFiltersFromSearchParams = (searchParams: URLSearchParams): { filters: CarsFilters; filtersOpen: boolean } => {
  const initial: CarsFilters = { limit: 12 }

  const brandId = searchParams.get('brand_id')
  const modelId = searchParams.get('model_id')
  const generationId = searchParams.get('generation_id')
  const modificationId = searchParams.get('modification_id')
  const cityId = searchParams.get('city_id')
  const year = searchParams.get('year')
  const yearFrom = searchParams.get('year_from')
  const yearTo = searchParams.get('year_to')
  const priceFrom = searchParams.get('price_from')
  const priceTo = searchParams.get('price_to')
  const odometer = searchParams.get('odometer')
  const bodyTypeId = searchParams.get('body_type_id')
  const transmissionId = searchParams.get('transmission_id')
  const fuelTypeId = searchParams.get('fuel_type_id')
  const drivetrainId = searchParams.get('drivetrain_id')
  const engineId = searchParams.get('engine_id')
  const colorId = searchParams.get('color_id')
  const postedBy = searchParams.get('posted_by')
  const wheel = searchParams.get('wheel')
  const isNew = searchParams.get('new')
  const isCrashed = searchParams.get('crash')
  const tradeIn = searchParams.get('trade_in')
  const owners = searchParams.get('owners')
  const userId = searchParams.get('user_id')

  if (brandId && brandId !== 'undefined') initial.brand_id = Number(brandId)
  if (modelId && modelId !== 'undefined') initial.model_id = Number(modelId)
  if (generationId && generationId !== 'undefined') {
    const parts = generationId
      .split(',')
      .map((part) => Number(part))
      .filter((value) => !Number.isNaN(value))
    if (parts.length === 1) initial.generation_id = parts[0]
    if (parts.length > 1) initial.generation_id = parts
  }
  if (modificationId && modificationId !== 'undefined') initial.modification_id = Number(modificationId)
  if (cityId && cityId !== 'undefined') initial.city_id = Number(cityId)
  if (year && year !== 'undefined') initial.year = Number(year)
  if (yearFrom && yearFrom !== 'undefined') initial.year_from = Number(yearFrom)
  if (yearTo && yearTo !== 'undefined') initial.year_to = Number(yearTo)
  if (priceFrom && priceFrom !== 'undefined') initial.price_from = Number(priceFrom)
  if (priceTo && priceTo !== 'undefined') initial.price_to = Number(priceTo)
  if (odometer && odometer !== 'undefined') initial.odometer = Number(odometer)
  if (bodyTypeId && bodyTypeId !== 'undefined') initial.body_type_id = Number(bodyTypeId)
  if (transmissionId && transmissionId !== 'undefined') initial.transmission_id = Number(transmissionId)
  if (fuelTypeId && fuelTypeId !== 'undefined') initial.fuel_type_id = Number(fuelTypeId)
  if (drivetrainId && drivetrainId !== 'undefined') initial.drivetrain_id = Number(drivetrainId)
  if (engineId && engineId !== 'undefined') initial.engine_id = Number(engineId)
  if (colorId && colorId !== 'undefined') initial.color_id = Number(colorId)
  if (isNew === 'true') initial.new = true
  if (isCrashed === 'true') initial.crash = true
  if (postedBy === 'private' || postedBy === 'dealer') initial.posted_by = postedBy
  if (wheel === 'true') initial.wheel = true
  if (wheel === 'false') initial.wheel = false
  if (tradeIn && tradeIn !== 'undefined') initial.trade_in = Number(tradeIn)
  if (owners && owners !== 'undefined') initial.owners = Number(owners)
  if (userId && userId !== 'undefined') initial.user_id = Number(userId)

  const hasFilters = Object.entries(initial).some(([key, value]) => {
    // Exclude Primary Filters and Limit from triggering Auto-Expand
    if ([
      'limit', 'brand_id', 'model_id', 'year', 'body_type_id', 
      'generation_id', 'city_id', 'posted_by', 'user_id', 'new', 'crash'
    ].includes(key)) return false
    return value !== undefined
  })

  return { filters: initial, filtersOpen: hasFilters }
}

const buildSearchParamsFromFilters = (filters: CarsFilters): URLSearchParams => {
  const params = new URLSearchParams()

  if (filters.brand_id) params.set('brand_id', String(filters.brand_id))
  if (filters.model_id) params.set('model_id', String(filters.model_id))

  if (filters.generation_id) {
    if (Array.isArray(filters.generation_id)) {
      if (filters.generation_id.length > 0) {
        params.set('generation_id', filters.generation_id.join(','))
      }
    } else {
      params.set('generation_id', String(filters.generation_id))
    }
  }

  if (filters.modification_id) params.set('modification_id', String(filters.modification_id))
  if (filters.city_id) params.set('city_id', String(filters.city_id))

  if (filters.year !== undefined) params.set('year', String(filters.year))
  if (filters.year_from !== undefined) params.set('year_from', String(filters.year_from))
  if (filters.year_to !== undefined) params.set('year_to', String(filters.year_to))

  if (filters.price_from !== undefined) params.set('price_from', String(filters.price_from))
  if (filters.price_to !== undefined) params.set('price_to', String(filters.price_to))
  if (filters.odometer !== undefined) params.set('odometer', String(filters.odometer))

  if (filters.body_type_id) params.set('body_type_id', String(filters.body_type_id))
  if (filters.transmission_id) params.set('transmission_id', String(filters.transmission_id))
  if (filters.fuel_type_id) params.set('fuel_type_id', String(filters.fuel_type_id))
  if (filters.drivetrain_id) params.set('drivetrain_id', String(filters.drivetrain_id))
  if (filters.engine_id) params.set('engine_id', String(filters.engine_id))
  if (filters.color_id) params.set('color_id', String(filters.color_id))

  if (filters.new) params.set('new', 'true')
  if (filters.crash) params.set('crash', 'true')
  if (filters.posted_by) params.set('posted_by', filters.posted_by)
  if (filters.wheel !== undefined) params.set('wheel', String(filters.wheel))
  if (filters.trade_in !== undefined) params.set('trade_in', String(filters.trade_in))
  if (filters.owners !== undefined) params.set('owners', String(filters.owners))
  if (filters.user_id) params.set('user_id', String(filters.user_id))

  return params
}

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFromSearch = buildFiltersFromSearchParams(searchParams)
  const [appliedFilters, setAppliedFilters] = useState<CarsFilters>(() => initialFromSearch.filters)
  const [draftFilters, setDraftFilters] = useState<CarsFilters>(() => initialFromSearch.filters)
  const queryClient = useQueryClient()
  const [showMoreFilters, setShowMoreFilters] = useState(() => {
    // If URL has secondary filters, force open to show them
    if (initialFromSearch.filtersOpen) return true
    
    // Otherwise check user preference from session storage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('carFiltersExpanded')
      if (saved !== null) return saved === 'true'
    }
    
    return false
  })

  useEffect(() => {
    const params = buildSearchParamsFromFilters(appliedFilters)
    const next = params.toString()
    const current = searchParams.toString()
    if (next === current) return
    setSearchParams(params, { replace: false })
  }, [appliedFilters, searchParams, setSearchParams])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['cars', appliedFilters],
    queryFn: async ({ pageParam }) => {
      const response = await getCars({ 
        ...appliedFilters, 
        limit: appliedFilters.limit || 12,
        last_id: pageParam as number | undefined
      })
      return response
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage, allPages) => {
      // If we received fewer items than requested, we're at the end
      const limit = appliedFilters.limit || 12
      if (!lastPage.items || lastPage.items.length < limit) return undefined
      
      // If the last_id hasn't changed from the previous page, we're stuck in a loop
      // (This happens if the backend doesn't support pagination correctly)
      if (allPages.length > 1) {
        const prevPage = allPages[allPages.length - 2]
        if (lastPage.last_id === prevPage.last_id) return undefined
      }

      return lastPage.last_id
    },
  })

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['cars'] })
  }, [queryClient])

  // Deduplicate cars by ID to prevent "chaos"
  const cars = useMemo(() => {
    if (!data?.pages) return []
    
    const allCars = data.pages.flatMap((page) => page.items || [])
    const seen = new Set()
    return allCars.filter(car => {
      if (seen.has(car.id)) return false
      seen.add(car.id)
      return true
    })
  }, [data])

  const filteredCars = useMemo(() => {
    let result = cars

    if (appliedFilters.new === true) {
      result = result.filter((car) => car.new === true)
    } else if (appliedFilters.new === false) {
      result = result.filter((car) => car.new !== true)
    }

    if (appliedFilters.crash) {
      result = result.filter((car) => car.crash === true)
    }

    // Skip posted_by filter when filtering by specific user_id
    if (appliedFilters.posted_by && !appliedFilters.user_id) {
      result = result.filter((car) => {
        const owner = car.owner as unknown as { role_id?: number } | null
        const roleId = owner?.role_id ? Number(owner.role_id) : 0

        if (appliedFilters.posted_by === 'dealer') {
          return roleId >= 2
        }

        if (appliedFilters.posted_by === 'private') {
          return roleId === 1
        }

        return true
      })
    }

    return result
  }, [cars, appliedFilters.new, appliedFilters.crash, appliedFilters.posted_by, appliedFilters.user_id])

  const currentSellerName = useMemo(() => {
    if (!appliedFilters.user_id) return undefined
    const match = cars.find((car) => {
      const owner = car.owner as unknown as { id?: number } | null
      return owner?.id === appliedFilters.user_id
    })
    if (!match) return undefined
    const owner = match.owner as unknown as { company_name?: string; name?: string; username?: string } | null
    return owner?.company_name || owner?.name || owner?.username
  }, [cars, appliedFilters.user_id])

  const showApiTotal =
    data?.pages[0]?.total &&
    !appliedFilters.trade_in &&
    appliedFilters.new !== false

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Catalog</h1>
      
      <div className="mb-8 flex flex-col gap-6">
        <div className="w-full flex flex-col space-y-3">
          <CarFilters 
            filters={draftFilters} 
            onFiltersChange={setDraftFilters} 
            className="w-full" 
            showMoreFilters={showMoreFilters}
            onShowMoreFiltersChange={(open) => {
              setShowMoreFilters(open)
              sessionStorage.setItem('carFiltersExpanded', String(open))
            }}
            totalCount={data?.pages[0]?.total}
            sellerNameFromOwner={currentSellerName}
            onApply={() => setAppliedFilters(draftFilters)}
            onFilterUpdateAndApply={(newFilters) => {
              setDraftFilters(newFilters)
              setAppliedFilters(newFilters)
            }}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
           {Array.from({ length: 8 }).map((_, i) => (
             <CarCardSkeleton key={i} />
           ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load cars. Please try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No cars found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setDraftFilters({ limit: 12 })
              setAppliedFilters({ limit: 12 })
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Cars count */}
          <p className="text-muted-foreground mb-4">
            {showApiTotal ? `${data.pages[0].total} cars found` : `Showing ${filteredCars.length} cars`}
          </p>

          {/* Cars grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
              />
            ))}
          </div>

          {/* Load more */}
          {hasNextPage ? (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  fetchNextPage().then(({ data }) => {
                    // Optional: Check if we actually got new items
                    const newPage = data?.pages[data.pages.length - 1]
                    if (!newPage?.items?.length) {
                      toast('No more cars found', { icon: '🚗' })
                    }
                  })
                }}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          ) : (
            cars.length > 0 && (
              <div className="text-center mt-8 py-4 text-muted-foreground border-t border-border/50">
                <p>You've reached the end of the list</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
