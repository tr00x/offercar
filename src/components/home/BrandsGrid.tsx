import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getImageUrl } from '@/api/client'
import { getBrands } from '@/api/references'
import type { Brand } from '@/types'

const POPULAR_BRANDS = [
  { label: 'Audi', id: 1076 },
  { label: 'BMW', id: 1097 },
  { label: 'Ford', id: 1164 },
  { label: 'Hyundai', id: 1210 },
  { label: 'Land Rover', id: 1248 },
  { label: 'Mazda', id: 1280 },
  { label: 'Mercedes-Benz', id: 1283 },
  { label: 'Nissan', id: 1300 },
  { label: 'RAM', id: 1336 },
  { label: 'Li Xiang', id: 1260 },
  { label: 'Volkswagen', id: 1410 },
  { label: 'Lamborghini', id: 1246 },
  { label: 'Porsche', id: 1324 },
  { label: 'Ferrari', id: 1160 },
  { label: 'Rolls-Royce', id: 1349 },
  { label: 'Brabus', id: 1099 },
]

export function BrandsGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 60,
  })

  const brands = (data || []) as Brand[]
  const list = POPULAR_BRANDS.map((popular) => {
    const match =
      brands.find((b) => b.id === popular.id) ||
      brands.find((b) => b.name.toLowerCase() === popular.label.toLowerCase())

    const logoUrl = match?.logo ? getImageUrl(match.logo) : undefined
    const displayName = match?.name || popular.label

    return {
      ...popular,
      logoUrl,
      displayName,
    }
  })

  const handleOpenAllBrands = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-brand-search'))
    }
  }

  return (
    <div className="bg-card p-6 rounded-2xl border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Popular brands</h3>
        <button
          type="button"
          onClick={handleOpenAllBrands}
          className="bg-secondary text-foreground px-4 py-2 rounded-2xl text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          All brands
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-x-6 gap-y-5">
        {isLoading && brands.length === 0
          ? Array.from({ length: POPULAR_BRANDS.length }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary animate-pulse" />
                <div className="h-3 w-16 sm:w-20 rounded bg-secondary animate-pulse" />
              </div>
            ))
          : list.map((item) => {
              const to = item.id ? `/cars?brand_id=${item.id}` : '/cars'
              return (
                <Link
                  key={item.id ?? item.label}
                  to={to}
                  className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  {item.logoUrl && (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.logoUrl}
                        alt={item.displayName}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium truncate">
                    {item.displayName}
                  </span>
                </Link>
              )
            })}
      </div>
    </div>
  )
}
