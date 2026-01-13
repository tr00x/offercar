import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { sendBusinessApplication, setTokens, uploadApplicationDocuments } from '@/api/auth'
import { getCompanyTypes, getActivityFields } from '@/api/references'
import { useAuth } from '@/store/auth'
import { Building2, Car, Truck, Users, Wrench, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

const businessTypes = [
  { id: 2, name: 'Dealer', icon: Car, description: 'Sell cars from your dealership' },
  { id: 3, name: 'Logistics', icon: Truck, description: 'Transport and logistics services' },
  { id: 4, name: 'Broker', icon: Users, description: 'Help buyers find cars' },
  { id: 5, name: 'Car Service', icon: Wrench, description: 'Car repair and maintenance' },
]

const applySchema = z.object({
  role_id: z.number({ message: 'Please select a business type' }),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_type_id: z.number({ message: 'Please select company type' }),
  activity_field_id: z.number({ message: 'Please select activity field' }),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  address: z.string().min(5, 'Please enter your address'),
  vat_number: z.string().min(1, 'Please enter VAT number'),
  licence_issue_date: z.string().min(1, 'Please enter licence issue date'),
  licence_expiry_date: z.string().min(1, 'Please enter licence expiry date'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type ApplyFormData = z.infer<typeof applySchema>

export function BusinessApply() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [step, setStep] = useState<'type' | 'form' | 'docs'>('type')
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyTypes, setCompanyTypes] = useState<{ value: number; label: string }[]>([])
  const [activityFields, setActivityFields] = useState<{ value: number; label: string }[]>([])
  const [licenceFile, setLicenceFile] = useState<File | null>(null)
  const [memorandumFile, setMemorandumFile] = useState<File | null>(null)
  const [copyOfIdFile, setCopyOfIdFile] = useState<File | null>(null)

  useEffect(() => {
    const pending = localStorage.getItem('pending_docs')
    if (pending) {
      setStep('docs')
    }
  }, [])

  const form = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      company_type_id: 1,
      activity_field_id: 1,
    },
  })

  // Load registration data (company types and activity fields)
  // Fetch once when entering form step
  if (step === 'form' && companyTypes.length === 0 && activityFields.length === 0) {
    ;(async () => {
      try {
        const [ct, af] = await Promise.all([getCompanyTypes(), getActivityFields()])
        setCompanyTypes((ct || []).map((c) => ({ value: c.id, label: c.name || String(c.id) })))
        setActivityFields((af || []).map((a) => ({ value: a.id, label: a.name || String(a.id) })))
      } catch {
        // leave defaults if fetch fails
      }
    })()
  }

  const handleTypeSelect = (typeId: number) => {
    setSelectedType(typeId)
    form.setValue('role_id', typeId)
    setStep('form')
  }

  const onSubmit = async (data: ApplyFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const payload: ApplyFormData = {
        ...data,
        licence_issue_date: data.licence_issue_date?.slice(0, 10),
        licence_expiry_date: data.licence_expiry_date?.slice(0, 10),
        phone: data.phone.replace(/\D/g, ''),
        email: data.email.trim(),
        full_name: data.full_name.trim(),
        company_name: data.company_name.trim(),
        address: data.address.trim(),
        vat_number: data.vat_number.trim(),
      }

      const response = await sendBusinessApplication(payload)
      console.log('Registration response:', response)
      
      if (!response.access_token) {
        throw new Error('No access token received from server')
      }

      setTokens(response.access_token, response.refresh_token)
      
      // Try to refresh user, but don't fail if it fails (e.g. profile not ready yet)
      try {
        await refreshUser()
      } catch (e) {
        console.warn('Failed to refresh user after registration:', e)
        // We continue anyway because we have the token for upload
      }

      toast.success('Заявка принята. Письма о прогрессе придут на e‑mail.')
      localStorage.setItem('pending_docs', '1')
      setStep('docs')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit application'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

async function onUploadDocs() {    setError(null)
    setIsLoading(true)
    try {
      if (!licenceFile || !memorandumFile || !copyOfIdFile) {
        setError('Please upload all required documents')
        return
      }
      await uploadApplicationDocuments(licenceFile, memorandumFile, copyOfIdFile)
      toast.success('Documents uploaded successfully!')
      localStorage.removeItem('pending_docs')
      
      // Get role for redirect
      let roleId = 2 // Default to dealer
      try {
        const profile = await getProfile()
        roleId = profile.role_id
        
        // Check third party profile if role seems to be user
        if (!roleId || roleId < 2) {
          try {
            const thirdParty = await getThirdPartyProfile()
            if (thirdParty?.role_id) {
              roleId = thirdParty.role_id
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile for redirect', e)
      }

      // Redirect based on role
      switch (roleId) {
        case 2: navigate('/biz/dealer/garage'); break;
        case 3: navigate('/biz/logistic/dashboard'); break;
        case 4: navigate('/biz/broker/dashboard'); break;
        case 5: navigate('/biz/service/dashboard'); break;
        default: navigate('/biz/dealer/garage');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload documents'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {step === 'type' ? (
          <>
            <div className="text-center mb-8">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Register Your Business</h1>
              <p className="text-muted-foreground">
                Choose your business type to get started
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businessTypes.map((type) => (
                <Card
                  key={type.id}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary',
                    selectedType === type.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <CardContent className="p-6 text-center">
                    <type.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Already have a business account?{' '}
              <a href="/biz/auth" className="text-primary hover:underline">
                Log in here
              </a>
            </p>
          </>
        ) : step === 'form' ? (
          <>
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => setStep('type')}
            >
              &larr; Back to business type
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Business Application</CardTitle>
                <CardDescription>
                  Fill in your business details to register
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Company Info */}
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input {...form.register('company_name')} />
                    {form.formState.errors.company_name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.company_name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Type *</Label>
                      <Select
                        options={companyTypes.length ? companyTypes : [
                          { value: 1, label: 'LLC' },
                          { value: 2, label: 'Corporation' },
                          { value: 3, label: 'Partnership' },
                          { value: 4, label: 'Sole Proprietorship' },
                        ]}
                        value={form.watch('company_type_id')}
                        onChange={(e) => form.setValue('company_type_id', Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Activity Field *</Label>
                      <Select
                        options={activityFields.length ? activityFields : [
                          { value: 1, label: 'Automotive' },
                          { value: 2, label: 'Logistics' },
                          { value: 3, label: 'Trading' },
                          { value: 4, label: 'Services' },
                        ]}
                        value={form.watch('activity_field_id')}
                        onChange={(e) => form.setValue('activity_field_id', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>VAT Number *</Label>
                    <Input {...form.register('vat_number')} />
                    {form.formState.errors.vat_number && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.vat_number.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input {...form.register('address')} />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  {/* Licence Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Licence Issue Date *</Label>
                      <Input type="date" {...form.register('licence_issue_date')} />
                      {form.formState.errors.licence_issue_date && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.licence_issue_date.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Licence Expiry Date *</Label>
                      <Input type="date" {...form.register('licence_expiry_date')} />
                      {form.formState.errors.licence_expiry_date && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.licence_expiry_date.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-semibold mb-4">Contact Person</h3>

                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input {...form.register('full_name')} />
                      {form.formState.errors.full_name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" {...form.register('email')} />
                        {form.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input type="tel" {...form.register('phone')} />
                        {form.formState.errors.phone && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label>Password *</Label>
                      <Input type="password" {...form.register('password')} />
                      {form.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Spinner size="sm" className="mr-2" />}
                    <Check className="h-4 w-4 mr-2" />
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => setStep('form')}
            >
              &larr; Back to application
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Загрузка документов</CardTitle>
                <CardDescription>
                  Загрузите лицензию, меморандум и копию ID. Без этих PDF заявка не будет одобрена.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg p-3 text-sm bg-primary/10 text-primary">
                  Заявка принята. Вы получите уведомление о прогрессе регистрации.
                  Если что-то не так, придёт письмо с причиной отказа (обычно — некорректные документы или неверное заполнение).
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  {/* Licence Upload */}
                  <div className="space-y-2">
                    <Label>Licence (PDF) *</Label>
                    {!licenceFile ? (
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              setError('Please upload a PDF file for Licence')
                              e.target.value = ''
                              return
                            }
                            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                              setError('Licence file size must be less than 5MB')
                              e.target.value = ''
                              return
                            }
                            setLicenceFile(file)
                            setError(null)
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center space-x-2 truncate">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm truncate max-w-[200px]">{licenceFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => setLicenceFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Memorandum Upload */}
                  <div className="space-y-2">
                    <Label>Memorandum (PDF) *</Label>
                    {!memorandumFile ? (
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              setError('Please upload a PDF file for Memorandum')
                              e.target.value = ''
                              return
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              setError('Memorandum file size must be less than 5MB')
                              e.target.value = ''
                              return
                            }
                            setMemorandumFile(file)
                            setError(null)
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center space-x-2 truncate">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm truncate max-w-[200px]">{memorandumFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => setMemorandumFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Copy of ID Upload */}
                  <div className="space-y-2">
                    <Label>Copy of ID (PDF) *</Label>
                    {!copyOfIdFile ? (
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              setError('Please upload a PDF file for Copy of ID')
                              e.target.value = ''
                              return
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              setError('Copy of ID file size must be less than 5MB')
                              e.target.value = ''
                              return
                            }
                            setCopyOfIdFile(file)
                            setError(null)
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center space-x-2 truncate">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm truncate max-w-[200px]">{copyOfIdFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => setCopyOfIdFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-6" onClick={onUploadDocs} disabled={isLoading}>
                    {isLoading && <Spinner size="sm" className="mr-2" />}
                    Upload and Complete Registration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
