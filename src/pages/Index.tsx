import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCars, getHome } from '@/api/cars'
import { CarCard } from '@/components/cars/CarCard'
import { CarCardSkeleton } from '@/components/cars/CarCardSkeleton'
import { BrandsGrid } from '@/components/home/BrandsGrid'
import { SearchWidget } from '@/components/home/SearchWidget'
import { BusinessGrid } from '@/components/home/BusinessGrid'
import { DealersRail } from '@/components/home/DealersRail'
import { AppBanner } from '@/components/home/AppBanner'
import { HotDealCard } from '@/components/home/HotDealCard'
import { BusinessDetailsModal } from '@/components/modals/BusinessDetailsModal'
import type { Business } from '@/api/businesses'

export function Index() {
  const hotDealsRef = useRef<HTMLDivElement | null>(null)
  const dealerCarsRef = useRef<HTMLDivElement | null>(null)
  const recentCarsRef = useRef<HTMLDivElement | null>(null)

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const { data: carsData } = useQuery({
    queryKey: ['cars', 'index-featured'],
    queryFn: () => getCars({ limit: 4 })
  })

  const { data: dealerCarsData, isLoading: isDealerCarsLoading } = useQuery({
    queryKey: ['cars', 'index-dealer-386'],
    queryFn: () => getCars({ user_id: 386, limit: 12 })
  })

  const { data: recentCarsData, isLoading: isRecentCarsLoading } = useQuery({
    queryKey: ['cars', 'index-recent'],
    queryFn: () => getCars({ limit: 4 }) // In real app, might pass sort='created_at'
  })

  const { data: homeData, isLoading: isHomeLoading } = useQuery({
    queryKey: ['home'],
    queryFn: getHome,
    staleTime: 1000 * 60 * 5,
  })

  const hotCars = homeData?.new_cars?.length
    ? homeData.new_cars
    : carsData?.items || recentCarsData?.items || []

  useEffect(() => {
    if (isPaused || hotCars.length <= 1) return

    const interval = setInterval(() => {
      if (hotDealsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = hotDealsRef.current
        const scrollAmount = 280 // Approximate card width + gap

        // Check if we reached the end (with some tolerance)
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          // Scroll back to start
          hotDealsRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          // Scroll forward
          hotDealsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused, hotCars.length])

  return (
    <div className="bg-background min-h-screen text-foreground font-sans pb-20">
      <div className="container mx-auto px-4 space-y-12 pt-8">
        <BusinessDetailsModal
          business={selectedBusiness}
          isOpen={isBusinessModalOpen}
          onClose={() => setIsBusinessModalOpen(false)}
        />
        
        {/* Hot deals row */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Hot deals</h2>
          </div>
          <div 
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <div
              ref={hotDealsRef}
              className="w-full overflow-x-auto pb-4 scrollbar-hide"
            >
              <div className="flex gap-4 min-w-max">
                {isHomeLoading && hotCars.length === 0 ? (
                  [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-64 sm:w-72 h-64 rounded-2xl bg-card border border-border animate-pulse shrink-0"
                    />
                  ))
                ) : (
                  hotCars.slice(0, 8).map((car) => (
                    <div key={car.id} className="w-64 sm:w-72 shrink-0">
                      <HotDealCard car={car} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {hotCars.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    hotDealsRef.current?.scrollBy({
                      left: -260,
                      behavior: 'smooth',
                    })
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
                  aria-label="Previous hot deals"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    hotDealsRef.current?.scrollBy({
                      left: 260,
                      behavior: 'smooth',
                    })
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
                  aria-label="Next hot deals"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Brands & Search Section */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
          <BrandsGrid />
          <div className="h-full">
            <SearchWidget />
          </div>
        </section>

        {/* Cars From OfferCars */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground">Cars From OfferCars</h2>
            <Link
              to="/cars"
              className="bg-secondary text-foreground px-4 py-2 rounded-2xl text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              See all
            </Link>
          </div>

          <div className="relative">
            <div
              ref={dealerCarsRef}
              className="w-full overflow-x-auto pb-4 scrollbar-hide"
            >
              <div className="flex gap-4 min-w-max">
                {isDealerCarsLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-64 sm:w-72 h-72 rounded-2xl bg-card border border-border animate-pulse shrink-0"
                    />
                  ))
                ) : (
                  dealerCarsData?.items?.map((car) => (
                    <div key={car.id} className="w-64 sm:w-72 shrink-0">
                      <CarCard car={car} variant="grid" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {dealerCarsData?.items && dealerCarsData.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    dealerCarsRef.current?.scrollBy({
                      left: -260,
                      behavior: 'smooth',
                    })
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
                  aria-label="Previous dealer cars"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    dealerCarsRef.current?.scrollBy({
                      left: 260,
                      behavior: 'smooth',
                    })
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
                  aria-label="Next dealer cars"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Business Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Business partners</h2>
          </div>
          <BusinessGrid
            onSelect={(business) => {
              setSelectedBusiness(business)
              setIsBusinessModalOpen(true)
            }}
          />
        </section>

        {/* Dealers */}
        <section>
          <DealersRail
            onSelect={(business) => {
              setSelectedBusiness(business)
              setIsBusinessModalOpen(true)
            }}
          />
        </section>

        {/* App Banner */}
        <section>
          <AppBanner />
        </section>

        {/* Recently Added Cars */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">Recently added cars</h2>
          <div className="relative">
            <div
              ref={recentCarsRef}
              className="w-full overflow-x-auto pb-4 scrollbar-hide"
            >
              <div className="flex gap-4 min-w-max">
                {isRecentCarsLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-64 sm:w-72 shrink-0">
                       <CarCardSkeleton variant="grid" />
                    </div>
                  ))
                ) : (
                  recentCarsData?.items?.map((car) => (
                    <div key={car.id} className="w-64 sm:w-72 shrink-0">
                      <CarCard car={car} variant="grid" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {recentCarsData?.items && recentCarsData.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    recentCarsRef.current?.scrollBy({
                      left: -260,
                      behavior: 'smooth',
                    })
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
                  aria-label="Previous recent cars"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    recentCarsRef.current?.scrollBy({
                      left: 260,
                      behavior: 'smooth',
                    })
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-md bg-card/90 text-foreground flex items-center justify-center border border-border shadow-lg hover:bg-card"
                  aria-label="Next recent cars"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
