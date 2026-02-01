import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Spinner } from '@/components/ui/spinner'
import { getBrands, getModelsByBrand, getFilterBrands, getYearsForModel } from '@/api/references'
import { getCars, type CarsFilters } from '@/api/cars'
import type { Brand, Model } from '@/types'
import { cn } from '@/lib/utils'
import { Search, ChevronRight, X, ChevronDown, ChevronLeft } from 'lucide-react'

const POPULAR_BRAND_IDS = [
  1076,
  1097,
  1164,
  1210,
  1248,
  1280,
  1283,
  1300,
  1336,
  1260,
  1410,
  1246,
  1324,
  1160,
  1349,
  1099,
]

export function SearchWidget() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'crashed'>('all')
  
  // Brand state
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [brandSearch, setBrandSearch] = useState('')
  
  // Model state
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [modelSearch, setModelSearch] = useState('')

  const [priceFrom, setPriceFrom] = useState<number | undefined>(undefined)
  const [year, setYear] = useState<number | undefined>(undefined)
  const [brandModelCounts, setBrandModelCounts] = useState<Record<number, number>>({})

  // Fetch Brands
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 60,
  })
  const brands = useMemo(
    () => (brandsData || []) as Brand[],
    [brandsData],
  )

  // Fetch Models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models', selectedBrand?.id],
    queryFn: () => getModelsByBrand(selectedBrand!.id),
    enabled: !!selectedBrand?.id,
  })
  const models = useMemo(
    () => (modelsData || []) as Model[],
    [modelsData],
  )

  const { data: yearsData = [] } = useQuery({
    queryKey: ['years-search-widget', selectedBrand?.id, selectedModel?.id],
    queryFn: () =>
      selectedBrand?.id && selectedModel?.id
        ? getYearsForModel(selectedBrand.id, selectedModel.id)
        : Promise.resolve([]),
    enabled: !!selectedBrand?.id && !!selectedModel?.id,
    staleTime: 1000 * 60 * 60,
  })

  const currentYear = new Date().getFullYear()
  const staticYears = Array.from({ length: 31 }, (_, i) => currentYear - i)
  const yearsOptions =
    selectedBrand?.id && selectedModel?.id && yearsData.length > 0 ? yearsData : staticYears

  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ['search-widget-count', selectedBrand?.id, selectedModel?.id, activeTab, priceFrom, year],
    queryFn: () => {
      const params: CarsFilters = { limit: 1 }
      if (selectedBrand?.id) params.brand_id = selectedBrand.id
      if (selectedModel?.id) params.model_id = selectedModel.id
      if (activeTab === 'new') params.new = true
      if (activeTab === 'crashed') params.crash = true
      if (year) params.year = year
      if (priceFrom) params.price_from = priceFrom
      return getCars(params)
    },
    // Always enabled to show total count even without filters
    staleTime: 1000 * 60, 
  })

  const totalCars = carsData?.total

  // -- Logic for Brands --
  const popularBrands = useMemo(() => {
    if (!brands.length) return []
    return POPULAR_BRAND_IDS.map((id) => brands.find((b) => b.id === id)).filter(Boolean) as Brand[]
  }, [brands])

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands
    const term = brandSearch.toLowerCase()
    return brands.filter((b) => b.name.toLowerCase().includes(term) || b.name_ru?.toLowerCase().includes(term))
  }, [brands, brandSearch])

  const groupedBrands = useMemo(() => {
    const groups: Record<string, Brand[]> = {}
    filteredBrands.forEach((brand) => {
      const letter = (brand.name[0] || '#').toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(brand)
    })
    const letters = Object.keys(groups).sort()
    return { groups, letters }
  }, [filteredBrands])
  useEffect(() => {
    if (!brandDialogOpen || !brands.length || brandModelCounts && Object.keys(brandModelCounts).length) return

    let cancelled = false

    const loadCounts = async () => {
      try {
        const fb = await getFilterBrands()
        if (cancelled) return
        const all = fb.all_brands || []
        const counts: Record<number, number> = {}
        all.forEach((b) => {
          if (b.model_count !== undefined) {
            counts[b.id] = b.model_count
          }
        })
        setBrandModelCounts(counts)
      } catch {
        if (!cancelled) {
          setBrandModelCounts({})
        }
      }
    }

    void loadCounts()

    return () => {
      cancelled = true
    }
  }, [brandDialogOpen, brands, brandModelCounts])

  useEffect(() => {
    const handler = () => setBrandDialogOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open-brand-search', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-brand-search', handler)
      }
    }
  }, [])

  // -- Logic for Models --
  const filteredModels = useMemo(() => {
    if (!modelSearch) return models
    const term = modelSearch.toLowerCase()
    return models.filter((m) => m.name.toLowerCase().includes(term) || m.name_ru?.toLowerCase().includes(term))
  }, [models, modelSearch])

  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {}
    filteredModels.forEach((model) => {
      const letter = (model.name[0] || '#').toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(model)
    })
    const letters = Object.keys(groups).sort()
    return { groups, letters }
  }, [filteredModels])

  const brandSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const modelSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const scrollToLetter = (letter: string, refs: MutableRefObject<Record<string, HTMLDivElement | null>>) => {
    const el = refs.current[letter]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSelectBrand = (brand: Brand | null) => {
    setSelectedBrand(brand)
    setSelectedModel(null)
    setBrandDialogOpen(false)
    setBrandSearch('')
    setPriceFrom(undefined)
    setYear(undefined)
    if (brand) {
      setModelDialogOpen(true)
    } else {
      setModelDialogOpen(false)
    }
  }

  const handleSelectModel = (model: Model | null) => {
    setSelectedModel(model)
    setModelDialogOpen(false)
    setModelSearch('')
    setYear(undefined)
  }

  const handleShowCars = () => {
    const params = new URLSearchParams()
    if (selectedBrand?.id) params.append('brand_id', String(selectedBrand.id))
    if (selectedModel?.id) params.append('model_id', String(selectedModel.id))
    if (activeTab === 'new') params.append('new', 'true')
    if (activeTab === 'crashed') params.append('crash', 'true')
    if (priceFrom !== undefined) params.append('price_from', String(priceFrom))
    if (year !== undefined) params.append('year', String(year))
    
    if (params.toString()) {
      navigate(`/cars?${params.toString()}`)
    } else {
      navigate('/cars')
    }
  }

  const tabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'new' as const, label: 'New' },
    { id: 'crashed' as const, label: 'Crashed' },
  ]

  const showButtonLabel = totalCars !== undefined
    ? `Show ${totalCars} ads`
    : 'Show cars'

  return (
    <div className="bg-card p-5 sm:p-6 rounded-3xl text-card-foreground h-full flex flex-col shadow-xl ring-1 ring-border">
      <h3 className="text-xl sm:text-2xl font-bold mb-6 leading-tight flex items-center gap-2">
        Search for cars
      </h3>

      {/* Tabs */}
      <div className="w-full mb-6 bg-secondary p-1.5 rounded-xl flex gap-1 border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 flex-1">
        {/* Brand + Model Selector */}
        <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
          <DialogTrigger asChild>
            <div
              className={cn(
                "group relative w-full min-h-[72px] rounded-2xl bg-secondary px-5 py-3 flex items-center justify-between border transition-all duration-300 cursor-pointer hover:bg-secondary/80 hover:shadow-lg active:scale-[0.98]",
                selectedBrand
                  ? "border-primary/40 shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-secondary"
                  : "border-border hover:border-primary/20"
              )}
            >
              <div className="flex flex-col gap-1 w-full overflow-hidden">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  Make & model
                </span>
                <div className="flex items-center gap-3">
                  {selectedBrand ? (
                    <>
                      {selectedBrand.logo && (
                        <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                          <img
                            src={selectedBrand.logo}
                            alt=""
                            className="w-7 h-7 object-contain"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground/80 truncate">
                          {selectedBrand.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {selectedModel ? selectedModel.name : 'Any model'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground font-semibold text-base tracking-tight">
                      Any make and model
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pl-2 border-l border-border h-10">
                 {selectedBrand && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation()
                       handleSelectBrand(null)
                     }}
                     className="p-1.5 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground group/clear"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 )}
                 <ChevronDown className={cn(
                   "w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all duration-300",
                   brandDialogOpen && "rotate-180 text-foreground"
                 )} />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent hideCloseButton className="w-full h-[100dvh] sm:h-[85vh] p-0 flex flex-col">
            <div className="relative shrink-0 border-b border-border bg-muted/30">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="relative px-4 py-3 flex items-center justify-between gap-4">
                <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">Select Make</DialogTitle>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBrandDialogOpen(false)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </Button>
              </div>
            </div>
            
            <div className="p-4 pb-3 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm space-y-3">
              {!brandSearch && popularBrands.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Popular</div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {popularBrands.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => handleSelectBrand(brand)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent transition-all border border-border flex-shrink-0 shadow-sm",
                          "active:scale-95 text-xs font-medium",
                          selectedBrand?.id === brand.id && "border-primary/60 bg-accent shadow-lg shadow-primary/10"
                        )}
                      >
                        {brand.logo && (
                          <div className="w-7 h-7 flex items-center justify-center">
                            <img 
                              src={brand.logo} 
                              alt="" 
                              className="w-7 h-7 object-contain"
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                          </div>
                        )}
                        <span className="truncate max-w-[80px] text-foreground">
                          {brand.name}
                        </span>
                        {brandModelCounts[brand.id] !== undefined && (
                          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            {brandModelCounts[brand.id]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Search..." 
                  className="bg-muted/50 border border-border pl-9 h-11 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary text-base"
                />
                {brandSearch && (
                   <button 
                     onClick={() => setBrandSearch('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                   >
                     <X className="w-4 h-4" />
                   </button>
                )}
              </div>
            </div>

            {!brandSearch && (
              <div className="px-2 py-2 border-b border-border bg-background/95 backdrop-blur overflow-x-auto scrollbar-hide flex gap-1 shrink-0">
                 <button 
                   onClick={() => handleSelectBrand(null)}
                   className={cn(
                     "px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                     !selectedBrand ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                   )}
                 >
                   ALL
                 </button>
                 {groupedBrands.letters.map(letter => (
                   <button
                     key={letter}
                     onClick={() => scrollToLetter(letter, brandSectionRefs)}
                     className="w-8 py-1.5 text-xs font-bold rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                   >
                     {letter}
                   </button>
                 ))}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 scroll-smooth scrollbar-hide bg-background">
               {brandsLoading ? (
                 <div className="flex justify-center py-10"><Spinner className="text-muted-foreground" /></div>
               ) : (
                 <>
                   {!brandSearch && (
                    <button
                        onClick={() => handleSelectBrand(null)}
                        className="w-full flex items-center p-3 rounded-xl bg-card hover:bg-accent text-left mb-3 group border border-border hover:border-primary/40 transition-all duration-200"
                     >
                       <span className="font-medium text-foreground/80 group-hover:text-foreground">All makes</span>
                       {!selectedBrand && <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />}
                     </button>
                   )}

                    {groupedBrands.letters.map(letter => (
                      <div key={letter} ref={el => { brandSectionRefs.current[letter] = el }} className="mb-4 scroll-mt-4">
                        <div className="text-xs font-bold text-primary mb-2 px-3">{letter}</div>
                       <div className="space-y-1">
                         {groupedBrands.groups[letter].map(brand => (
                           <button
                             key={brand.id}
                             onClick={() => handleSelectBrand(brand)}
                             className={cn(
                               "w-full flex items-center p-3 rounded-xl bg-card hover:bg-accent text-left transition-all duration-200 border border-border hover:border-primary/40 active:scale-[0.99]",
                               selectedBrand?.id === brand.id && "border-primary/70 bg-accent shadow-lg shadow-primary/25"
                             )}
                           >
                             <div className="flex items-center gap-4 flex-1 overflow-hidden">
                              {brand.logo && (
                                <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                                  <img 
                                    src={brand.logo} 
                                    alt="" 
                                    className="w-9 h-9 object-contain"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                  />
                                </div>
                              )}
                              <span className={cn("truncate font-medium text-base", selectedBrand?.id === brand.id ? "text-foreground" : "text-muted-foreground")}>
                                {brand.name}
                              </span>
                              {brandModelCounts[brand.id] !== undefined && (
                                <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                                  {brandModelCounts[brand.id]}
                                </span>
                              )}
                             </div>
                             {selectedBrand?.id === brand.id && <ChevronRight className="w-5 h-5 ml-2 text-primary" />}
                           </button>
                         ))}
                       </div>
                     </div>
                   ))}
                   {groupedBrands.letters.length === 0 && brandSearch && (
                      <div className="text-center py-10 text-muted-foreground">
                        No brands found matching "{brandSearch}"
                      </div>
                   )}
                 </>
               )}
            </div>
            
            {/* Mobile Footer with Count */}
            <div className="p-4 border-t border-border bg-background">
              <Button
                onClick={() => setBrandDialogOpen(false)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 rounded-xl"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
          <DialogContent hideCloseButton className="w-full h-[100dvh] sm:h-[85vh] p-0 flex flex-col">
            <div className="relative shrink-0 border-b border-border bg-muted/30 flex items-center gap-3">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModelDialogOpen(false)
                      setBrandDialogOpen(true)
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-secondary p-2 text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col">
                    <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">Select Model</DialogTitle>
                    {selectedBrand && <span className="text-xs text-muted-foreground">{selectedBrand.name}</span>}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModelDialogOpen(false)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </Button>
              </div>
            </div>
            
            <div className="p-4 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   value={modelSearch}
                   onChange={(e) => setModelSearch(e.target.value)}
                   placeholder="Search model..." 
                  className="bg-secondary border border-border pl-9 h-11 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary text-base"
                 />
                 {modelSearch && (
                    <button 
                      onClick={() => setModelSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 )}
               </div>
            </div>

            {!modelSearch && (
                          <div className="px-2 py-2 border-b border-border bg-background/95 backdrop-blur overflow-x-auto scrollbar-hide flex gap-1 shrink-0">
                 <button 
                   onClick={() => handleSelectModel(null)}
                   className={cn(
                     "px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                     !selectedModel ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                   )}
                 >
                   ALL
                 </button>
                 {groupedModels.letters.map(letter => (
                   <button
                     key={letter}
                     onClick={() => scrollToLetter(letter, modelSectionRefs)}
                     className="w-8 py-1.5 text-xs font-bold rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                   >
                     {letter}
                   </button>
                 ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 scroll-smooth scrollbar-hide bg-background">
              {modelsLoading ? (
                 <div className="flex justify-center py-10"><Spinner className="text-muted-foreground" /></div>
              ) : (
                <>
                  {!modelSearch && (
                    <button
                        onClick={() => handleSelectModel(null)}
                        className="w-full flex items-center p-3 rounded-xl bg-card hover:bg-accent text-left mb-3 group border border-border hover:border-primary/40 transition-all duration-200"
                     >
                       <span className="font-medium text-foreground/80 group-hover:text-foreground">All models</span>
                       {!selectedModel && <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />}
                     </button>
                  )}

                         {groupedModels.letters.map(letter => (
                        <div key={letter} ref={el => { modelSectionRefs.current[letter] = el }} className="mb-4 scroll-mt-4">
                        <div className="text-xs font-bold text-primary mb-2 px-3">{letter}</div>
                        <div className="space-y-1">
                         {groupedModels.groups[letter].map(model => (
                           <button
                             key={model.id}
                             onClick={() => handleSelectModel(model)}
                             className={cn(
                               "w-full flex items-center p-3 rounded-xl bg-card hover:bg-accent text-left transition-all duration-200 border border-border hover:border-primary/40 active:scale-[0.99]",
                               selectedModel?.id === model.id && "border-primary/70 bg-accent shadow-lg shadow-primary/25"
                             )}
                           >
                             <span className={cn("truncate flex-1 font-medium text-base", selectedModel?.id === model.id ? "text-foreground" : "text-muted-foreground")}>
                               {model.name}
                             </span>
                             {selectedModel?.id === model.id && <ChevronRight className="w-5 h-5 ml-2 text-primary" />}
                           </button>
                         ))}
                       </div>
                     </div>
                   ))}
                   {groupedModels.letters.length === 0 && modelSearch && (
                      <div className="text-center py-10 text-muted-foreground">
                        No models found matching "{modelSearch}"
                      </div>
                   )}
                </>
              )}
            </div>
            
            {/* Mobile Footer */}
            <div className="p-4 border-t border-border bg-background/95">
              <Button 
                onClick={() => setModelDialogOpen(false)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 rounded-xl"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedBrand && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price ($)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Enter price"
                value={priceFrom ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  setPriceFrom(
                    typeof value === 'number' && !Number.isNaN(value) ? value : undefined
                  )
                }}
                className="h-11 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Year
              </label>
              <Combobox
                options={yearsOptions.map((y) => ({ value: y, label: String(y) }))}
                value={year}
                onChange={(val) => {
                  const value = Number(val) || undefined
                  setYear(typeof value === 'number' && !Number.isNaN(value) ? value : undefined)
                }}
                placeholder="Any year"
                disabled={!selectedModel}
                className="rounded-xl"
                triggerClassName="h-11 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground hover:bg-secondary/80"
              />
            </div>
          </div>
        )}

      </div>

      <div className="mt-8">
        <Button
          className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold h-14 rounded-xl text-lg transition-all shadow-lg active:scale-[0.99] disabled:opacity-70 disabled:scale-100"
          onClick={handleShowCars}
          disabled={carsLoading}
        >
          {carsLoading ? <Spinner size="sm" className="text-primary-foreground" /> : showButtonLabel}
        </Button>
      </div>
    </div>
  )
}
