import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/store/auth'
import { createDealerCar, updateDealerCar, uploadDealerCarImages, getDealerCarEditData, deleteDealerCarImage } from '@/api/dealer'
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
import { Plus, X, Upload, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Modification } from '@/types'
import { getErrorMessage } from '@/lib/utils'

const sellSchema = z.object({
  brand_id: z.number({ message: 'Please select a brand' }),
  model_id: z.number({ message: 'Please select a model' }),
  body_type_id: z.number({ message: 'Please select a body type' }),
  generation_id: z.number({ message: 'Please select a generation' }),
  modification_id: z.number({ message: 'Please select a modification' }),
  city_id: z.number({ message: 'Please select a city' }),
  color_id: z.number({ message: 'Please select a color' }),
  year: z.number({ message: 'Please select a year' }).min(1900).max(new Date().getFullYear() + 1),
  price: z.number({ message: 'Please enter the price' }).min(1),
  odometer: z.number({ message: 'Please enter the mileage' }).min(0),
  phone_numbers: z.array(z.string()).min(1, 'Please add at least one phone number'),
  trade_in: z.number().default(1),
  vin_code: z.string().optional().default(''),
  wheel: z.boolean(),
  crash: z.boolean().default(false),
  new: z.boolean().default(false),
  owners: z.number().optional(),
  description: z.string().optional(),
})

type SellFormData = z.infer<typeof sellSchema>

type DealerSellProps = {
  editId?: string | null
  onSuccess?: () => void
}

