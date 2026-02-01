import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/store/auth'
import { createCar, updateCar, uploadCarImages, getCarEditData, deleteCarImage, getPriceRecommendation } from '@/api/cars'
import { getImageUrl } from '@/api/client'
import {
  getBrands,
  getModelsByBrand,
  getGenerationsByModel,
  getCities,
  getColors,
  getYearsForModel,
  getBodyTypesForModel,
} from '@/api/references'
import type { Modification } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Upload, AlertCircle, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { compressImage } from '@/utils/imageCompression'

const sellSchema = z.object({
  brand_id: z.number({ message: 'Select brand' }),
  model_id: z.number({ message: 'Select model' }),
  body_type_id: z.number({ message: 'Select body type' }),
  generation_id: z.number({ message: 'Select generation' }),
  modification_id: z.number({ message: 'Select modification' }),
  city_id: z.number({ message: 'Select city' }),
  color_id: z.number({ message: 'Select color' }),
  year: z.number({ message: 'Select year' }).min(1900).max(new Date().getFullYear() + 1),
  price: z.number({ message: 'Enter price' }).min(1, 'Price must be greater than 0'),
  odometer: z.number({ message: 'Enter mileage' }).min(0),
  phone_numbers: z.array(z.string()).min(1, 'Enter at least one phone number'),
  trade_in: z.number().default(1),
  vin_code: z.string().min(1, 'Enter VIN code'),
  wheel: z.boolean(),
  crash: z.boolean().default(false),
  new: z.boolean().default(false),
  owners: z.number().optional(),
  description: z.string().optional(),
})

type SellFormData = z.infer<typeof sellSchema>

type UserSellProps = {
  editId?: string | null
}

