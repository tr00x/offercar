import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
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
} from '@/api/references'
import { getImageUrl } from '@/api/client'
import type { CarsFilters } from '@/api/cars'

interface CarFiltersProps {
  filters: CarsFilters
  onFiltersChange: (filters: CarsFilters) => void
}

export function CarFilters({ filters, onFiltersChange }: CarFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedGenerationName, setSelectedGenerationName] = useState<string>('')

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

  // Group generations by name
  const uniqueGenerationOptions = useMemo(() => {
    const unique = new Map()
    generations.forEach((g) => {
      if (!unique.has(g.name)) {
        unique.set(g.name, { value: g.name, label: g.name })
      }
    })
    return Array.from(unique.values())
  }, [generations])

  // Sync selectedGenerationName with filters
  useEffect(() => {
    if (filters.generation_id && generations.length > 0) {
      const ids = Array.isArray(filters.generation_id) 
        ? filters.generation_id 
        : [filters.generation_id]
      
      const gen = generations.find((g) => ids.includes(g.id))
      if (gen) {
        setSelectedGenerationName(gen.name)
      }
    } else if (!filters.generation_id) {
      setSelectedGenerationName('')
    }
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

  const updateFilter = (key: keyof CarsFilters, value: string | number | boolean | undefined) => {
    const newValue = value === '' || value === 0 ? undefined : value
    onFiltersChange({ ...filters, [key]: newValue })
  }

  const clearFilters = () => {
    onFiltersChange({ limit: filters.limit })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '' && v !== 20) // exclude limit default

  return (
    <div className="space-y-6">
      {/* Specific Car Configuration */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-semibold text-lg">Vehicle Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Brand */}
          <div className="space-y-2">
            <Label>Brand</Label>
            <Combobox
              options={brands.map((b) => ({ value: b.id, label: b.name, image: getImageUrl(b.logo) }))}
              placeholder="All brands"
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
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Combobox
              options={models.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="All models"
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
            />
          </div>

          {/* Year (Single) */}
          <div className="space-y-2">
            <Label>Year</Label>
            <Combobox
              options={years.map((y) => ({ value: y, label: String(y) }))}
              placeholder="Any year"
              value={filters.year}
              onChange={(val) => {
                const value = Number(val) || undefined
                onFiltersChange({ 
                  ...filters, 
                  year: value,
                  body_type_id: undefined,
                  generation_id: undefined,
                  modification_id: undefined
                })
              }}
              disabled={!filters.model_id && years === staticYears} 
            />
          </div>

          {/* Body type */}
          <div className="space-y-2">
            <Label>Body type</Label>
            <Combobox
              options={bodyTypes.map((b) => ({ value: b.id, label: b.name, image: getImageUrl(b.image) }))}
              placeholder="Any body type"
              value={filters.body_type_id}
              onChange={(val) => {
                const value = Number(val) || undefined
                onFiltersChange({ 
                  ...filters, 
                  body_type_id: value,
                  generation_id: undefined,
                  modification_id: undefined
                })
              }}
              disabled={!filters.year && filters.brand_id && filters.model_id ? true : false}
            />
          </div>

          {/* Generation */}
          <div className="space-y-2">
            <Label>Generation</Label>
            <Combobox
              options={uniqueGenerationOptions}
              placeholder="All generations"
              value={selectedGenerationName}
              onChange={(val) => {
                const name = String(val)
                setSelectedGenerationName(name)
                if (!name) {
                  onFiltersChange({ ...filters, generation_id: undefined, modification_id: undefined })
                  return
                }
                const matchingGenerations = generations.filter((g) => g.name === name)
                const ids = matchingGenerations.map((g) => g.id)
                onFiltersChange({ ...filters, generation_id: ids.length > 0 ? ids : undefined, modification_id: undefined })
              }}
              disabled={!filters.body_type_id}
            />
          </div>

          {/* Modification */}
          <div className="space-y-2">
            <Label>Modification</Label>
            <Combobox
              options={modifications.map((m) => {
                const label = [m.engine, m.fuel_type, m.transmission, m.drivetrain].filter(Boolean).join(', ')
                return { 
                  value: m.id, 
                  label: label || m.name || `Modification ${m.id}` 
                }
              })}
              placeholder="Any modification"
              value={filters.modification_id}
              onChange={(val) => {
                const modId = Number(val)
                if (!modId) {
                  onFiltersChange({ 
                    ...filters, 
                    modification_id: undefined,
                    engine_id: undefined,
                    transmission_id: undefined,
                    drivetrain_id: undefined,
                    fuel_type_id: undefined,
                  })
                  return
                }
                
                const ownerGen = generations.find((g) => 
                  g.name === selectedGenerationName && 
                  g.modifications?.some((m) => m.id === modId)
                )

                const mod = ownerGen?.modifications?.find((m) => m.id === modId)
                
                onFiltersChange({ 
                  ...filters, 
                  modification_id: modId,
                  // Also set specific generation ID if found, to be safe
                  generation_id: ownerGen ? ownerGen.id : filters.generation_id,
                  // Set components for filtering since backend doesn't support modification_id directly
                  engine_id: mod?.engine_id,
                  transmission_id: mod?.transmission_id,
                  drivetrain_id: mod?.drivetrain_id,
                  fuel_type_id: mod?.fuel_type_id,
                })
              }}
              disabled={!selectedGenerationName}
            />
          </div>
        </div>
      </div>

      {/* General Filters */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">General Filters</h3>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive">
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
            {/* Toggle advanced */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Less filters' : 'More filters'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* City */}
          <div className="space-y-2">
            <Label>City</Label>
            <Combobox
              options={cities.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="All cities"
              value={filters.city_id}
              onChange={(val) => updateFilter('city_id', Number(val) || undefined)}
            />
          </div>

          {/* Price range */}
          <div className="space-y-2">
            <Label>Price from ($)</Label>
            <Input
              type="number"
              placeholder="Min price"
              value={filters.price_from || ''}
              onChange={(e) => updateFilter('price_from', Number(e.target.value) || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Price to ($)</Label>
            <Input
              type="number"
              placeholder="Max price"
              value={filters.price_to || ''}
              onChange={(e) => updateFilter('price_to', Number(e.target.value) || undefined)}
            />
          </div>

          {/* Odometer */}
          <div className="space-y-2">
            <Label>Max mileage (km)</Label>
            <Input
              type="number"
              placeholder="Max km"
              value={filters.odometer_to || ''}
              onChange={(e) => updateFilter('odometer_to', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>


        </div>

        {/* Checkboxes & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="new-filter" 
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                checked={filters.new || false}
                onChange={(e) => updateFilter('new', e.target.checked ? true : undefined)}
              />
              <Label htmlFor="new-filter" className="cursor-pointer">New cars only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="crash-filter" 
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                checked={filters.crash || false}
                onChange={(e) => updateFilter('crash', e.target.checked ? true : undefined)}
              />
              <Label htmlFor="crash-filter" className="cursor-pointer">Damaged/Crash</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="trade-in-filter" 
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                checked={filters.trade_in === 1}
                onChange={(e) => updateFilter('trade_in', e.target.checked ? 1 : undefined)}
              />
              <Label htmlFor="trade-in-filter" className="cursor-pointer">Trade-in available</Label>
            </div>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
            {/* Transmission */}
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Combobox
                options={transmissions.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Any"
                value={filters.transmission_id}
                onChange={(val) => updateFilter('transmission_id', Number(val) || undefined)}
              />
            </div>

            {/* Fuel type */}
            <div className="space-y-2">
              <Label>Fuel type</Label>
              <Combobox
                options={fuelTypes.map((f) => ({ value: f.id, label: f.name }))}
                placeholder="Any"
                value={filters.fuel_type_id}
                onChange={(val) => updateFilter('fuel_type_id', Number(val) || undefined)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