export function DealerSell(props: DealerSellProps = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = props.editId ?? searchParams.get('editId')
  const { isAuthenticated, openAuthModal } = useAuth()
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      openAuthModal()
    }
  }, [isAuthenticated, navigate, openAuthModal])

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
  const isNew = useWatch({ control: form.control, name: 'new' })
  const isCrash = useWatch({ control: form.control, name: 'crash' })

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
    queryFn: () => (brandId && modelId && year && bodyTypeId ? getGenerationsByModel(brandId, modelId, year, bodyTypeId, wheel) : Promise.resolve([])),
    enabled: !!brandId && !!modelId && !!year && !!bodyTypeId && wheel !== undefined,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  // Prefetch generations
  useEffect(() => {
    if (brandId && modelId && year && wheel !== undefined && bodyTypes.length > 0) {
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
  }, [brandId, modelId, year, wheel, bodyTypes, queryClient])

  // State for generation selection by name
  const [selectedGenerationName, setSelectedGenerationName] = useState<string>('')

  // Sync selectedGenerationName
  useEffect(() => {
    if (generationId && generations.length > 0) {
      const gen = generations.find((g) => g.id === generationId)
      if (gen) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedGenerationName(gen.name)
      }
    } else if (!generationId) {
        setSelectedGenerationName('')
    }
  }, [generationId, generations])

  // Group generations
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

  // Get modifications
  const modifications = useMemo(() => {
    if (!selectedGenerationName) return []
    const mods = generations
      .filter((g) => g.name === selectedGenerationName)
      .flatMap((g) => g.modifications || [])
    const uniqueMods = new Map()
    mods.forEach((m) => uniqueMods.set(m.id, m))
    return Array.from(uniqueMods.values())
  }, [generations, selectedGenerationName])

  const handleGenerationChange = (name: string) => {
    setSelectedGenerationName(name)
    form.setValue('generation_id', undefined as unknown as number, { shouldDirty: true })
    form.setValue('modification_id', undefined as unknown as number, { shouldDirty: true })
  }

  const handleModificationChange = (modId: number) => {
    form.setValue('modification_id', modId, { shouldDirty: true })
    const ownerGen = generations.find((g) => 
      g.name === selectedGenerationName && 
      g.modifications?.some((m) => m.id === modId)
    )
    if (ownerGen) {
      form.setValue('generation_id', ownerGen.id, { shouldDirty: true })
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

  // Fetch edit data (DEALER ONLY)
  const { data: editData } = useQuery({
    queryKey: ['dealer-car', editId],
    queryFn: () => getDealerCarEditData(Number(editId)),
    enabled: !!editId,
  })

  // Populate form
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
        new: d.new,
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

      setPhoneNumbers(d.phone_numbers || [''])
      
      // Set generation name if available
      const genName = d.generation?.name || (typeof d.generation === 'string' ? d.generation : null)
      if (genName) {
        setSelectedGenerationName(genName)
      }
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
           if (found) form.setValue(fieldName, found.id)
        }
      }
    }

    resolveId('brand_id', d.brand, brands)
    resolveId('city_id', d.city, cities)
    resolveId('color_id', d.color, colors)
    resolveId('model_id', d.model, models)
    resolveId('body_type_id', d.body_type, bodyTypes)

    const genName = d.generation?.name || (typeof d.generation === 'string' ? d.generation : null)
    if (genName && generations.length > 0) {
      if (generations.some((g) => g.name === genName)) {
        if (selectedGenerationName !== genName) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedGenerationName(genName)
        }
      }
    }
    
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
                setSelectedGenerationName(foundGenName)
             }
             if (foundModId && foundModId !== currentModId) {
                form.setValue('modification_id', foundModId)
             }
          }
       } else if (modValue && !currentModId) {
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

  // Create car mutation (DEALER)
  const createMutation = useMutation({
    mutationFn: createDealerCar,
    onSuccess: async (result) => {
      toast.success('Car listing created successfully!')
      if (images.length > 0) {
        try {
          await uploadDealerCarImages(result.id, images)
          toast.success('Images uploaded successfully!')
        } catch (err: unknown) {
          console.error('Failed to upload images:', err)
          toast.error(getErrorMessage(err, 'Failed to upload images'))
        }
      }
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })

      if (props.onSuccess) {
        props.onSuccess()
      } else {
        navigate('/biz/dealer/garage')
      }
    },
    onError: (error: unknown) => {
      console.error('Create car error:', error)
      const msg = getErrorMessage(error, 'Failed to create listing')
      setError(msg)
      toast.error(msg)
    },
  })

  // Update car mutation (DEALER)
  const updateMutation = useMutation({
    mutationFn: updateDealerCar,
    onSuccess: async (_, variables) => {
      toast.success('Car listing updated successfully!')
      if (images.length > 0) {
        try {
          await uploadDealerCarImages(variables.id, images)
          toast.success('New images uploaded successfully!')
        } catch (err: unknown) {
          console.error('Failed to upload images:', err)
          toast.error(getErrorMessage(err, 'Failed to upload images'))
        }
      }
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })

      if (props.onSuccess) {
        props.onSuccess()
      } else {
        navigate('/biz/dealer/garage')
      }
    },
    onError: (error: unknown) => {
      console.error('Update car error:', error)
      const msg = getErrorMessage(error, 'Failed to update listing')
      setError(msg)
      toast.error(msg)
    },
  })

  // Delete image mutation (DEALER)
  const deleteImageMutation = useMutation({
    mutationFn: ({ carId, imageUrl }: { carId: number; imageUrl: string }) =>
      deleteDealerCarImage(carId, imageUrl),
    onSuccess: (_, variables) => {
      setExistingImages((prev) => prev.filter((img) => img !== variables.imageUrl))
      toast.success('Image deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-drafts'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-cars-active'] })
    },
    onError: (error: unknown) => {
      console.error('Delete image error:', error)
      toast.error(getErrorMessage(error, 'Failed to delete image'))
    },
  })

  // Reset effects
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

  const removeExistingImage = async (imageUrl: string) => {
    if (editId) {
      if (window.confirm('Are you sure you want to delete this image?')) {
        let path = imageUrl
        if (imageUrl.startsWith('http')) {
          const url = new URL(imageUrl)
          path = url.pathname
        }
        deleteImageMutation.mutate({ carId: Number(editId), imageUrl: path })
      }
    }
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
    form.setValue('phone_numbers', newPhones.filter((p) => p.trim()), { shouldDirty: true })
  }

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      const newPhones = phoneNumbers.filter((_, i) => i !== index)
      setPhoneNumbers(newPhones)
      form.setValue('phone_numbers', newPhones.filter((p) => p.trim()), { shouldDirty: true })
    }
  }

  const onSubmit = (data: SellFormData) => {
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { generation_id, ...rest } = data

    // Find modification to get technical specs
    const selectedMod = modifications.find(m => m.id === data.modification_id)
    const technicalSpecs = selectedMod ? {
       transmission_id: selectedMod.transmission_id,
       drivetrain_id: selectedMod.drivetrain_id,
       engine_id: selectedMod.engine_id,
       fuel_type_id: selectedMod.fuel_type_id,
    } : {}

    // Ensure generation_id is sent. If missing in data, try to get from modification (though DealerSell structure might not have _genId on mod, we rely on data.generation_id or find it)
    // In DealerSell, generation_id is managed via form state, so data.generation_id should be present.
    // But we need to include it in payload.
    const genId = data.generation_id

    if (editId) {
      const payload = {
        ...rest,
        ...technicalSpecs,
        generation_id: genId,
        id: Number(editId),
        phone_numbers: phoneNumbers.filter((p) => p.trim()),
        owners: typeof rest.owners === 'number' && !isNaN(rest.owners) ? rest.owners : 1
      }
      updateMutation.mutate(payload)
    } else {
      const payload = {
        ...rest,
        ...technicalSpecs,
        generation_id: genId,
        crash: rest.crash || false,
        new: rest.new || false,
        owners: rest.owners || 1,
        phone_numbers: phoneNumbers.filter((p) => p.trim()),
      }
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {editId ? 'Edit Dealer Listing' : 'Add Dealer Car'}
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
        {/* Photos */}
        <Card className="border-2 border-dashed border-border/60">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Add up to 10 photos. First photo will be the main one.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {/* Existing Images */}
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

                {/* New Images */}
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

                {existingImages.length + images.length < 10 && (
                  <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground font-medium">Add photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </CardContent>
        </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Enter the core specifications of your vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Combobox
                    options={brands.map((b) => ({ value: b.id, label: b.name, image: getImageUrl(b.logo) }))}
                    value={brandId}
                    onChange={(val) => form.setValue('brand_id', Number(val), { shouldDirty: true })}
                  />
                  {form.formState.errors.brand_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.brand_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Combobox
                    options={models.map((m) => ({ value: m.id, label: m.name }))}
                    value={modelId}
                    onChange={(val) => form.setValue('model_id', Number(val), { shouldDirty: true })}
                    disabled={!brandId}
                  />
                  {form.formState.errors.model_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.model_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Combobox
                    options={years.map((y) => ({ value: y, label: String(y) }))}
                    value={year}
                    onChange={(val) => form.setValue('year', Number(val), { shouldDirty: true })}
                    disabled={!modelId}
                  />
                  {form.formState.errors.year && (
                    <p className="text-sm text-destructive">{form.formState.errors.year.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Steering Wheel *</Label>
                  <div className="flex gap-4">
                     <Button
                        type="button"
                        variant={wheel === true ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => form.setValue('wheel', true, { shouldDirty: true })}
                     >
                        Left
                     </Button>
                     <Button
                        type="button"
                        variant={wheel === false ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => form.setValue('wheel', false, { shouldDirty: true })}
                     >
                        Right
                     </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Body Type *</Label>
                   <Combobox
                        options={bodyTypes.map((bt) => ({ value: bt.id, label: bt.name }))}
                        value={bodyTypeId}
                        onChange={(val) => form.setValue('body_type_id', Number(val), { shouldDirty: true })}
                        disabled={!year}
                     />
                  {form.formState.errors.body_type_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.body_type_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Generation *</Label>
                   <Combobox
                        options={uniqueGenerationOptions}
                        value={selectedGenerationName} 
                        onChange={(val) => handleGenerationChange(String(val))} 
                        disabled={!bodyTypeId}
                     />
                  {form.formState.errors.generation_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.generation_id.message}</p>
                  )}
                </div>
              </div>

               <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                    <Label>Modification *</Label>
                    <div className="grid grid-cols-1 gap-2">
                          {modifications.map((mod) => (
                             <div 
                                key={mod.id}
                                className={`p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors ${modificationId === mod.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                                onClick={() => handleModificationChange(mod.id)}
                             >
                                <div className="font-medium">{mod.engine || 'Unknown Engine'} {mod.fuel_type}</div>
                                <div className="text-sm text-muted-foreground">
                                   {mod.transmission} • {mod.drivetrain} • {mod.horse_power ? `${mod.horse_power} hp` : ''}
                                </div>
                             </div>
                          ))}
                          {modifications.length === 0 && selectedGenerationName && (
                             <p className="text-sm text-muted-foreground">No modifications found.</p>
                          )}
                       </div>
                     {form.formState.errors.modification_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.modification_id.message}</p>
                  )}
                 </div>
               </div>

            </CardContent>
          </Card>

          {/* Details & Price */}
          <Card>
            <CardHeader>
              <CardTitle>Details & Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label>City *</Label>
                     <Combobox
                        options={cities.map((c) => ({ value: c.id, label: c.name }))}
                        value={cityId}
                        onChange={(val) => form.setValue('city_id', Number(val), { shouldDirty: true })}
                     />
                     {form.formState.errors.city_id && (
                        <p className="text-sm text-destructive">{form.formState.errors.city_id.message}</p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <Label>Color *</Label>
                     <Combobox
                        options={colors.map((c) => ({ value: c.id, label: c.name }))}
                        value={colorId}
                        onChange={(val) => form.setValue('color_id', Number(val), { shouldDirty: true })}
                     />
                     {form.formState.errors.color_id && (
                        <p className="text-sm text-destructive">{form.formState.errors.color_id.message}</p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <Label>Mileage (km) *</Label>
                     <Input
                        type="number"
                        {...form.register('odometer', { valueAsNumber: true })}
                     />
                     {form.formState.errors.odometer && (
                        <p className="text-sm text-destructive">{form.formState.errors.odometer.message}</p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <Label>Price (USD) *</Label>
                     <Input
                        type="number"
                        {...form.register('price', { valueAsNumber: true })}
                     />
                     {form.formState.errors.price && (
                        <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                     )}
                  </div>
              </div>
              
              <div className="space-y-2">
                 <Label>VIN Code</Label>
                 <Input
                    {...form.register('vin_code')}
                    className="uppercase"
                    maxLength={17}
                    disabled={!!editId}
                 />
                 {form.formState.errors.vin_code && (
                    <p className="text-sm text-destructive">{form.formState.errors.vin_code.message}</p>
                 )}
                 {editId && (
                   <p className="text-xs text-muted-foreground">VIN cannot be edited after creation</p>
                 )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Combobox
                    options={[
                      { value: 'new', label: 'New' },
                      { value: 'used', label: 'Used' },
                    ]}
                    value={isNew ? 'new' : 'used'}
                    onChange={(val) => form.setValue('new', String(val) === 'new', { shouldDirty: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accident</Label>
                  <Combobox
                    options={[
                      { value: 'no', label: 'No' },
                      { value: 'yes', label: 'Yes' },
                    ]}
                    value={isCrash ? 'yes' : 'no'}
                    onChange={(val) => form.setValue('crash', String(val) === 'yes', { shouldDirty: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trade-in</Label>
                  <Combobox
                    options={[
                      { value: 0, label: 'No exchange' },
                      { value: 1, label: 'Trade-in option' },
                      { value: 2, label: 'Equal value' },
                      { value: 3, label: 'More expensive' },
                      { value: 4, label: 'Cheaper' },
                      { value: 5, label: 'Not a car' },
                    ]}
                    value={tradeIn}
                    onChange={(val) => form.setValue('trade_in', Number(val), { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <Label>Description</Label>
                 <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     rows={5}
                     {...form.register('description')}
                  />
               </div>

              

            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
             <CardHeader>
                <CardTitle>Contact Information</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                   <Label>Phone Numbers *</Label>
                   {phoneNumbers.map((phone, index) => (
                      <div key={index} className="flex gap-2">
                         <Input
                            value={phone}
                            onChange={(e) => updatePhoneNumber(index, e.target.value)}
                         />
                         {phoneNumbers.length > 1 && (
                            <Button
                               type="button"
                               variant="ghost"
                               size="icon"
                               onClick={() => removePhoneNumber(index)}
                            >
                               <X className="h-4 w-4" />
                            </Button>
                         )}
                      </div>
                   ))}
                   {phoneNumbers.length < 3 && (
                      <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={addPhoneNumber}
                         className="mt-2"
                         >
                         <Plus className="h-4 w-4 mr-2" />
                         Add Phone Number
                      </Button>
                   )}
                   {form.formState.errors.phone_numbers && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone_numbers.message}</p>
                   )}
                </div>
             </CardContent>
          </Card>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {editId ? 'Save Changes' : 'Create Listing'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