export function UserSell(props: UserSellProps = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = props.editId ?? searchParams.get('editId')
  const { isAuthenticated, openAuthModal } = useAuth()
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [pendingDeleteImages, setPendingDeleteImages] = useState<string[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)

  const TRADE_IN_OPTIONS = [
    { value: 1, label: 'No exchange' },
    { value: 2, label: 'Equal value' },
    { value: 3, label: 'With surcharge' },
    { value: 4, label: 'Cheaper' },
    { value: 5, label: 'Not a car' },
  ]

  const form = useForm<SellFormData>({
    resolver: zodResolver(sellSchema) as unknown as Resolver<SellFormData>,
    defaultValues: {
      trade_in: 1,
      wheel: true,
      crash: false,
      new: false,
      phone_numbers: [''],
    },
  })

  const brandId = useWatch({ control: form.control, name: 'brand_id' })
  const modelId = useWatch({ control: form.control, name: 'model_id' })
  const generationId = useWatch({ control: form.control, name: 'generation_id' })
  const modificationId = useWatch({ control: form.control, name: 'modification_id' })
  const year = useWatch({ control: form.control, name: 'year' })
  const bodyTypeId = useWatch({ control: form.control, name: 'body_type_id' })
  const wheel = useWatch({ control: form.control, name: 'wheel' })
  const cityId = useWatch({ control: form.control, name: 'city_id' })
  const colorId = useWatch({ control: form.control, name: 'color_id' })
  const tradeIn = useWatch({ control: form.control, name: 'trade_in' })
  const odometer = useWatch({ control: form.control, name: 'odometer' })
  const isCrash = useWatch({ control: form.control, name: 'crash' })
  const owners = useWatch({ control: form.control, name: 'owners' })

  const { data: priceSuggestion, isLoading: priceLoading } = useQuery({
    queryKey: ['price-recommendation', brandId, modelId, year, odometer, generationId],
    queryFn: async () => {
      // Don't fetch if any required field is missing
      if (!brandId || !modelId || !year || !odometer) return null

      try {
        return await getPriceRecommendation({
          brand_id: brandId,
          model_id: modelId,
          year,
          odometer,
          generation_id: generationId,
        })
      } catch (err) {
        // Suppress 404 errors for price recommendation as it might not be available
        const is404 = (err as { response?: { status?: number } })?.response?.status === 404
        if (!is404) {
          console.error('Price recommendation error:', err)
        }
        return null
      }
    },
    enabled: !!brandId && !!modelId && !!year && odometer > 0,
    retry: false,
    staleTime: 60000,
  })
  const [, setInitializedFromEdit] = useState(false)
  const queryClient = useQueryClient()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      openAuthModal()
    }
  }, [isAuthenticated, navigate, openAuthModal])

  // Fetch reference data
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
  })

  const { data: models = [] } = useQuery({
    queryKey: ['models', brandId],
    queryFn: () => (brandId ? getModelsByBrand(brandId) : Promise.resolve([])),
    enabled: !!brandId,
  })

  const { data: years = [] } = useQuery({
    queryKey: ['years', brandId, modelId, wheel],
    queryFn: () => (brandId && modelId && wheel !== undefined ? getYearsForModel(brandId, modelId, wheel) : Promise.resolve([])),
    enabled: !!brandId && !!modelId && wheel !== undefined,
  })

  const { data: bodyTypes = [] } = useQuery({
    queryKey: ['bodyTypes', brandId, modelId, year, wheel],
    queryFn: () => (brandId && modelId && year && wheel !== undefined ? getBodyTypesForModel(brandId, modelId, year, wheel) : Promise.resolve([])),
    enabled: !!brandId && !!modelId && !!year && wheel !== undefined,
  })

  const { data: generations = [] } = useQuery({
    queryKey: ['generations', brandId, modelId, year, bodyTypeId, wheel],
    queryFn: () => (brandId && modelId && year && bodyTypeId && wheel !== undefined ? getGenerationsByModel(brandId, modelId, year, bodyTypeId, wheel) : Promise.resolve([])),
    enabled: !!brandId && !!modelId && !!year && !!bodyTypeId && wheel !== undefined,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  // Prefetch generations
  useEffect(() => {
    if (brandId && modelId && year && bodyTypes.length > 0 && wheel !== undefined) {
      bodyTypes.forEach((bt) => {
        if (bodyTypes.length <= 5) {
          queryClient.prefetchQuery({
            queryKey: ['generations', brandId, modelId, year, bt.id, wheel],
            queryFn: () => getGenerationsByModel(brandId, modelId, year, bt.id, wheel),
            staleTime: Infinity,
          })
        }
      })
    }
  }, [brandId, modelId, year, bodyTypes, wheel, queryClient])

  // State for generation selection by name
  const [selectedGenerationName, setSelectedGenerationName] = useState<string>('')

  // Derived modifications from selected generation name
  const modifications = useMemo(() => {
    if (!selectedGenerationName || generations.length === 0) return []
    
    // Find all generation entries with the selected name
    const matchingGenerations = generations.filter(g => g.name === selectedGenerationName)
    
    // Flatten modifications from all matching generations
    // Attach the source generation_id to each modification so we can set it correctly later
    const allMods: (Modification & { _genId: number })[] = []
    
    matchingGenerations.forEach(gen => {
      if (gen.modifications && gen.modifications.length > 0) {
        gen.modifications.forEach(mod => {
          allMods.push({ ...mod, _genId: gen.id })
        })
      }
    })
    
    return allMods
  }, [selectedGenerationName, generations])


  // Sync selectedGenerationName
  if (generationId && generations.length > 0) {
    const gen = generations.find((g) => g.id === generationId)
    if (gen && gen.name !== selectedGenerationName) {
      setSelectedGenerationName(gen.name)
    }
  } else if (selectedGenerationName) {
    // Only clear if the name is not found in the current list of generations
    // AND generations list is not empty (meaning we have loaded data but the name is invalid)
    if (generations.length > 0 && !generations.some(g => g.name === selectedGenerationName)) {
      setSelectedGenerationName('')
    }
  }

  // Group generations
  const uniqueGenerationOptions = useMemo(() => {
    const unique = new Map()
    generations.forEach((g) => {
      if (!unique.has(g.name)) {
        unique.set(g.name, { 
          id: g.id,
          value: g.name, 
          label: g.name,
          image: g.image ? getImageUrl(g.image) : undefined
        })
      }
    })
    return Array.from(unique.values())
  }, [generations])

  const handleGenerationChange = (_id: number, name: string) => {
    setSelectedGenerationName(name)
    // We don't set generation_id here anymore because it depends on the specific modification selected
    // (since one generation name can map to multiple generation IDs)
    form.setValue('generation_id', undefined as unknown as number, { shouldDirty: true })
    form.setValue('modification_id', undefined as unknown as number, { shouldDirty: true })
  }

  const handleModificationChange = (modId: number) => {
    form.setValue('modification_id', modId, { shouldDirty: true })

    // Find the modification and its source generation ID
    const mod = modifications.find(m => m.id === modId)
    
    if (mod) {
      // Set the correct generation_id associated with this modification
      if (mod._genId) {
        form.setValue('generation_id', mod._genId, { shouldDirty: true })
      }
    }
  }

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: colors = [] } = useQuery({
    queryKey: ['colors'],
    queryFn: getColors,
  })

  // Fetch edit data if in edit mode
  const { data: editData } = useQuery({
    queryKey: ['car', editId],
    queryFn: () => getCarEditData(Number(editId)),
    enabled: !!editId,
  })

  // Populate form with edit data
  useEffect(() => {
    if (editData) {
      const d = editData
      form.reset({
        brand_id: d.brand?.id,
        model_id: d.model?.id,
        body_type_id: d.body_type?.id,
        generation_id: d.generation?.id,
        modification_id: d.modification?.id,
        city_id: d.city?.id,
        color_id: d.color?.id,
        year: d.year,
        price: d.price,
        odometer: d.odometer,
        phone_numbers: d.phone_numbers,
        trade_in: d.trade_in ?? (d as { trade_id?: number }).trade_id ?? 0,
        vin_code: d.vin_code || '',
        wheel: d.wheel ?? true,
        crash: d.crash,
        new: false,
        owners: d.owners,
        description: d.description,
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
       setExistingImages((d.images || []).map(img => {
        if (typeof img === 'string') return img
        // Handle case where API might return objects
        // @ts-expect-error - Handling inconsistent API response types
        return img?.url || img?.path || img?.image || ''
      }).filter(Boolean))
      setPhoneNumbers(d.phone_numbers && d.phone_numbers.length > 0 ? d.phone_numbers : [''])
      
      // Set generation name if available
      if (d.generation?.name) {
        setSelectedGenerationName(d.generation.name)
      } else if (typeof d.generation === 'string') {
        setSelectedGenerationName(d.generation)
      }
      
      setInitializedFromEdit(true)
    }
  }, [editData, form])

  // Resolve reference IDs
  useEffect(() => {
    if (!editData) return
    const d = editData

    const resolveId = (
      fieldName: keyof SellFormData,
      value: { id?: number; name?: string } | string | null | undefined,
      list: { id: number; name: string }[]
    ) => {
      if (!value || list.length === 0) return
      const currentFormValue = form.getValues(fieldName)
      if (typeof value === 'string' && !currentFormValue) {
        const found = list.find((item) => item.name === value)
        if (found) form.setValue(fieldName, found.id)
      } else if (typeof value === 'object' && value.name) {
        const idInList = list.some((item) => item.id === value.id)
        if (!idInList) {
           const found = list.find((item) => item.name === value.name)
           if (found) {
             form.setValue(fieldName, found.id)
           }
        }
      }
    }

    resolveId('brand_id', d.brand, brands)
    resolveId('city_id', d.city, cities)
    resolveId('color_id', d.color, colors)
    resolveId('model_id', d.model, models)
    resolveId('body_type_id', d.body_type, bodyTypes)

    if (generations.length > 0) {
       const modValue = d.modification
       const currentModId = form.getValues('modification_id')
       
       // Check if current modification is visible in the filtered list
       const inFilteredList = modifications.some((m) => m.id === currentModId)
       
       if (!inFilteredList) {
          // Try to find the modification in ALL generations to recover correct generation selection
          let foundGenName = ''
          let foundModId = 0
          
          // Helper to check if a mod matches criteria
          type ModValue = number | string | { id?: number; engine?: string; fuel_type?: string; transmission?: string; drivetrain?: string } | null | undefined
          const isMatch = (m: Modification, val: ModValue) => {
             if (currentModId && m.id === currentModId) return true
             if (typeof val === 'number' && m.id === val) return true
             if (typeof val === 'string' && m.name === val) return true
             if (typeof val === 'object' && val) {
                if (val.id && m.id === val.id) return true
                if (val.engine && m.engine === val.engine && 
                    val.fuel_type === m.fuel_type && 
                    val.transmission === m.transmission && 
                    val.drivetrain === m.drivetrain) return true
             }
             return false
          }

          for (const gen of generations) {
             if (gen.modifications?.some(m => isMatch(m, modValue))) {
                foundGenName = gen.name
                const match = gen.modifications.find(m => isMatch(m, modValue))
                if (match) foundModId = match.id
                break
             }
          }

          if (foundGenName) {
             if (selectedGenerationName !== foundGenName) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedGenerationName(foundGenName)
             }
             if (foundModId && foundModId !== currentModId) {
                form.setValue('modification_id', foundModId)
             }
          }
       } else if (modValue && !currentModId) {
          // Standard resolution if not set but in list (e.g. matched by name)
          if (typeof modValue === 'string') {
             const found = modifications.find((m) => m.name === modValue)
             if (found) form.setValue('modification_id', found.id)
          } else if (typeof modValue === 'object') {
             const found = modifications.find((m) => 
                m.engine === modValue.engine &&
                m.fuel_type === modValue.fuel_type &&
                m.transmission === modValue.transmission &&
                m.drivetrain === modValue.drivetrain
             )
             if (found) form.setValue('modification_id', found.id)
          }
       }
    }
  }, [editData, brands, cities, colors, models, bodyTypes, generations, modifications, selectedGenerationName, form])

  // Create car mutation
  const createMutation = useMutation({
    mutationFn: createCar,
    onSuccess: async (result) => {
      let hasErrors = false
      if (images.length > 0) {
        try {
          setLoadingMessage('Optimizing images...')
          const compressedImages = await Promise.all(
            images.map(file => compressImage(file))
          )

          setLoadingMessage('Uploading images...')
          await uploadCarImages(result.id, compressedImages)
        } catch (err) {
          console.error('Failed to upload images:', err)
          toast.error('Failed to upload images')
          hasErrors = true
        }
      }

      if (!hasErrors) {
        toast.success('Car listing created successfully!')
      }
      setLoadingMessage(null)
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars-on-sale'] })
      queryClient.invalidateQueries({ queryKey: ['liked-cars'] })
      navigate(`/cars/${result.id}`)
    },
    onError: (error: unknown) => {
      console.error('Create car error:', error)
      const err = error as { response?: { data?: { message?: string | { ru?: string; en?: string; tk?: string } } } }
      let msg = err.response?.data?.message || (error as Error).message || 'Failed to create listing'
      
      if (typeof msg === 'object' && msg !== null) {
        msg = msg.ru || msg.en || msg.tk || JSON.stringify(msg)
      }
      
      setError(msg)
      toast.error(msg)
      setLoadingMessage(null)
    },
  })

  // Update car mutation
  const updateMutation = useMutation({
    mutationFn: updateCar,
    onSuccess: async (_, variables) => {
      let hasErrors = false
      if (images.length > 0) {
        try {
          setLoadingMessage('Optimizing images...')
          const compressedImages = await Promise.all(
            images.map(file => compressImage(file))
          )
          setLoadingMessage('Uploading new images...')
          await uploadCarImages(variables.id, compressedImages)
        } catch (err) {
          console.error('Update assets error:', err)
          toast.error('Failed to upload new images')
          hasErrors = true
        }
      }

      if (pendingDeleteImages.length > 0) {
        try {
          setLoadingMessage('Removing images...')
          await Promise.all(
            pendingDeleteImages.map((imageUrl) => {
              let path = imageUrl
              try {
                if (imageUrl.startsWith('http')) {
                  const url = new URL(imageUrl)
                  path = url.pathname
              }
            } catch {
              // ignore
            }
              return deleteCarImage(variables.id, path)
            })
          )
        } catch (err) {
          console.error('Delete image error:', err)
          toast.error('Failed to remove some images')
          hasErrors = true
        }
      }

      if (!hasErrors) {
        toast.success('Car listing updated successfully!')
      }
      
      setLoadingMessage(null)
      setPendingDeleteImages([])
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars'] })
      queryClient.invalidateQueries({ queryKey: ['my-cars-on-sale'] })
      queryClient.invalidateQueries({ queryKey: ['liked-cars'] })
      navigate(`/cars/${variables.id}`)
    },
    onError: (error: unknown) => {
      console.error('Update car error:', error)
      const err = error as { response?: { data?: { message?: string | { ru?: string; en?: string; tk?: string } } } }
      let msg = err.response?.data?.message || (error as Error).message || 'Failed to update listing'
        
      if (typeof msg === 'object' && msg !== null) {
        msg = msg.ru || msg.en || msg.tk || JSON.stringify(msg)
      }
      
      setError(msg)
      toast.error(msg)
      setLoadingMessage(null)
    },
  })

  // Resets
  useEffect(() => {
    if (brandId && form.formState.dirtyFields.brand_id) {
      form.setValue('model_id', undefined as unknown as number)
      form.setValue('year', undefined as unknown as number)
      form.setValue('body_type_id', undefined as unknown as number)
      form.setValue('generation_id', undefined as unknown as number)
      form.setValue('modification_id', undefined as unknown as number)
    }
  }, [brandId, form.formState.dirtyFields.brand_id, form])

  useEffect(() => {
    if (modelId && form.formState.dirtyFields.model_id) {
      form.setValue('year', undefined as unknown as number)
      form.setValue('body_type_id', undefined as unknown as number)
      form.setValue('generation_id', undefined as unknown as number)
      form.setValue('modification_id', undefined as unknown as number)
    }
  }, [modelId, form.formState.dirtyFields.model_id, form])

  useEffect(() => {
    if (wheel !== undefined && form.formState.dirtyFields.wheel) {
      form.setValue('year', undefined as unknown as number)
      form.setValue('body_type_id', undefined as unknown as number)
      form.setValue('generation_id', undefined as unknown as number)
      form.setValue('modification_id', undefined as unknown as number)
    }
  }, [wheel, form.formState.dirtyFields.wheel, form])

  useEffect(() => {
    if (year && form.formState.dirtyFields.year) {
      form.setValue('body_type_id', undefined as unknown as number)
      form.setValue('generation_id', undefined as unknown as number)
      form.setValue('modification_id', undefined as unknown as number)
    }
  }, [year, form.formState.dirtyFields.year, form])

  useEffect(() => {
    if (bodyTypeId && form.formState.dirtyFields.body_type_id) {
      form.setValue('generation_id', undefined as unknown as number)
      form.setValue('modification_id', undefined as unknown as number)
    }
  }, [bodyTypeId, form.formState.dirtyFields.body_type_id, form])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File is too large (max 10MB)`)
        return
      }
      const nameParts = file.name.split('.')
      const ext = nameParts.pop()?.toLowerCase()
      const allowedExts = ['jpg', 'jpeg', 'png']
      if (!ext || !allowedExts.includes(ext)) {
        errors.push(`${file.name}: Invalid file type (only JPG, JPEG, PNG allowed)`)
        return
      }
      validFiles.push(file)
    })

    if (errors.length > 0) {
      toast.error(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles].slice(0, 10 - existingImages.length))
    }
    
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageUrl: string) => {
    if (!editId) return
    console.log('[UserSell] removeExistingImage click', { editId, imageUrl })
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl))
    let path = imageUrl
    try {
      if (imageUrl.startsWith('http')) {
        const url = new URL(imageUrl)
        const pathname = url.pathname
        const imagesIndex = pathname.indexOf('/images/')
        path = imagesIndex !== -1 ? pathname.slice(imagesIndex) : pathname
      } else if (imageUrl.includes('/images/')) {
        const imagesIndex = imageUrl.indexOf('/images/')
        path = imageUrl.slice(imagesIndex)
      }
    } catch (error) {
      console.error('[UserSell] removeExistingImage URL parse error', { imageUrl, error })
    }
    console.log('[UserSell] removeExistingImage normalized path', { editId, imageUrl, path })
    setPendingDeleteImages((prev) => [...prev, path])
  }



  const addPhoneNumber = () => {
    if (phoneNumbers.length < 3) {
      setPhoneNumbers((prev) => [...prev, ''])
    }
  }

  const updatePhoneNumber = (index: number, value: string) => {
    const newPhones = [...phoneNumbers]
    newPhones[index] = value
    setPhoneNumbers(newPhones)
    form.setValue('phone_numbers', newPhones.filter((p) => p.trim()))
  }

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      const newPhones = phoneNumbers.filter((_, i) => i !== index)
      setPhoneNumbers(newPhones)
      form.setValue('phone_numbers', newPhones.filter((p) => p.trim()))
    }
  }

  const onSubmit = (data: SellFormData) => {
    setError(null)
    
    const validPhoneNumbers = data.phone_numbers.filter(p => p.trim())

    // Find the modification to get technical specs
    const selectedMod = modifications.find(m => m.id === data.modification_id)

    // If generation_id is missing but we have a modification, try to find the correct generation_id
    let generationId = data.generation_id
    if (!generationId && selectedMod && selectedMod._genId) {
      generationId = selectedMod._genId
    }

    // Extract technical specs from modification
    const technicalSpecs = selectedMod ? {
      transmission_id: selectedMod.transmission_id,
      drivetrain_id: selectedMod.drivetrain_id,
      engine_id: selectedMod.engine_id,
      fuel_type_id: selectedMod.fuel_type_id,
    } : {}

    if (editId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { body_type_id, vin_code, new: _ignoredNew, ...updateData } = data
      const payload = {
        ...updateData,
        ...technicalSpecs,
        generation_id: generationId,
        new: data.new || false,
        id: Number(editId),
        phone_numbers: validPhoneNumbers,
        owners: typeof data.owners === 'number' && !isNaN(data.owners) ? data.owners : 1,
      }
      updateMutation.mutate(payload)
    } else {
      const payload = {
        ...data,
        ...technicalSpecs,
        generation_id: generationId,
        crash: data.crash || false,
        new: data.new || false,
        owners: data.owners || 1,
        phone_numbers: validPhoneNumbers,
      }
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Sell your car</h1>

      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 sm:pb-0">
        <Button variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap">Passenger cars</Button>
        <Button variant="ghost" disabled className="text-muted-foreground opacity-50 cursor-not-allowed whitespace-nowrap">
          Special machinery 
          <span className="ml-2 text-[10px] bg-muted-foreground/20 px-1.5 py-0.5 rounded">Soon</span>
        </Button>
        <Button variant="ghost" disabled className="text-muted-foreground opacity-50 cursor-not-allowed whitespace-nowrap">
          Motorcycles 
          <span className="ml-2 text-[10px] bg-muted-foreground/20 px-1.5 py-0.5 rounded">Soon</span>
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* VIN */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">VIN or body number <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input 
              {...form.register('vin_code')} 
              placeholder="1MBG..." 
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
            {form.formState.errors.vin_code && (
              <span className="text-red-500 text-sm absolute -bottom-5 left-0">{form.formState.errors.vin_code.message}</span>
            )}
          </div>
        </div>

        {/* Brand */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Brand <span className="text-red-500">*</span></Label>
          <Combobox
            options={brands.map(b => ({ value: b.id, label: b.name }))}
            value={brandId}
            onChange={(val: string | number) => form.setValue('brand_id', val as number, { shouldDirty: true })}
            placeholder="Select brand"
            className="w-full"
            triggerClassName="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Model */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Model <span className="text-red-500">*</span></Label>
          <Combobox
            options={models.map(m => ({ value: m.id, label: m.name }))}
            value={modelId}
            onChange={(val: string | number) => form.setValue('model_id', val as number, { shouldDirty: true })}
            placeholder="Select model"
            disabled={!brandId}
            className="w-full"
            triggerClassName="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Steering Wheel */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Steering wheel <span className="text-red-500">*</span></Label>
          <div className="flex bg-muted p-1 rounded-md border border-input w-fit">
            <button
              type="button"
              onClick={() => form.setValue('wheel', true, { shouldDirty: true })}
              className={`px-6 py-2 rounded-sm text-sm transition-colors ${wheel === true ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => form.setValue('wheel', false, { shouldDirty: true })}
              className={`px-6 py-2 rounded-sm text-sm transition-colors ${wheel === false ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Right
            </button>
          </div>
        </div>

        {/* Year */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Year <span className="text-red-500">*</span></Label>
          <Combobox
            options={years.map(y => ({ value: y, label: y.toString() }))}
            value={year}
            onChange={(val: string | number) => form.setValue('year', val as number, { shouldDirty: true })}
            placeholder="Select year"
            disabled={!modelId}
            className="w-full"
            triggerClassName="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Body Type */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <Label className="text-muted-foreground pt-2">Body type <span className="text-red-500">*</span></Label>
          {year ? (
            bodyTypes.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {bodyTypes.map((bt) => (
                  <div
                    key={bt.id}
                    onClick={() => form.setValue('body_type_id', bt.id, { shouldDirty: true })}
                    className={`relative cursor-pointer flex flex-col items-center gap-2 p-4 rounded-lg transition-all border ${
                      bodyTypeId === bt.id 
                        ? 'bg-accent border-primary ring-1 ring-primary' 
                        : 'bg-card border-border hover:bg-accent/50 hover:border-accent-foreground/20'
                    }`}
                  >
                    {/* Assuming we might have icons later, for now just text */}
                    {bt.image && <img src={getImageUrl(bt.image)} alt={bt.name} className="w-12 h-8 object-contain opacity-80" />}
                    <span className="text-sm text-foreground">{bt.name}</span>
                    {bodyTypeId === bt.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-muted-foreground py-3 text-sm">No body types available for selected year</div>
            )
          ) : (
            <div className="text-muted-foreground py-3 text-sm">Select year first</div>
          )}
        </div>

        {/* Generation */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <Label className="text-muted-foreground pt-2">Generation</Label>
          {bodyTypeId ? (
            uniqueGenerationOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {uniqueGenerationOptions.map((gen) => (
                  <div
                    key={gen.value}
                    onClick={() => handleGenerationChange(gen.id, gen.value)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group border ${
                      selectedGenerationName === gen.value
                        ? 'bg-accent border-primary ring-1 ring-primary'
                        : 'bg-card border-border hover:bg-accent/50 hover:border-accent-foreground/20'
                    }`}
                  >
                    <div className="aspect-video bg-muted relative">
                      {gen.image ? (
                        <img src={gen.image} alt={gen.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Photo</div>
                      )}
                      {/* Gradient overlay for text readability - mostly for dark mode or dark images */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                    <div className="p-4 bg-card border-t border-border">
                      <div className="text-base font-medium text-foreground">{gen.label}</div>
                    </div>
                    {selectedGenerationName === gen.value && (
                      <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-muted-foreground py-3 text-sm">No generations available</div>
            )
          ) : (
             <div className="text-muted-foreground py-3 text-sm">Select body type first</div>
          )}
        </div>

        {/* Modification */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <Label className="text-muted-foreground pt-2">Modification</Label>
          {selectedGenerationName ? (
            modifications.length > 0 ? (
              <div className="flex flex-col gap-3 w-full">
                {modifications.map((mod) => {
                   // Construct detailed label
                   const details = [
                     mod.engine,
                     mod.fuel_type,
                     mod.transmission,
                     mod.drivetrain
                   ].filter(Boolean).join(', ')
                   
                   const label = details ? details : mod.name
  
                   return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleModificationChange(mod.id)}
                      className={`relative text-left px-6 py-3 rounded-full transition-all text-sm flex items-center justify-between border ${
                        modificationId === mod.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:bg-accent'
                      }`}
                    >
                      <span>{label}</span>
                      {modificationId === mod.id && (
                         <div className="w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center flex-shrink-0 ml-2">
                           <Check className="w-3 h-3 text-primary" />
                         </div>
                      )}
                    </button>
                   )
                })}
              </div>
            ) : (
               <div className="text-muted-foreground py-3 text-sm">No modifications available</div>
            )
          ) : (
             <div className="text-muted-foreground py-3 text-sm">Select generation first</div>
          )}
        </div>



        {/* Mileage */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Mileage <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input 
              type="number"
              {...form.register('odometer', { valueAsNumber: true })} 
              className="bg-background border-input text-foreground pr-10 focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">km</span>
          </div>
        </div>

        {/* Owners */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Number of owners <span className="text-red-500">*</span></Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => form.setValue('owners', num)}
                className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2 border ${
                  (owners || 1) === num
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                }`}
              >
                <span>{num === 4 ? '4+' : num === 1 ? 'One' : num === 2 ? 'Two' : 'Three'}</span>
                {(owners || 1) === num && (
                  <div className="w-4 h-4 rounded-full bg-primary-foreground flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accident */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Damaged / Accident</Label>
          <div className="flex bg-muted p-1 rounded-md border border-input w-fit">
             <button
                type="button"
                onClick={() => form.setValue('crash', true)}
                className={`px-6 py-2 rounded-sm text-sm transition-colors ${isCrash === true ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
                Yes
             </button>
             <button
                type="button"
                onClick={() => form.setValue('crash', false)}
                className={`px-6 py-2 rounded-sm text-sm transition-colors ${isCrash === false ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
                No
             </button>
          </div>
        </div>

        {/* Color */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">Color</Label>
          <Combobox
            options={colors.map(c => ({ value: c.id, label: c.name }))}
            value={colorId}
            onChange={(val: string | number) => form.setValue('color_id', val as number)}
            placeholder="Select color"
            className="w-full"
            triggerClassName="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring"
          />
        </div>




        {/* Price */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <Label className="text-muted-foreground pt-3">Price <span className="text-red-500">*</span></Label>
          <div className="flex flex-col gap-4 w-full">
            <div className="relative">
              <Input 
                type="number"
                {...form.register('price', { valueAsNumber: true })} 
                className="bg-background border-input text-foreground pr-12 focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">$</span>
            </div>
            
            <div className="flex justify-end">
              {priceLoading ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Spinner className="w-3 h-3" />
                  <span>Estimating price...</span>
                </div>
              ) : priceSuggestion && (
                <div className="text-xs text-muted-foreground">
                  Average price for this car: ${priceSuggestion.avg_price.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trade In */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
           <Label className="text-muted-foreground">Trade-in</Label>
           <Combobox
              options={TRADE_IN_OPTIONS}
              value={tradeIn}
              onChange={(val: string | number) => form.setValue('trade_in', val as number)}
              placeholder="Select trade-in option"
              className="w-full"
              triggerClassName="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring"
           />
        </div>




        {/* City */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <Label className="text-muted-foreground">City <span className="text-red-500">*</span></Label>
          <Combobox
            options={cities.map(c => ({ value: c.id, label: c.name }))}
            value={cityId}
            onChange={(val: string | number) => form.setValue('city_id', val as number)}
            placeholder="Select city"
            className="w-full"
            triggerClassName="bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <Label className="text-muted-foreground pt-3">Contacts <span className="text-red-500">*</span></Label>
          <div className="space-y-3">
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => updatePhoneNumber(index, e.target.value)}
                  placeholder="+993..."
                  className="bg-background border-input text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                />
                {phoneNumbers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removePhoneNumber(index)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {phoneNumbers.length < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={addPhoneNumber}
                className="text-sm border-input text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Plus className="h-4 w-4 mr-2" /> Add number
              </Button>
            )}
            {form.formState.errors.phone_numbers && (
               <p className="text-red-500 text-sm">{form.formState.errors.phone_numbers.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <Label className="text-muted-foreground pt-3">Description</Label>
          <Textarea
            {...form.register('description')}
            placeholder="Describe car condition, configuration, extra options..."
            className="min-h-[150px] bg-background border-input text-foreground placeholder:text-muted-foreground resize-y focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Photos & Videos */}
        <div className="pt-6 border-t border-border space-y-8">
          {/* Images Section */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Photos</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {existingImages.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square group">
                    <img
                      src={getImageUrl(imageUrl)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(imageUrl)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {images.map((file, index) => (
                  <div key={`new-${index}`} className="relative aspect-square group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {(existingImages.length + images.length) < 20 && (
                  <label className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            {isLoading ? <Spinner className="mr-2" /> : null}
            {loadingMessage ? loadingMessage : (editId ? 'Save changes' : 'Publish listing')}
          </Button>
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-900 rounded-lg flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

      </form>
    </div>
  )
}
