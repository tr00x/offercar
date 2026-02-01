import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, uploadUserAvatar, getThirdPartyProfile, deleteAccount } from '@/api/profile'
import { getCities } from '@/api/references'
import { getImageUrl } from '@/api/client'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { User, Phone, Settings, Plus, Trash2, X, MapPin, ChevronDown, ChevronUp, Link2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SOCIAL_NETWORKS } from '@/lib/social-icons'
import { cn, getErrorMessage } from '@/lib/utils'

interface ApiError {
  response?: {
    data?: {
      message?: string | Record<string, string>
    }
    status?: number
  }
  message?: string
}

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(20, 'Name must be at most 20 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  city_id: z.string().optional(),
  birthday: z.string().optional(),
  driving_experience: z.string().regex(/^\d*$/, 'Must be a number').optional(),
  about_me: z
    .string()
    .max(500, 'About me must be at most 500 characters')
    .optional()
    .or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function Profile() {
  const navigate = useNavigate()
  const { isAuthenticated, refreshUser, logout, openAuthModal } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now())
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Record<string, string>>({})
  const [newContactKey, setNewContactKey] = useState('')
  const [newContactValue, setNewContactValue] = useState('')
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [isCustomContact, setIsCustomContact] = useState(false)
  const [customContactLabel, setCustomContactLabel] = useState('')

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

  const { data: thirdPartyProfile } = useQuery({
    queryKey: ['third-party-profile'],
    queryFn: getThirdPartyProfile,
    enabled: !!profile?.role_id && profile.role_id > 1,
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
      console.error('Update profile error:', error)
    }
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: uploadUserAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['third-party-profile'] })
      refreshUser()
      setAvatarVersion(Date.now())
    },
    onError: (error: unknown) => {
      const err = error as ApiError
      const status = err.response?.status

      if (status === 500) {
         const detailed = getErrorMessage(error, '')
         console.error('Avatar upload failed (500). Server reason:', detailed)
         toast.error('Server storage error: Cannot save avatar. Please try again later.')
      } else {
         console.error('Upload avatar error:', error)
         toast.error(getErrorMessage(error, 'Failed to upload avatar'))
      }
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
    },
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      city_id: profile?.city?.id?.toString() || profile?.city_id?.toString() || '',
      birthday: profile?.birthday || '',
      driving_experience: profile?.driving_experience?.toString() || '',
      about_me: profile?.about_me || '',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        city_id: profile.city?.id?.toString() || profile.city_id?.toString() || '',
        birthday: profile.birthday || '',
        driving_experience: profile.driving_experience?.toString() || '',
        about_me: profile.about_me || '',
      })

      if (profile.contacts) {
        setContacts(profile.contacts)
      }
    }
  }, [profile, form])

  const handleSubmit = async (data: ProfileFormData) => {
    const toastId = toast.loading('Saving changes...')
    try {
      const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return undefined
        const ruDateRegex = /^(\d{2})\s*\.\s*(\d{2})\s*\.\s*(\d{4})$/
        const match = dateStr.match(ruDateRegex)
        if (match) {
          return `${match[3]}-${match[2]}-${match[1]}`
        }
        return dateStr
      }

      await updateMutation.mutateAsync({
        username: data.name,
        email: data.email || undefined,
        phone_number: data.phone || undefined,
        about_me: data.about_me || ' ',
        city_id: data.city_id ? parseInt(data.city_id) : undefined,
        birthday: formatDate(data.birthday),
        driving_experience: data.driving_experience && data.driving_experience !== '' ? parseInt(data.driving_experience) : undefined,
        contacts: contacts,
        google: profile?.google || 'app_init',
      })

      if (selectedAvatarFile && profile?.role_id && profile.role_id >= 2) {
        try {
           await uploadAvatarMutation.mutateAsync(selectedAvatarFile)
         } catch (e) {
           console.error("Avatar upload failed after profile save", e)
           toast.error('Profile saved, but avatar upload failed. Please try uploading avatar again.', { id: toastId })
           setIsEditing(false)
           return
         }
      }

      toast.success('Profile updated successfully', { id: toastId })
      setIsEditing(false)

      setSelectedAvatarFile(null)
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl)
        setPreviewAvatarUrl(null)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(getErrorMessage(error, 'Failed to update profile'), { id: toastId })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.reset()
    setSelectedAvatarFile(null)
    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl)
      setPreviewAvatarUrl(null)
    }
  }

  const addContact = () => {
    const key = isCustomContact ? `custom:${customContactLabel.trim()}` : newContactKey.trim()
    if (!key || !newContactValue.trim()) return
    if (isCustomContact && !customContactLabel.trim()) return
    setContacts(prev => ({
      ...prev,
      [key]: newContactValue.trim()
    }))
    setNewContactKey('')
    setNewContactValue('')
    setCustomContactLabel('')
    setIsCustomContact(false)
    setIsAddingContact(false)
  }

  const removeContact = (key: string) => {
    setContacts(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

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

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedAvatarFile(file)
      const url = URL.createObjectURL(file)
      setPreviewAvatarUrl(url)
    }
  }

  const phones = profile?.phone
    ? profile.phone.split(',').map(p => p.trim()).filter(Boolean)
    : []

  const socialLinks = Object.entries(contacts).length > 0
    ? Object.entries(contacts).map(([key, value]) => {
        const isCustom = key.startsWith('custom:')
        const network = SOCIAL_NETWORKS.find(n => n.value === key)
        return {
          key,
          value,
          network,
          isCustom,
          customLabel: isCustom ? key.replace('custom:', '') : undefined
        }
      })
    : []

  const avatarPath = profile?.avatar || thirdPartyProfile?.avatar

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Profile Header - Compact */}
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
          {avatarPath && !avatarError ? (
            <img
              src={getImageUrl(avatarPath)}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={() => setAvatarError(true)}
              key={avatarVersion}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-medium">
              {(profile?.name || 'U')[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold truncate">{profile?.name || 'User'}</h2>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            <span className="text-primary font-medium">User</span>
            {profile?.birthday && (
              <>
                <span>•</span>
                <span>Born {new Date(profile.birthday).toLocaleDateString()}</span>
              </>
            )}
          </div>

          {/* Location & Phone */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            {(profile?.city || profile?.city_id) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">
                  {profile?.city?.name || cities?.find(c => c.id === profile?.city_id)?.name || ''}
                </span>
              </div>
            )}
            {phones.length > 0 && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{phones[0]}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {socialLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  title={link.isCustom ? link.customLabel : link.network?.label}
                >
                  {link.network ? (
                    <link.network.icon className={cn("h-4 w-4", link.network.colorClass)} />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-9"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Edit Profile
          {isEditing ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>
      </div>

      {/* Edit Form - Expandable */}
      {isEditing && (
        <div className="border border-border rounded-xl p-4 bg-card/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Avatar Upload - Only for Businesses */}
            {profile?.role_id && profile.role_id >= 2 && (
              <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="relative w-16 h-16">
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted border border-border">
                    {previewAvatarUrl ? (
                      <img src={previewAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : avatarPath && !avatarError ? (
                      <img
                        src={getImageUrl(avatarPath)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                        key={avatarVersion}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium rounded-full"
                    >
                      Change
                    </label>
                  </div>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">Click to upload</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input id="name" {...form.register('name')} className="h-9" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" {...form.register('email')} className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Phone</Label>
                <Input id="phone" {...form.register('phone')} placeholder="+99361234567" className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthday" className="text-xs">Birthday</Label>
                <Input id="birthday" type="date" {...form.register('birthday')} className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="driving_experience" className="text-xs">Driving Experience (Years)</Label>
                <Input id="driving_experience" type="number" {...form.register('driving_experience')} className="h-9" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city_id" className="text-xs">City</Label>
                <Select
                  id="city_id"
                  options={cities?.map(c => ({ value: c.id, label: c.name })) || []}
                  placeholder="Select City"
                  {...form.register('city_id')}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="about_me" className="text-xs">About me</Label>
                <Textarea
                  id="about_me"
                  rows={2}
                  {...form.register('about_me')}
                  placeholder="Tell others about yourself"
                  className="resize-none"
                />
              </div>
            </div>

            {/* Social Networks */}
            <div className="space-y-2">
              <Label className="text-xs">Social Networks</Label>

              {Object.entries(contacts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(contacts).map(([key, value]) => {
                    const isCustom = key.startsWith('custom:')
                    const customLabel = isCustom ? key.replace('custom:', '') : undefined
                    const network = SOCIAL_NETWORKS.find(n => n.value === key)
                    const Icon = network?.icon || Link2
                    return (
                      <div key={key} className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border bg-muted/30 text-sm">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="font-medium">{isCustom ? customLabel : network?.label}</span>
                        <span className="truncate max-w-[120px] text-muted-foreground">{value}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeContact(key)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {isAddingContact ? (
                <div className="flex flex-wrap gap-2 items-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-8">
                        {isCustomContact ? (
                          <><Link2 className="h-3.5 w-3.5 mr-1.5" />Custom</>
                        ) : newContactKey ? (
                          (() => {
                            const network = SOCIAL_NETWORKS.find(n => n.value === newContactKey)
                            if (!network) return 'Select'
                            const Icon = network.icon
                            return <><Icon className="h-3.5 w-3.5 mr-1.5" />{network.label}</>
                          })()
                        ) : 'Select network'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border-border">
                      {SOCIAL_NETWORKS.map((network) => (
                        <DropdownMenuItem
                          key={network.value}
                          onSelect={() => {
                            setNewContactKey(network.value)
                            setIsCustomContact(false)
                            setCustomContactLabel('')
                          }}
                          className="focus:bg-accent"
                        >
                          <network.icon className="h-4 w-4 mr-2" />
                          {network.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onSelect={() => {
                          setIsCustomContact(true)
                          setNewContactKey('')
                        }}
                        className="focus:bg-accent"
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Custom...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isCustomContact && (
                    <Input
                      value={customContactLabel}
                      onChange={(e) => setCustomContactLabel(e.target.value)}
                      placeholder="Contact name (e.g. Manager)"
                      className="h-8 w-[150px]"
                    />
                  )}
                  <Input
                    value={newContactValue}
                    onChange={(e) => setNewContactValue(e.target.value)}
                    placeholder="Link or username"
                    className="h-8 flex-1 min-w-[150px]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    onClick={addContact}
                    disabled={(!newContactKey && !isCustomContact) || !newContactValue || (isCustomContact && !customContactLabel)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setIsAddingContact(false)
                      setIsCustomContact(false)
                      setCustomContactLabel('')
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingContact(true)} className="h-8 border-dashed">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Contact
                </Button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Spinner size="sm" className="mr-1.5" />}
                Save
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Danger Zone - Compact */}
      <div className="border border-destructive/30 rounded-xl p-3 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
          <Trash2 className="h-4 w-4" />
          Danger zone
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Log out to keep your data, or delete the account to remove your profile and access.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            Sign out
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending && <Spinner size="sm" className="mr-1.5" />}
            Delete account
          </Button>
        </div>
      </div>
    </div>
  )
}
