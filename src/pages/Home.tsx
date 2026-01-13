import { useState, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getCars, type CarsFilters } from '@/api/cars'
import { CarCard } from '@/components/cars/CarCard'
import { CarFilters } from '@/components/cars/CarFilters'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export function Home() {
  const [filters, setFilters] = useState<CarsFilters>({ limit: 12 })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['cars', filters],
    queryFn: async ({ pageParam }) => {
      const response = await getCars({ 
        ...filters, 
        limit: filters.limit || 12,
        last_id: pageParam as number | undefined
      })
      return response
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage, allPages) => {
      // If we received fewer items than requested, we're at the end
      const limit = filters.limit || 12
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

  // Client-side filtering for trade_in because backend doesn't support it yet
  const filteredCars = useMemo(() => {
    if (filters.trade_in === 1) {
      return cars.filter((car) => car.trade_in && car.trade_in > 1)
    }
    return cars
  }, [cars, filters.trade_in])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Car</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Browse thousands of cars from trusted sellers. Buy and sell with confidence on MashynBazar.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <CarFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
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
          <Button variant="outline" className="mt-4" onClick={() => setFilters({ limit: 12 })}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Cars count */}
          <p className="text-muted-foreground mb-4">
            {data?.pages[0]?.total && !filters.trade_in ? `${data.pages[0].total} cars found` : `Showing ${filteredCars.length} cars`}
          </p>

          {/* Cars grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
