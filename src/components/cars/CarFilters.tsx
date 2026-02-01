import { useState, useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { X, ChevronDown, ChevronUp, BadgeCheck, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  getBrands,
  getModelsByBrand,
  getGenerationsByModel,
  getYearsForModel,
  getBodyTypesForModel,
  getBodyTypes,
  getCities,
  getTransmissions,
  getFuelTypes,
  getColors,
  getDrivetrains,
} from '@/api/references'
import { getBusinesses } from '@/api/businesses'
import { getPublicProfile } from '@/api/profile'
import { getCars, type CarsFilters } from '@/api/cars'
import type { ThirdPartyProfile } from '@/types'
import { getImageUrl } from '@/api/client'

interface CarFiltersProps {
  filters: CarsFilters
  onFiltersChange: (filters: CarsFilters) => void
  className?: string
  showMoreFilters?: boolean
  onShowMoreFiltersChange?: (show: boolean) => void
  totalCount?: number
  sellerNameFromOwner?: string
  onApply?: () => void
  onFilterUpdateAndApply?: (filters: CarsFilters) => void
}

function CarFiltersContent({ 
  filters, 
  onFiltersChange, 
  className,
  showMoreFilters: controlledShowMore,
  onShowMoreFiltersChange,
  sellerNameFromOwner,
  onApply,
  onFilterUpdateAndApply,
  isMobile,
  onMobileApply,
}: CarFiltersProps & { isMobile?: boolean; onMobileApply?: () => void }) {
  const [internalShowMore, setInternalShowMore] = useState(false)

  const showMoreFilters = controlledShowMore !== undefined ? controlledShowMore : internalShowMore

  const toggleShowMore = () => {
    if (onShowMoreFiltersChange) {
      onShowMoreFiltersChange(!showMoreFilters)
    } else {
      setInternalShowMore((prev) => !prev)
    }
  }

  // Fetch reference data
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
  })

  const { data: models = [] } = useQuery({
    queryKey: ['models', filters.brand_id],
    queryFn: () => (filters.brand_id ? getModelsByBrand(filters.brand_id) : Promise.resolve([])),
    enabled: !!filters.brand_id,
  })

  // Years depends on brand + model
  const { data: availableYears = [] } = useQuery({
    queryKey: ['years', filters.brand_id, filters.model_id],
    queryFn: () => (filters.brand_id && filters.model_id ? getYearsForModel(filters.brand_id, filters.model_id) : Promise.resolve([])),
    enabled: !!filters.brand_id && !!filters.model_id,
  })

  // Fallback to static years if not filtering by model
  const currentYear = new Date().getFullYear()
  const staticYears = Array.from({ length: 31 }, (_, i) => currentYear - i)
  const years = (filters.brand_id && filters.model_id && availableYears.length > 0) ? availableYears : staticYears

  // Body types depends on model + year (if selected)
  const { data: bodyTypes = [] } = useQuery({
    queryKey: ['body-types', filters.brand_id, filters.model_id, filters.year],
    queryFn: () => {
      if (filters.brand_id && filters.model_id && filters.year) {
        return getBodyTypesForModel(filters.brand_id, filters.model_id, filters.year)
      }
      return getBodyTypes()
    },
    // Always enabled to show all body types if nothing selected
  })

  // Generations depends on model + year + bodyType
  const { data: generations = [] } = useQuery({
    queryKey: ['generations', filters.brand_id, filters.model_id, filters.year, filters.body_type_id],
    queryFn: () => {
      if (filters.brand_id && filters.model_id && filters.year && filters.body_type_id) {
        return getGenerationsByModel(filters.brand_id, filters.model_id, filters.year, filters.body_type_id)
      }
      return Promise.resolve([])
    },
    enabled: !!filters.brand_id && !!filters.model_id && !!filters.year && !!filters.body_type_id,
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: transmissions = [] } = useQuery({
    queryKey: ['transmissions'],
    queryFn: getTransmissions,
  })

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuel-types'],
    queryFn: getFuelTypes,
  })

  const { data: drivetrains = [] } = useQuery({
    queryKey: ['drivetrains'],
    queryFn: getDrivetrains,
  })

  const { data: colors = [] } = useQuery({
    queryKey: ['colors'],
    queryFn: getColors,
  })

  const { data: dealers = [] } = useQuery<Array<{ id: number; name?: string; company_name?: string; username?: string; avatar?: string }>>({
    queryKey: ['dealers'],
    queryFn: () => getBusinesses({ role_id: 2 }),
  })

  const { data: sellerProfile } = useQuery<ThirdPartyProfile | null>({
    queryKey: ['public-profile', filters.user_id],
    queryFn: async () => {
      if (!filters.user_id) return null
      return getPublicProfile(filters.user_id)
    },
    enabled: !!filters.user_id,
    staleTime: 1000 * 60 * 10,
  })

  // Group generations by name
  const uniqueGenerationOptions = useMemo(() => {
    const unique = new Map()
    generations.forEach((g) => {
      if (!unique.has(g.name)) {
        unique.set(g.name, { 
          value: g.name, 
          label: g.name,
          image: g.image ? getImageUrl(g.image) : undefined
        })
      }
    })
    return Array.from(unique.values())
  }, [generations])

  const selectedGenerationName = useMemo(() => {
    if (!filters.generation_id || generations.length === 0) return ''
    const ids = Array.isArray(filters.generation_id)
      ? filters.generation_id
      : [filters.generation_id]
    const gen = generations.find((g) => ids.includes(g.id))
    return gen?.name || ''
  }, [filters.generation_id, generations])

  // Get modifications for the selected generation name
  const modifications = useMemo(() => {
    if (!selectedGenerationName) return []
    
    // Collect all modifications from all generations with the selected name
    const mods = generations
      .filter((g) => g.name === selectedGenerationName)
      .flatMap((g) => g.modifications || [])
    
    // Deduplicate by ID
    const uniqueMods = new Map()
    mods.forEach((m) => uniqueMods.set(m.id, m))
    
    return Array.from(uniqueMods.values())
  }, [generations, selectedGenerationName])

  const updateFilter = <K extends keyof CarsFilters>(
    key: K,
    value: CarsFilters[K] | undefined,
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    const next: CarsFilters = { limit: filters.limit }
    if (onFilterUpdateAndApply) {
      onFilterUpdateAndApply(next)
    } else {
      onFiltersChange(next)
    }
  }

  const countQueries = useQueries({
    queries: [
      {
        queryKey: ['cars-count', 'all', { ...filters, new: undefined, crash: undefined, limit: undefined, last_id: undefined }],
        queryFn: () => getCars({ ...filters, new: undefined, crash: undefined, limit: undefined, last_id: undefined }),
        staleTime: 1000 * 60,
      },
      {
        queryKey: ['cars-count', 'new', { ...filters, new: true, crash: undefined, limit: undefined, last_id: undefined }],
        queryFn: () => getCars({ ...filters, new: true, crash: undefined, limit: undefined, last_id: undefined }),
        staleTime: 1000 * 60,
      },
      {
        queryKey: ['cars-count', 'used', { ...filters, new: false, crash: undefined, limit: undefined, last_id: undefined }],
        queryFn: () => getCars({ ...filters, new: false, crash: undefined, limit: undefined, last_id: undefined }),
        staleTime: 1000 * 60,
      },
      {
        queryKey: ['cars-count', 'crashed', { ...filters, crash: true, new: undefined, limit: undefined, last_id: undefined }],
        queryFn: () => getCars({ ...filters, crash: true, new: undefined, limit: undefined, last_id: undefined }),
        staleTime: 1000 * 60,
      },
    ],
  })

  const allTotal = countQueries[0].data?.total || 0
  const newTotal = countQueries[1].data?.total || 0
  const crashedTotal = countQueries[3].data?.total || 0
  const isLoadingCount = countQueries[0].isLoading

  const usedTotal = Math.max(allTotal - newTotal, 0)

  const conditionTabs = [
    { id: 'all' as const, label: 'Any condition', count: allTotal },
    { id: 'new' as const, label: 'New', count: newTotal },
    { id: 'used' as const, label: 'Used', count: usedTotal },
    { id: 'crashed' as const, label: 'Crashed', count: crashedTotal },
  ]

  const activeCondition = filters.crash ? 'crashed' : filters.new ? 'new' : (filters.new === false ? 'used' : 'all')
  const activeTabCount = conditionTabs.find(t => t.id === activeCondition)?.count

  const handleConditionChange = (id: 'all' | 'new' | 'used' | 'crashed') => {
    const base = { ...filters, new: undefined, crash: undefined }
    if (id === 'all') onFiltersChange(base)
    else if (id === 'new') onFiltersChange({ ...base, new: true })
    else if (id === 'used') onFiltersChange({ ...base, new: false })
    else if (id === 'crashed') onFiltersChange({ ...base, crash: true })
  }

  const postedByOptions = [
    { value: 'all', label: 'All sellers' },
    { value: 'dealer', label: 'Dealerships' },
    { value: 'private', label: 'Private sellers' },
  ]

  const dealerOptions = dealers.map((d) => ({
    value: d.id,
    label: d.name || d.company_name || d.username || 'Дилер',
    image: getImageUrl(d.avatar),
  }))

  const sellerFilterOptions = (_options: { value: string | number; label: string }[], search: string) => {
    if (!search) return postedByOptions
    const s = search.toLowerCase()
    return dealerOptions.filter((opt) => opt.label.toLowerCase().includes(s))
  }

  const sellerValue = filters.user_id ?? (filters.posted_by || 'all')

  const handleSellerChange = (val: string | number) => {
    if (typeof val === 'string') {
      const newPostedBy = val === 'all' ? undefined : (val as CarsFilters['posted_by'])
      onFiltersChange({
        ...filters,
        posted_by: newPostedBy,
        user_id: undefined,
      })
      return
    }

    // When selecting specific user, don't set posted_by to avoid filtering conflicts
    // (user could be private seller with role_id=1)
    onFiltersChange({
      ...filters,
      posted_by: undefined,
      user_id: Number(val),
    })
  }

  const isSelectedSeller = !!filters.user_id
  const isDealer = sellerProfile?.role_id === 2 || dealers.some(d => d.id === filters.user_id)

  const sellerName =
    sellerProfile
      ? isDealer
        ? sellerProfile.company_name || sellerProfile.name || sellerProfile.username || sellerNameFromOwner || 'Dealer'
        : sellerProfile.name || sellerProfile.username || sellerNameFromOwner || 'Seller'
      : sellerNameFromOwner || 'Seller'

  return (
    <div className={cn("bg-card rounded-3xl p-6 space-y-6 text-foreground", className)}>
      {/* Top Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6 border-b border-border pb-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            {isSelectedSeller ? (
              <div className="bg-accent rounded-xl h-14 flex items-center px-3 gap-3 relative group border border-border">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 text-xs font-medium">
                  {sellerProfile?.avatar && (isDealer || (sellerProfile?.role_id && sellerProfile.role_id >= 2)) ? (
                    <img src={getImageUrl(sellerProfile.avatar)} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/70">
                      {(sellerProfile?.name || sellerProfile?.username || 'ID').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate leading-tight">
                      {sellerName}
                    </span>
                    {isDealer && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {activeTabCount !== undefined ? `${activeTabCount} cars` : 'Loading...'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Reset all filters when clearing seller
                    const resetFilters = { limit: filters.limit || 12 }
                    onFiltersChange(resetFilters)
                    if (onFilterUpdateAndApply) {
                      onFilterUpdateAndApply(resetFilters)
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Combobox
                options={[...postedByOptions, ...dealerOptions]}
                value={sellerValue}
                onChange={handleSellerChange}
                placeholder="All sellers"
                searchPlaceholder="Search dealer"
                triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-14 ring-0 ring-offset-0 focus:ring-0 outline-none"
                filterOptions={sellerFilterOptions}
              />
            )}
          </div>
          <div className="w-full sm:w-56">
              <Combobox
                options={cities.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="All regions"
                value={filters.city_id}
                onChange={(val) => updateFilter('city_id', Number(val) || undefined)}
                triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-14 ring-0 ring-offset-0 focus:ring-0 outline-none"
              />
          </div>
        </div>
        
        <div className={cn(
          "gap-1 bg-secondary p-1 rounded-xl w-full sm:w-auto",
          isMobile ? "grid grid-cols-2" : "flex flex-wrap"
        )}>
          {conditionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleConditionChange(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex flex-col items-center leading-none gap-1",
                !isMobile && "min-w-[100px]",
                activeCondition === tab.id
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-60">{tab.count} cars</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid - Primary Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Combobox
          options={brands.map((b) => ({ value: b.id, label: b.name, image: getImageUrl(b.logo) }))}
          placeholder="Make"
          value={filters.brand_id}
          onChange={(val) => {
            const value = Number(val) || undefined
            onFiltersChange({ 
              ...filters, 
              brand_id: value, 
              model_id: undefined, 
              year: undefined,
              body_type_id: undefined,
              generation_id: undefined,
              modification_id: undefined
            })
          }}
          triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
        />

        <Combobox
          options={models.map((m) => ({ value: m.id, label: m.name }))}
          placeholder="Model"
          value={filters.model_id}
          onChange={(val) => {
            const value = Number(val) || undefined
            onFiltersChange({ 
              ...filters, 
              model_id: value,
              year: undefined,
              body_type_id: undefined,
              generation_id: undefined,
              modification_id: undefined
            })
          }}
          disabled={!filters.brand_id}
          triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
        />

        <Combobox
          options={bodyTypes.map((b) => ({ value: b.id, label: b.name, image: getImageUrl(b.image) }))}
          placeholder="Body type"
          value={filters.body_type_id}
          onChange={(val) => updateFilter('body_type_id', Number(val) || undefined)}
          triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
        />

        <Combobox
          options={years.map((y) => ({ value: y, label: String(y) }))}
          placeholder="Year"
          value={filters.year}
          onChange={(val) => updateFilter('year', Number(val) || undefined)}
          triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
        />

        <Combobox
          options={uniqueGenerationOptions}
          placeholder="Generation"
          value={selectedGenerationName}
          onChange={(val) => {
            const name = String(val)
            if (!name) {
              onFiltersChange({ ...filters, generation_id: undefined, modification_id: undefined })
              return
            }
            const matchingGenerations = generations.filter((g) => g.name === name)
            const ids = matchingGenerations.map((g) => g.id)
            onFiltersChange({ ...filters, generation_id: ids.length > 0 ? ids : undefined, modification_id: undefined })
          }}
          disabled={!filters.model_id}
          triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
        />
      </div>

      {/* Collapsible Section */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          (showMoreFilters || isMobile) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 pt-3">
            {/* Secondary Filters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Combobox
                options={modifications.map((m) => ({ value: m.id, label: m.name || `Mod ${m.id}` }))}
                placeholder="Modification"
                value={filters.modification_id}
                onChange={(val) => updateFilter('modification_id', Number(val) || undefined)}
                disabled={!selectedGenerationName}
                triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
              />

              <Combobox
                options={[
                  { value: 10000, label: 'up to 10 000 km' },
                  { value: 50000, label: 'up to 50 000 km' },
                  { value: 100000, label: 'up to 100 000 km' },
                  { value: 200000, label: 'up to 200 000 km' },
                ]}
                placeholder="Max mileage"
                value={filters.odometer}
                onChange={(val) => updateFilter('odometer', Number(val) || undefined)}
                triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
              />

              <div className="relative">
                <Input
                  type="number"
                  placeholder="Price from"
                  value={filters.price_from ?? ''}
                  onChange={(e) => updateFilter('price_from', Number(e.target.value) || undefined)}
                  className="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="relative">
                <Input
                  type="number"
                  placeholder="Price to"
                  value={filters.price_to ?? ''}
                  onChange={(e) => updateFilter('price_to', Number(e.target.value) || undefined)}
                  className="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <Combobox
                options={transmissions.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Transmission"
                value={filters.transmission_id}
                onChange={(val) => updateFilter('transmission_id', Number(val) || undefined)}
                triggerClassName="bg-secondary hover:bg-secondary/80 border-border text-foreground rounded-xl h-12 ring-0 ring-offset-0 focus:ring-0 outline-none"
              />
            </div>

            {/* Segmented Controls */}
            <div className="space-y-6">
              {/* Owners & Drive */}
              <div className="flex flex-wrap gap-8">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Owners</Label>
                  <div className="flex flex-wrap bg-secondary rounded-lg p-1">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => updateFilter('owners', filters.owners === num ? undefined : num)}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                          filters.owners === num ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {num === 4 ? '4+' : num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Drivetrain</Label>
                  <div className="flex flex-wrap bg-secondary rounded-lg p-1">
                    <button
                       onClick={() => updateFilter('drivetrain_id', undefined)}
                       className={cn(
                         "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                         !filters.drivetrain_id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                       )}
                    >
                      Any
                    </button>
                    {drivetrains.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => updateFilter('drivetrain_id', d.id)}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                          filters.drivetrain_id === d.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Fuel type</Label>
                  <div className="flex flex-wrap bg-secondary rounded-lg p-1">
                    <button
                      onClick={() => updateFilter('fuel_type_id', undefined)}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                        !filters.fuel_type_id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Any
                    </button>
                    {fuelTypes.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => updateFilter('fuel_type_id', filters.fuel_type_id === f.id ? undefined : f.id)}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                          filters.fuel_type_id === f.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exchange & Colors */}
              <div className="flex flex-wrap items-start gap-8">
                 <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Trade-in</Label>
                  <div className="flex flex-wrap bg-secondary rounded-lg p-1">
                     {/* Mock exchange options as per image */}
                     {['Any', 'No', 'Same value', 'More expensive', 'Cheaper'].map((opt, i) => (
                       <button
                         key={opt}
                          // Map to trade_in logic if exists, or just mock for now
                         onClick={() => updateFilter('trade_in', i)} 
                         className={cn(
                           "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                           filters.trade_in === i ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                         )}
                       >
                         {opt}
                       </button>
                     ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Color</Label>
                  <div className="flex flex-wrap gap-3 items-center">
                     <button
                        onClick={() => updateFilter('color_id', undefined)}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-secondary",
                           !filters.color_id ? "bg-accent text-foreground" : "text-muted-foreground"
                        )}
                     >
                       Any color
                     </button>
                     {colors.map((c) => (
                       <button
                         key={c.id}
                         onClick={() => updateFilter('color_id', filters.color_id === c.id ? undefined : c.id)}
                         className={cn(
                           "w-8 h-8 rounded-full border-2 transition-all",
                           filters.color_id === c.id ? "border-white scale-110" : "border-transparent hover:scale-105"
                         )}
                         style={{ backgroundColor: (c as { hex?: string; name: string }).hex || c.name || '#000' }}
                         title={c.name}
                       />
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isMobile && (
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <button
            onClick={toggleShowMore}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {showMoreFilters ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {showMoreFilters ? 'Less parameters' : 'More parameters'}
          </button>

          <div className="flex items-center gap-4">
            <button 
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Reset filters
            </button>
            <Button 
              className="bg-primary text-primary-foreground hover:opacity-90 rounded-xl px-8 py-6 text-lg font-semibold"
              onClick={onApply}
            >
              Show {isLoadingCount ? '...' : allTotal} cars
            </Button>
          </div>
        </div>
      )}
      
      {isMobile && (
        <>
          <div className="h-24" />
          <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border p-4 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
             <Button 
                className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-xl" 
                onClick={onMobileApply}
             >
                Show {isLoadingCount ? '...' : allTotal} cars
             </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function CarFilters(props: CarFiltersProps) {
  const [open, setOpen] = useState(false)

  const handleMobileApply = () => {
    props.onApply?.()
    setOpen(false)
  }

  // Fetch reference data for chips
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 60,
  })

  const { data: models = [] } = useQuery({
    queryKey: ['models', props.filters.brand_id],
    queryFn: () => (props.filters.brand_id ? getModelsByBrand(props.filters.brand_id) : Promise.resolve([])),
    enabled: !!props.filters.brand_id,
    staleTime: 1000 * 60 * 60,
  })

  const handleChipRemove = (newFilters: CarsFilters) => {
    if (props.onFilterUpdateAndApply) {
      props.onFilterUpdateAndApply(newFilters)
    } else {
      props.onFiltersChange(newFilters)
    }
  }

  const activeChips: { label: string; onRemove: () => void }[] = []

  if (props.filters.brand_id) {
    const brand = brands.find(b => b.id === props.filters.brand_id)
    if (brand) {
      activeChips.push({
        label: brand.name,
        onRemove: () =>
          handleChipRemove({
            ...props.filters,
            brand_id: undefined,
            model_id: undefined,
            generation_id: undefined,
            modification_id: undefined,
          }),
      })
    }
  }

  if (props.filters.model_id) {
    const model = models.find(m => m.id === props.filters.model_id)
    if (model) {
      activeChips.push({
        label: model.name,
        onRemove: () =>
          handleChipRemove({
            ...props.filters,
            model_id: undefined,
            generation_id: undefined,
            modification_id: undefined,
          }),
      })
    }
  }

  if (props.filters.year) {
    activeChips.push({
      label: String(props.filters.year),
      onRemove: () =>
        handleChipRemove({
          ...props.filters,
          year: undefined,
        }),
    })
  }

  if (props.filters.new === true) {
    activeChips.push({
      label: 'New',
      onRemove: () =>
        handleChipRemove({
          ...props.filters,
          new: undefined,
        }),
    })
  }

  if (props.filters.new === false) {
    activeChips.push({
      label: 'Used',
      onRemove: () =>
        handleChipRemove({
          ...props.filters,
          new: undefined,
        }),
    })
  }

  if (props.filters.price_from) {
    activeChips.push({
      label: `From $${props.filters.price_from}`,
      onRemove: () =>
        handleChipRemove({
          ...props.filters,
          price_from: undefined,
        }),
    })
  }

  if (props.filters.price_to) {
    activeChips.push({
      label: `To $${props.filters.price_to}`,
      onRemove: () =>
        handleChipRemove({
          ...props.filters,
          price_to: undefined,
        }),
    })
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block">
        <CarFiltersContent {...props} />
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
         <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Dialog open={open} onOpenChange={setOpen}>
               <DialogTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 bg-secondary border-border text-foreground hover:bg-secondary/80 shrink-0 rounded-xl px-4">
                     <Filter className="w-4 h-4" />
                     Filters
                     {(Object.keys(props.filters).length > 1) && <span className="w-2 h-2 bg-primary rounded-full ml-1" />}
                  </Button>
               </DialogTrigger>
               <DialogContent className="h-[95vh] flex flex-col p-0" hideCloseButton>
                  <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
                     <div className="flex items-center gap-3">
                        <button onClick={() => setOpen(false)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                           <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                     </div>
                     <button 
                        onClick={() => {
                           if (props.onFilterUpdateAndApply) {
                              props.onFilterUpdateAndApply({ limit: props.filters.limit })
                           } else {
                              props.onFiltersChange({ limit: props.filters.limit })
                           }
                           setOpen(false)
                        }} 
                        className="text-sm font-medium text-red-400 hover:text-red-300 px-2 py-1"
                     >
                        Reset
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                     <CarFiltersContent 
                        {...props} 
                        className="bg-transparent p-4 pb-0" 
                        isMobile 
                        onMobileApply={handleMobileApply}
                     />
                  </div>
               </DialogContent>
            </Dialog>
            
            {/* Quick Chips */}
            {activeChips.map((chip, i) => (
               <div key={i} className="flex items-center bg-secondary border border-border rounded-xl px-3 h-10 shrink-0 text-sm text-foreground whitespace-nowrap">
                  {chip.label}
                  <button onClick={chip.onRemove} className="ml-2 text-muted-foreground hover:text-foreground">
                     <X className="w-3 h-3" />
                  </button>
               </div>
            ))}
         </div>
      </div>
    </>
  )
}
