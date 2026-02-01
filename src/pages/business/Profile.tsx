import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { getProfile, getThirdPartyProfile, updateProfile, updateThirdPartyProfile, uploadAvatar, deleteAvatar, uploadBanner, deleteBanner, saveDestinations, getMyCarsOnSale, deleteAccount } from '@/api/profile'
import { getCountries, getCities } from '@/api/references'
import type { UpdateThirdPartyProfileRequest, SuccessResponse, Car as CarType, Destination } from '@/types'
import { getImageUrl } from '@/api/client'
import { useAuth } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { User, Mail, Phone, Plus, Camera, Trash2, X, MapPin, Image as ImageIcon, Info, CheckCircle2, Settings, ChevronRight, Car, ChevronDown, Globe } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CarCard } from '@/components/cars/CarCard'
import { SOCIAL_NETWORKS } from '@/lib/social-icons'

import { cn, getErrorMessage } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(20, 'Name must be at most 20 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  about_us: z.string().optional(),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  city_id: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function BusinessProfile() {
  const navigate = useNavigate()
  const { isAuthenticated, refreshUser, logout, openAuthModal } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now())
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)

  const [bannerError, setBannerError] = useState(false)
  const [bannerVersion, setBannerVersion] = useState(() => Date.now())
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string | null>(null)
  
  // Contacts state
  const [contacts, setContacts] = useState<Record<string, string>>({})
  const [newContactKey, setNewContactKey] = useState('')
  const [newContactValue, setNewContactValue] = useState('')
  const [isAddingContact, setIsAddingContact] = useState(false)

  // Destinations state
  const [isAddingDestination, setIsAddingDestination] = useState(false)
  const [fromCountryId, setFromCountryId] = useState<string>('')
  const [toCountryId, setToCountryId] = useState<string>('')
  const [localDestinations, setLocalDestinations] = useState<Destination[]>([])
  
  const [showDetails, setShowDetails] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      openAuthModal()
    }
  }, [isAuthenticated, navigate, openAuthModal])

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: thirdPartyProfile, isLoading: thirdPartyLoading } = useQuery({
    queryKey: ['third-party-profile'],
    queryFn: getThirdPartyProfile,
  })

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const { data: carsData, isLoading: carsLoading } = useQuery({
    queryKey: ['my-cars-on-sale'],
    queryFn: () => getMyCarsOnSale({ limit: 100 }),
  })

  const inventoryCount = carsData?.total ?? carsData?.items?.length ?? 0

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      refreshUser()
    },
    onError: (error: unknown) => {
      console.error('Update profile error:', error)
      toast.error(getErrorMessage(error, 'Failed to update profile'))
    }
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      refreshUser()
      setAvatarVersion(Date.now())
    },
    onError: (error: unknown) => {
      console.error('Upload avatar error:', error)
      toast.error(getErrorMessage(error, 'Failed to upload avatar'))
    }
  })

  const uploadBannerMutation = useMutation({
    mutationFn: uploadBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      setBannerVersion(Date.now())
    },
    onError: (error: unknown) => {
      toast.error(`Upload failed: ${getErrorMessage(error, 'Failed to upload banner')}`)
    }
  })

  const deleteBannerMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      setBannerVersion(Date.now())
      toast.success('Banner removed successfully')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to remove banner'))
    }
  })

  const updateThirdPartyMutation = useMutation<SuccessResponse, Error, UpdateThirdPartyProfileRequest>({
    mutationFn: updateThirdPartyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
    }
  })

  const deleteAvatarMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      refreshUser()
      setAvatarVersion(Date.now())
      toast.success('Avatar removed successfully')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to remove avatar'))
    }
  })

  const saveDestinationsMutation = useMutation({
    mutationFn: (destinations: { from_id: number; to_id: number }[]) => 
      saveDestinations(destinations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      setFromCountryId('')
      setToCountryId('')
      setIsAddingDestination(false)
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to save destinations'))
    }
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('Profile is not loaded')
      }
      return deleteAccount(profile.id)
    },
    onSuccess: () => {
      toast.success('Account deleted successfully')
      logout()
      navigate('/')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete account'))
    }
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    },
  })
  
  useEffect(() => {
    if (!profile) return

    let lat = ''
    let lng = ''
    if (thirdPartyProfile?.coordinates) {
      const parts = thirdPartyProfile.coordinates.split(',')
      if (parts.length === 2) {
        lat = parts[0].trim()
        lng = parts[1].trim()
      }
    }

    form.reset({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      about_us: thirdPartyProfile?.about_us || '',
      address: thirdPartyProfile?.address || '',
      latitude: lat,
      longitude: lng,
      city_id: profile.city?.id?.toString() || '',
    })
  }, [profile, thirdPartyProfile, form])

  const mergedContacts = useMemo(
    () => thirdPartyProfile?.contacts || profile?.contacts || {},
    [thirdPartyProfile?.contacts, profile?.contacts]
  )
  const mergedDestinations = useMemo(
    () => thirdPartyProfile?.destinations || [],
    [thirdPartyProfile?.destinations]
  )

  useEffect(() => {
    setContacts(mergedContacts)
  }, [mergedContacts])

  useEffect(() => {
    setLocalDestinations(mergedDestinations)
  }, [mergedDestinations])

  const handleDeleteAccount = async () => {
    if (!profile?.id) {
      toast.error('Profile is not loaded yet')
      return
    }

    const confirmed = window.confirm(
      'Delete your account? This action cannot be undone.'
    )
    if (!confirmed) return

    await deleteAccountMutation.mutateAsync()
  }

  const handleSubmit = async (data: ProfileFormData) => {
    if ((data.latitude && !data.longitude) || (!data.latitude && data.longitude)) {
      toast.error('Please provide both latitude and longitude or neither')
      return
    }

    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude)
      const lng = parseFloat(data.longitude)
      if (isNaN(lat) || isNaN(lng)) {
        toast.error('Latitude and Longitude must be valid numbers')
        return
      }
    }

    const toastId = toast.loading('Saving changes...')
    try {
      if (selectedAvatarFile) {
        await uploadAvatarMutation.mutateAsync(selectedAvatarFile)
      }

      if (selectedBannerFile) {
        await uploadBannerMutation.mutateAsync(selectedBannerFile)
      }

      await updateMutation.mutateAsync({
        username: data.name,
        email: data.email || undefined,
        phone_number: data.phone || undefined,
        city_id: data.city_id ? parseInt(data.city_id) : undefined,
      })

      let coordinates = undefined
      if (data.latitude && data.longitude) {
        coordinates = `${data.latitude},${data.longitude}`
      }

      await updateThirdPartyMutation.mutateAsync({
        username: data.name,
        about_us: data.about_us || undefined,
        address: data.address || undefined,
        contacts: contacts,
        phone: data.phone || undefined,
        coordinates: coordinates,
      })

      // Handle destinations sync (Logist only)
      if (thirdPartyProfile?.role_id === 3) {
        const destinationsPayload = localDestinations.map(d => ({
          from_id: d.from_country.id,
          to_id: d.to_country.id
        }))
        
        await saveDestinationsMutation.mutateAsync(destinationsPayload)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      ])

      toast.success('Profile updated successfully', { id: toastId })
      setIsEditing(false)
      
      // Reset files
      setSelectedAvatarFile(null)
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl)
        setPreviewAvatarUrl(null)
      }
      setSelectedBannerFile(null)
      if (previewBannerUrl) {
        URL.revokeObjectURL(previewBannerUrl)
        setPreviewBannerUrl(null)
      }
    } catch (error: unknown) {
      console.error('Save error:', error)
      toast.error(getErrorMessage(error, 'Failed to save changes'), { id: toastId })
    }
  }

  const addContact = () => {
    if (!newContactKey.trim() || !newContactValue.trim()) return
    setContacts(prev => ({
      ...prev,
      [newContactKey.trim()]: newContactValue.trim()
    }))
    setNewContactKey('')
    setNewContactValue('')
    setIsAddingContact(false)
  }

  const removeContact = (key: string) => {
    setContacts(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl)
      }
      setSelectedAvatarFile(file)
      setPreviewAvatarUrl(URL.createObjectURL(file))
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previewBannerUrl) {
        URL.revokeObjectURL(previewBannerUrl)
      }
      setSelectedBannerFile(file)
      setPreviewBannerUrl(URL.createObjectURL(file))
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSelectedAvatarFile(null)
    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl)
      setPreviewAvatarUrl(null)
    }
    setSelectedBannerFile(null)
    if (previewBannerUrl) {
      URL.revokeObjectURL(previewBannerUrl)
      setPreviewBannerUrl(null)
    }
    form.reset()
    setLocalDestinations(thirdPartyProfile?.destinations || [])
    setContacts(thirdPartyProfile?.contacts || profile?.contacts || {})
  }

  if (profileLoading || thirdPartyLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const getRoleLabel = () => {
    if (thirdPartyProfile?.company_type) return thirdPartyProfile.company_type
    const roleId = profile?.role_id
    switch (roleId) {
      case 2: return 'Dealer'
      case 3: return 'Logist'
      case 4: return 'Broker'
      case 5: return 'Tuning service'
      default: return 'User'
    }
  }

  const phones = profile?.phone ? [profile.phone] : []

  const socialLinks = Object.entries(contacts).length > 0 
    ? Object.entries(contacts).map(([key, value]) => {
        const network = SOCIAL_NETWORKS.find(n => n.value === key)
        return {
          key,
          value,
          network
        }
      }).filter((link): link is { key: string, value: string, network: NonNullable<typeof link.network> } => !!link.network)
    : []

  const businessCityName = (thirdPartyProfile as unknown as { city?: { name?: string } } | null)?.city?.name 
    || profile?.city?.name

  const registeredDate = thirdPartyProfile?.registered ? new Date(thirdPartyProfile.registered) : null
  const memberSinceLabel = registeredDate 
    ? registeredDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }) 
    : null

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Edit Profile
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Banner Upload in Edit Mode */}
                  <div className="space-y-2">
                    <Label>Profile Banner</Label>
                    <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      {(previewBannerUrl || (thirdPartyProfile?.banner && !bannerError)) ? (
                        <img
                          src={previewBannerUrl || (thirdPartyProfile?.banner ? `${getImageUrl(thirdPartyProfile.banner)}?v=${bannerVersion}` : '')}
                          alt="Banner"
                          className="w-full h-full object-cover"
                          onError={() => {
                            if (!previewBannerUrl) setBannerError(true)
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-xs">Upload Banner</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('banner-upload')?.click()}
                        disabled={form.formState.isSubmitting}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {(previewBannerUrl || (thirdPartyProfile?.banner && !bannerError)) ? 'Change Banner' : 'Upload Banner'}
                      </Button>
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerChange}
                        disabled={form.formState.isSubmitting}
                      />

                      {(thirdPartyProfile?.banner && !previewBannerUrl && !bannerError) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteBannerMutation.mutate()}
                          disabled={deleteBannerMutation.isPending || form.formState.isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}

                      {previewBannerUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (previewBannerUrl) {
                              URL.revokeObjectURL(previewBannerUrl)
                              setPreviewBannerUrl(null)
                            }
                            setSelectedBannerFile(null)
                          }}
                        >
                          Undo
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Avatar Upload in Edit Mode */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {(previewAvatarUrl || (thirdPartyProfile?.avatar && !avatarError)) ? (
                        <img
                          src={previewAvatarUrl || (thirdPartyProfile?.avatar ? `${getImageUrl(thirdPartyProfile.avatar)}?v=${avatarVersion}` : '')}
                          alt={profile?.name}
                          className="w-20 h-20 rounded-full object-cover"
                          onError={() => {
                            if (!previewAvatarUrl) setAvatarError(true)
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-10 w-10 text-primary" />
                        </div>
                      )}
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                          disabled={form.formState.isSubmitting}
                        />
                      </label>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">Profile Photo</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          disabled={form.formState.isSubmitting}
                        >
                          Change
                        </Button>
                        {thirdPartyProfile?.avatar && !previewAvatarUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteAvatarMutation.mutate()}
                            disabled={deleteAvatarMutation.isPending || form.formState.isSubmitting}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                        {previewAvatarUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              URL.revokeObjectURL(previewAvatarUrl)
                              setPreviewAvatarUrl(null)
                              setSelectedAvatarFile(null)
                            }}
                          >
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...form.register('name')} />
                        {form.formState.errors.name && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">Your display name on the platform.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">Used for notifications and login.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...form.register('phone')} />
                        <p className="text-xs text-muted-foreground">Main phone number for this account.</p>
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" {...form.register('address')} />
                        <p className="text-xs text-muted-foreground">Your physical location or office address.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city_id">City</Label>
                        <Select
                          id="city_id"
                          options={cities?.map(c => ({ value: c.id, label: c.name })) || []}
                          {...form.register('city_id')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          {...form.register('latitude')}
                        />
                        <p className="text-xs text-muted-foreground">GPS Latitude coordinate.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          {...form.register('longitude')}
                        />
                        <p className="text-xs text-muted-foreground">GPS Longitude coordinate.</p>
                      </div>

                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="about_us">About Us</Label>
                      <Textarea 
                        id="about_us" 
                        {...form.register('about_us')} 
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">Short description about your company or services.</p>
                    </div>

                    {/* Contacts Section */}
                    <div className="space-y-3 pt-2 border-t">
                      <Label>Social Networks & Contacts</Label>
                      
                      {Object.entries(contacts).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(contacts).map(([key, value]) => {
                            const social = SOCIAL_NETWORKS.find(n => n.value === key)
                            const Icon = social?.icon || Globe
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                  <div className="text-sm font-medium bg-muted/50 p-2 rounded border flex items-center gap-2">
                                    <Icon className={cn("h-4 w-4", social?.colorClass)} />
                                    {social?.label || key}
                                  </div>
                                  <div className="text-sm bg-muted/50 p-2 rounded border truncate">{value}</div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContact(key)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No additional contacts added</p>
                      )}

                      {isAddingContact ? (
                        <div className="flex flex-col md:flex-row items-end gap-2 p-3 border rounded-lg bg-muted/30">
                          <div className="space-y-2 flex-1 w-full">
                            <Label htmlFor="contact-key" className="text-xs">Service</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                  {newContactKey ? (
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const social = SOCIAL_NETWORKS.find(n => n.value === newContactKey)
                                        const Icon = social?.icon || Globe
                                        return (
                                          <>
                                            <Icon className={cn("h-4 w-4", social?.colorClass)} />
                                            {social?.label || newContactKey}
                                          </>
                                        )
                                      })()}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Select service</span>
                                  )}
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto bg-background border-border">
                                {SOCIAL_NETWORKS.filter(n => !contacts[n.value]).map((network) => (
                                  <DropdownMenuItem 
                                    key={network.value}
                                    onClick={() => setNewContactKey(network.value)}
                                  >
                                    <network.icon className="mr-2 h-4 w-4" />
                                    {network.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="space-y-2 flex-1 w-full">
                            <Label htmlFor="contact-value" className="text-xs">Link or Username</Label>
                            <Input 
                              id="contact-value" 
                              value={newContactValue} 
                              onChange={(e) => setNewContactValue(e.target.value)} 
                              className="h-9"
                            />
                          </div>
                          <div className="flex gap-1 w-full md:w-auto">
                            <Button type="button" size="sm" onClick={addContact} disabled={!newContactKey || !newContactValue} className="flex-1 md:flex-none">
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingContact(false)} className="flex-1 md:flex-none">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingContact(true)}
                          className="w-full border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact
                        </Button>
                      )}
                    </div>

                    {/* Destinations Management (Dealers/Logistics) */}
                    {thirdPartyProfile?.role_id === 3 && (
                      <div className="space-y-4 pt-4 border-t">
                        <Label>Destinations</Label>
                        
                        {/* List existing destinations */}
                        <div className="space-y-2">
                          {localDestinations.map((dest: Destination, idx: number) => (
                            <div key={dest.id || idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2 text-sm">
                                {dest.from_country?.flag && (
                                  <img 
                                    src={dest.from_country.flag.includes('http') ? dest.from_country.flag.replace(/.*(https?:\/\/)/, '$1') : getImageUrl(dest.from_country.flag)}
                                    alt={dest.from_country.name}
                                    className="w-8 h-6 object-cover rounded shadow-sm"
                                  />
                                )}
                                <span className="font-medium">{dest.from_country?.name}</span>
                                <span className="text-muted-foreground mx-2">→</span>
                                {dest.to_country?.flag && (
                                  <img 
                                    src={dest.to_country.flag.includes('http') ? dest.to_country.flag.replace(/.*(https?:\/\/)/, '$1') : getImageUrl(dest.to_country.flag)}
                                    alt={dest.to_country.name}
                                    className="w-8 h-6 object-cover rounded shadow-sm"
                                  />
                                )}
                                <span className="font-medium">{dest.to_country?.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setLocalDestinations(prev => prev.filter(d => d.id !== dest.id))
                                }}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {localDestinations.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No destinations added.</p>
                          )}
                        </div>

                        {/* Add new destination */}
                        {isAddingDestination ? (
                          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                            <h4 className="text-sm font-medium">Add New Destination</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">From</Label>
                                <Select
                                  options={countries?.map(c => ({ value: c.id, label: c.name })) || []}
                                  value={fromCountryId}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromCountryId(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">To</Label>
                                <Select
                                  options={countries?.map(c => ({ value: c.id, label: c.name })) || []}
                                  value={toCountryId}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToCountryId(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                size="sm" 
                                onClick={() => {
                                  if (fromCountryId && toCountryId) {
                                    const fromCountry = countries?.find(c => c.id.toString() === fromCountryId)
                                    const toCountry = countries?.find(c => c.id.toString() === toCountryId)
                                    
                                    if (fromCountry && toCountry) {
                                      const newDest: Destination = {
                                        id: Date.now() * -1, // Temporary negative ID
                                        from_country: fromCountry,
                                        to_country: toCountry
                                      }
                                      setLocalDestinations(prev => [...prev, newDest])
                                      setFromCountryId('')
                                      setToCountryId('')
                                      setIsAddingDestination(false)
                                    }
                                  }
                                }}
                                disabled={!fromCountryId || !toCountryId}
                              >
                                Add
                              </Button>
                              <Button 
                                type="button"
                                size="sm" 
                                variant="outline" 
                                onClick={() => setIsAddingDestination(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsAddingDestination(true)}
                            className="w-full border-dashed"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Destination
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Spinner size="sm" className="mr-2" />}
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={form.formState.isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>

                    {updateMutation.isError && (
                      <p className="text-sm text-destructive">Failed to update profile</p>
                    )}
                  </form>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header Section */}
      <div className="container mx-auto px-4 pt-6">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted overflow-hidden shrink-0">
              {thirdPartyProfile?.avatar || profile?.avatar ? (
                <img 
                  src={`${getImageUrl(thirdPartyProfile?.avatar || profile?.avatar || '')}?v=${avatarVersion}`}
                  alt={profile?.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  {thirdPartyProfile?.company_name || profile?.name || 'User'}
                  {profile?.role_id && profile.role_id >= 2 && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="text-primary font-medium">{getRoleLabel()}</span>
                  {memberSinceLabel && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span>Since {memberSinceLabel}</span>
                    </>
                  )}
                  {businessCityName && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span>{businessCityName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Location & Contact Summary */}
              <div className="flex flex-wrap gap-3 text-sm">
                {thirdPartyProfile?.address && (
                  <div className="flex items-center gap-1.5 text-foreground/80">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{thirdPartyProfile.address}</span>
                  </div>
                )}
                {phones.length > 0 && (
                  <div className="flex items-center gap-1.5 text-foreground/80">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{phones[0]}{phones.length > 1 && ` (+${phones.length - 1})`}</span>
                  </div>
                )}
              </div>

              {/* Social Icons Row */}
              {socialLinks.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {socialLinks.map((link) => (
                    <a 
                      key={link.key} 
                      href={link.value} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <link.network.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 min-w-[140px]">
               <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
                More Info
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Inventory */}
      <div className="container mx-auto px-4 mt-6 space-y-6">
          {thirdPartyProfile?.role_id === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Inventory</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                {inventoryCount ? `${inventoryCount} cars found` : 'No cars found'}
              </p>

              {carsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : carsData?.items && carsData.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
                  {carsData.items.map((car: CarType) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-muted-foreground">No vehicles currently available</h3>
                  <Button asChild className="mt-4">
                    <Link to="/biz/dealer/new">Add First Car</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Destinations for Logist */}
          {thirdPartyProfile?.role_id === 3 && thirdPartyProfile.destinations && thirdPartyProfile.destinations.length > 0 && (
             <div className="space-y-3">
                <h3 className="font-semibold text-lg">Destinations</h3>
                <div className="space-y-2">
                  {thirdPartyProfile.destinations.map((dest: Destination, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
                       <div className="flex items-center gap-2">
                        {dest.from_country?.flag && (
                          <img 
                            src={dest.from_country.flag.includes('http') ? dest.from_country.flag.replace(/.*(https?:\/\/)/, '$1') : getImageUrl(dest.from_country.flag)}
                            alt={dest.from_country.name}
                            className="w-8 h-6 object-cover rounded shadow-sm"
                          />
                        )}
                        <span className="font-medium">{dest.from_country?.name}</span>
                       </div>
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                       <div className="flex items-center gap-2">
                        <span className="font-medium text-right">{dest.to_country?.name}</span>
                        {dest.to_country?.flag && (
                          <img 
                            src={dest.to_country.flag.includes('http') ? dest.to_country.flag.replace(/.*(https?:\/\/)/, '$1') : getImageUrl(dest.to_country.flag)}
                            alt={dest.to_country.name}
                            className="w-8 h-6 object-cover rounded shadow-sm"
                          />
                        )}
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {thirdPartyProfile?.avatar || profile?.avatar ? (
                <img 
                  src={`${getImageUrl(thirdPartyProfile?.avatar || profile?.avatar || '')}?v=${avatarVersion}`}
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              Profile Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-8">
            {/* About Us */}
            {thirdPartyProfile?.about_us && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  About Us
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-line break-all">
                  {thirdPartyProfile.about_us}
                </div>
              </section>
            )}

            {/* Business Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Business Info
              </h3>
              <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
                <div className="grid grid-cols-[100px_1fr] divide-y divide-border/50">
                  <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">Type</div>
                  <div className="px-4 py-3 text-sm font-medium">{thirdPartyProfile?.company_type || 'Private Seller'}</div>
                  
                  {thirdPartyProfile?.vat_number && (
                    <>
                      <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">VAT</div>
                      <div className="px-4 py-3 text-sm font-mono tracking-wide">{thirdPartyProfile.vat_number}</div>
                    </>
                  )}
                  
                  {thirdPartyProfile?.registered && (
                    <>
                      <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20">Member</div>
                      <div className="px-4 py-3 text-sm">Since {new Date(thirdPartyProfile.registered).getFullYear()}</div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Contacts */}
            {(thirdPartyProfile?.address || phones.length > 0 || profile?.email) && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contacts
                </h3>
                <div className="space-y-3">
                  {thirdPartyProfile?.address && (
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                        <p className="text-sm font-medium leading-tight mb-1 break-all">{thirdPartyProfile.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {phones.length > 0 && (
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Phone{phones.length > 1 ? 's' : ''}</p>
                        <div className="space-y-1">
                          {phones.map((phone, i) => (
                            <a key={i} href={`tel:${phone}`} className="text-sm font-medium hover:text-primary transition-colors block">
                              {phone}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile?.email && (
                    <div className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${profile.email}`} className="text-sm font-medium hover:text-primary transition-colors block truncate">
                          {profile.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Social Links List */}
            {socialLinks.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Social Media
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {socialLinks.map((link) => (
                    <a 
                      key={link.key}
                      href={link.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-border transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <link.network.icon className={cn("h-4 w-4", link.network.colorClass)} />
                      </div>
                      <span className="text-sm font-medium truncate">{link.network.label}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Account Actions */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Account
              </h3>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Delete your account to remove this business profile and access.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending && (
                    <Spinner size="sm" className="mr-2" />
                  )}
                  Delete account
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
