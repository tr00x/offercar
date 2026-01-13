import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, getMyCarsOnSale, uploadAvatar, deleteAvatar, getThirdPartyProfile, uploadBanner, deleteBanner } from '@/api/profile'
import { getCities } from '@/api/references'
import { getImageUrl } from '@/api/client'
import { useAuth } from '@/store/auth'
import { CarCard } from '@/components/cars/CarCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Mail, Phone, Settings, Plus, Camera, Trash2, X, MapPin, Car, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  city_id: z.string().optional(),
  birthday: z.string().optional(),
  driving_experience: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function Profile() {
  const navigate = useNavigate()
  const { isAuthenticated, refreshUser, logout } = useAuth()
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

  const [showDetails, setShowDetails] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth')
    }
  }, [isAuthenticated, navigate])

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: thirdPartyProfile } = useQuery({
    queryKey: ['third-party-profile'],
    queryFn: getThirdPartyProfile,
  })

  const { data: myCarsResponse, isLoading: carsLoading } = useQuery({
    queryKey: ['my-cars-on-sale'],
    queryFn: () => getMyCarsOnSale({ limit: 10 }),
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: getCities,
  })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      refreshUser()
    },
    onError: (error: unknown) => {
      // Error handling is done in handleSubmit
      console.error('Update profile error:', error)
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
      // Error handling is done in handleSubmit
      console.error('Upload avatar error:', error)
    }
  })

  const uploadBannerMutation = useMutation({
    mutationFn: uploadBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      setBannerVersion(Date.now())
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to upload banner'
      toast.error(`Upload failed: ${msg}`)
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
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to remove banner'
      toast.error(msg)
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
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to remove avatar'
      toast.error(message)
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
    if (profile) {
      form.reset({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        city_id: profile.city?.id?.toString() || '',
        birthday: profile.birthday || '',
        driving_experience: profile.driving_experience?.toString() || '',
      })
    }
  }, [profile, form])

  const handleSubmit = async (data: ProfileFormData) => {
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
        birthday: data.birthday || undefined,
        driving_experience: data.driving_experience ? parseInt(data.driving_experience) : undefined,
      })

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
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error).message || 'Failed to save changes'
      toast.error(msg, { id: toastId })
    }
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
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const myCars = myCarsResponse?.items || []

  const phones = profile?.phone 
    ? profile.phone.split(',').map(p => p.trim()).filter(Boolean)
    : []

  const avatarPath = profile?.avatar || thirdPartyProfile?.avatar

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header Section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 overflow-hidden relative group">
          {thirdPartyProfile?.banner ? (
            <img 
              src={`${getImageUrl(thirdPartyProfile.banner)}?v=${bannerVersion}`}
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          
          {/* Actions: Edit & Logout */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="backdrop-blur-sm bg-background/50 hover:bg-background/80"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="backdrop-blur-sm opacity-90 hover:opacity-100"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Info Card - Overlapping Banner */}
        <div className="container mx-auto px-4 -mt-12 relative z-10">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background bg-muted overflow-hidden shrink-0 -mt-10 md:-mt-12 shadow-lg">
                {avatarPath ? (
                  <img 
                    src={`${getImageUrl(avatarPath)}?v=${avatarVersion}`}
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
                    {profile?.name || 'User'}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="text-primary font-medium">User</span>
                    {profile?.birthday && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>Born {new Date(profile.birthday).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Location & Contact Summary */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {profile?.city && (
                    <div className="flex items-center gap-1.5 text-foreground/80">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{profile.city.name}</span>
                    </div>
                  )}
                  {phones.length > 0 && (
                    <div className="flex items-center gap-1.5 text-foreground/80">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{phones[0]}{phones.length > 1 && ` (+${phones.length - 1})`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                 <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
                  More Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Inventory */}
      <div className="container mx-auto px-4 mt-6 space-y-6">
        {isEditing ? (
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
                  {/* Banner Upload */}
                  <div className="space-y-2">
                    <div className="relative h-32 md:h-40 rounded-lg overflow-hidden border border-border bg-muted group">
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
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8 opacity-50" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label 
                          htmlFor="banner-upload" 
                          className="p-2 bg-background/80 text-foreground rounded-full cursor-pointer hover:bg-background transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                          <input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerChange}
                            disabled={form.formState.isSubmitting}
                          />
                        </label>
                        {thirdPartyProfile?.banner && !previewBannerUrl && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-full w-9 h-9"
                            onClick={() => deleteBannerMutation.mutate()}
                            disabled={deleteBannerMutation.isPending || form.formState.isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {previewBannerUrl && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="rounded-full w-9 h-9"
                            onClick={() => {
                              URL.revokeObjectURL(previewBannerUrl)
                              setPreviewBannerUrl(null)
                              setSelectedBannerFile(null)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 1200x300px. Max 5MB.
                    </p>
                  </div>

                  {/* Avatar Upload in Edit Mode */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {(previewAvatarUrl || (avatarPath && !avatarError)) ? (
                        <img
                          src={previewAvatarUrl || (avatarPath ? `${getImageUrl(avatarPath)}?v=${avatarVersion}` : '')}
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
                        {avatarPath && !previewAvatarUrl && (
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phones</Label>
                        <Input id="phone" {...form.register('phone')} placeholder="e.g. +99361234567, +99362345678" />
                        <p className="text-xs text-muted-foreground">Comma separated numbers.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthday">Birthday</Label>
                        <Input id="birthday" type="date" {...form.register('birthday')} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="driving_experience">Driving Experience (Years)</Label>
                        <Input id="driving_experience" type="number" {...form.register('driving_experience')} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city_id">City</Label>
                        <Select
                          id="city_id"
                          options={cities?.map(c => ({ value: c.id, label: c.name })) || []}
                          placeholder="Select City"
                          {...form.register('city_id')}
                        />
                      </div>
                    </div>

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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Garage</h2>
              <span className="text-sm text-muted-foreground">{myCars.length} cars</span>
              <Button asChild size="sm">
                <Link to="/sell">
                  <Plus className="h-4 w-4 mr-2" />
                  Add car
                </Link>
              </Button>
            </div>
            
            {carsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : myCars.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {myCars.map((car) => (
                  <CarCard key={car.id} car={car} showActions={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-muted-foreground">No vehicles in your garage</h3>
                <Button asChild className="mt-4">
                   <Link to="/sell">Add First Car</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0 gap-0 bg-card border-border">
          <DialogHeader className="p-6 pb-2 sticky top-0 bg-card z-10 border-b border-border/40 backdrop-blur-sm">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {profile?.avatar ? (
                <img 
                  src={`${getImageUrl(profile.avatar)}?v=${avatarVersion}`}
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
            {/* Contacts */}
            {(profile?.email || phones.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contacts
                </h3>
                <div className="space-y-3">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
