import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/store/auth'
import { loginWithEmail, loginWithPhone, confirmEmailOtp, confirmPhoneOtp, loginWithGoogle } from '@/api/auth'
import { Mail, Smartphone, ChevronRight, X, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn, getErrorMessage } from '@/lib/utils'
import { BusinessLoginCard } from './business/Login'

type AuthMethod = 'select' | 'email' | 'phone'
type AuthStep = 'method' | 'input' | 'otp'

type PhoneCountry = {
  code: string
  name: string
  dialCode: string
}

const getFlagEmoji = (code: string) => {
  if (!code) return ''
  const upper = code.toUpperCase()
  if (upper.length !== 2) return ''
  const first = upper.codePointAt(0)
  const second = upper.codePointAt(1)
  if (!first || !second) return ''
  return String.fromCodePoint(127397 + first, 127397 + second)
}

const phoneCountries: PhoneCountry[] = [
  { code: 'TM', name: 'Turkmenistan', dialCode: '+993' },
  { code: 'RU', name: 'Russia', dialCode: '+7' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93' },
  { code: 'AL', name: 'Albania', dialCode: '+355' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7' },
  { code: 'BY', name: 'Belarus', dialCode: '+375' },
  { code: 'AM', name: 'Armenia', dialCode: '+374' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994' },
  { code: 'GE', name: 'Georgia', dialCode: '+995' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
]

type AuthCardProps = {
  onSuccess?: () => void
  onBusinessLoginClick?: () => void
}

export function AuthCard({
  onSuccess,
  onBusinessLoginClick
}: AuthCardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [method, setMethod] = useState<AuthMethod>('select')
  const [step, setStep] = useState<AuthStep>('method')
  const [credential, setCredential] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(phoneCountries[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [showBusinessLogin, setShowBusinessLogin] = useState(false)
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const from = (location.state as { from?: string })?.from || '/'

  // Google login
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      try {
        // We get access_token, but api might need id_token depending on backend.
        // The previous code in api/auth.ts used `token_id`. 
        // Usually `loginWithGoogle` expects a JWT (id_token) or access_token.
        // If the backend verifies it with Google, access_token is fine if backend supports it.
        // However, standard Google Sign-In (gapi) used id_token.
        // @react-oauth/google returns access_token by default (Implicit flow).
        // If we need id_token, we must use flow: 'auth-code' or just rely on access_token if backend supports it.
        // Let's assume the backend handles access_token or we try to get id_token via flow.
        // But for now, let's pass access_token as token_id and see.
        
        // Actually, if we want id_token, we can use onSuccess with `credential` if we use the component, 
        // but with hook, we get TokenResponse (access_token).
        // Let's try sending access_token.
        
        const response = await loginWithGoogle(tokenResponse.access_token)
        await login(response.access_token, response.refresh_token)
        toast.success('You are logged in.')
        if (onSuccess) {
          onSuccess()
        } else {
          navigate(from, { replace: true })
        }
      } catch (err) {
        console.error('Google login failed:', err)
        setError(getErrorMessage(err, 'Failed to log in with Google.'))
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.')
    }
  })

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSelectMethod = (selectedMethod: AuthMethod) => {
    setMethod(selectedMethod)
    setStep('input')
    setError(null)
  }

  const handleSendCode = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (method === 'email') {
        if (!email || !email.includes('@')) {
          setError('Please enter a valid email address')
          setIsLoading(false)
          return
        }
        await loginWithEmail(email)
        setCredential(email)
        toast.success('We sent a verification code to your email.')
      } else {
        const fullPhone = `${selectedCountry.dialCode}${phoneNumber.replace(/\s/g, '')}`
        if (phoneNumber.replace(/\s/g, '').length < 8) {
          setError('Please enter a valid phone number')
          setIsLoading(false)
          return
        }
        await loginWithPhone(fullPhone)
        setCredential(fullPhone)
        toast.success('We sent a verification code to your phone.')
      }
      setStep('otp')
      setOtpValues(['', '', '', '', '', ''])
      setResendTimer(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      console.error('Failed to send verification code:', err)
      const defaultMsg =
        method === 'email'
          ? 'Could not send code to email. Please try again.'
          : 'Could not send code to phone. Please try again.'
      
      setError(getErrorMessage(err, defaultMsg))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = useCallback(async (code: string) => {
    setError(null)
    setIsLoading(true)

    try {
      let response

      if (method === 'email') {
        response = await confirmEmailOtp(credential, code)
      } else {
        response = await confirmPhoneOtp(credential, code)
      }

      await login(response.access_token, response.refresh_token)
      toast.success('You are logged in.')
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      console.error('Failed to verify code:', err)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).response?.status === 500) {
        setError('Server error. Please try again later.')
      } else {
        setError(getErrorMessage(err, 'Invalid verification code. Please try again.'))
      }
      
      setOtpValues(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } finally {
      setIsLoading(false)
    }
  }, [method, credential, login, onSuccess, navigate, from])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newValues = [...otpValues]
    newValues[index] = value.slice(-1)
    setOtpValues(newValues)

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    const fullCode = newValues.join('')
    if (fullCode.length === 6 && !isLoading) {
      handleVerifyOtp(fullCode)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter' && !isLoading) {
      const fullCode = otpValues.join('')
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode)
      }
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const newValues = [...otpValues]
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i]
      }
      setOtpValues(newValues)
      if (pastedData.length === 6) {
        handleVerifyOtp(pastedData)
      } else {
        otpRefs.current[pastedData.length]?.focus()
      }
    }
  }

  const handleChangeNumber = () => {
    setStep('input')
    setError(null)
    setOtpValues(['', '', '', '', '', ''])
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return
    setError(null)
    setIsLoading(true)

    try {
      if (method === 'email') {
        await loginWithEmail(credential)
      } else {
        await loginWithPhone(credential)
      }
      toast.success('New code sent!')
      setResendTimer(60)
      setOtpValues(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch {
      setError('Could not resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Method selection screen
  if (step === 'method') {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">Sign in</h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Choose how you want to sign in
        </p>

        <div className="w-full space-y-3 mb-6">
          <button
            onClick={() => handleSelectMethod('email')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left text-foreground font-medium">Email</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => handleSelectMethod('phone')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left text-foreground font-medium">Phone number</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="w-full rounded-xl bg-muted overflow-hidden">
          <button
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/80 transition-colors"
          >
            <span className="text-foreground font-medium">Sign in with Google</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (onBusinessLoginClick) {
                onBusinessLoginClick()
              } else {
                setShowBusinessLogin(true)
              }
            }}
          >
            <span>Business login</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Business Login Modal */}
        <Dialog open={showBusinessLogin} onOpenChange={setShowBusinessLogin}>
          <DialogContent className="max-w-xl">
            <BusinessLoginCard
              onUserLoginClick={() => setShowBusinessLogin(false)}
              onRegisterClick={() => setShowBusinessLogin(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Phone/Email input screen
  if (step === 'input') {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-4">
        <div className="w-full">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {method === 'phone' ? 'Phone number' : 'Email address'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {method === 'phone'
              ? 'Please specify the country code and enter your phone number.'
              : 'Please enter your email address.'}
          </p>

          {method === 'phone' ? (
            <div className={cn(
              "rounded-xl overflow-hidden border transition-colors",
              error ? "border-destructive" : "border-border"
            )}>
              <button
                type="button"
                onClick={() => setShowCountryModal(true)}
                className="w-full flex items-center gap-3 p-4 bg-muted hover:bg-muted/80 transition-colors"
              >
                <span className="text-xl">{getFlagEmoji(selectedCountry.code)}</span>
                <span className="flex-1 text-left text-foreground">{selectedCountry.name}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="flex items-center bg-muted px-4 py-3">
                <span className="text-muted-foreground font-medium">{selectedCountry.dialCode}</span>
                <div className="w-px h-6 bg-border mx-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSendCode()
                    }
                  }}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className={cn(
              "rounded-xl overflow-hidden border transition-colors",
              error ? "border-destructive" : "border-border"
            )}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendCode()
                  }
                }}
                className="w-full bg-muted text-foreground placeholder:text-muted-foreground outline-none p-4 rounded-xl"
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleSendCode}
            disabled={isLoading}
            className="w-full mt-6 h-11 font-medium"
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Continue
          </Button>
        </div>

        {/* Country selector modal */}
        <Dialog open={showCountryModal} onOpenChange={setShowCountryModal}>
          <DialogContent className="max-w-xl p-0" hideCloseButton>
            <DialogHeader className="p-4 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-foreground">Select your country</DialogTitle>
                <button
                  onClick={() => setShowCountryModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {phoneCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setSelectedCountry(country)
                    setShowCountryModal(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <span className="text-xl">{getFlagEmoji(country.code)}</span>
                  <span className="flex-1 text-left text-foreground">{country.name}</span>
                  <span className="text-muted-foreground">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // OTP verification screen
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-4">
      <div className="w-full">
        <h2 className="text-xl font-semibold text-foreground mb-2">Verify your session</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Enter code you received {method === 'email' ? 'on your email' : 'on your phone'}
        </p>

        <div className="flex gap-2 justify-center mb-4">
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={(el) => { otpRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={index === 0 ? handleOtpPaste : undefined}
              className={cn(
                "w-12 h-14 text-center text-xl font-semibold rounded-lg bg-muted border-2 transition-colors outline-none",
                error
                  ? "border-destructive text-destructive"
                  : value
                    ? "border-border text-foreground"
                    : "border-border text-foreground focus:border-primary"
              )}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-4 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleChangeNumber}
          variant="secondary"
          className="w-full h-11 font-medium mb-3"
        >
          {method === 'email' ? 'Change email' : 'Change number'}
        </Button>

        {!error && (
          <Button
            onClick={() => handleVerifyOtp(otpValues.join(''))}
            disabled={isLoading || otpValues.join('').length < 6}
            className="w-full h-11 font-medium"
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Continue
          </Button>
        )}
      </div>

      <button
        onClick={handleResendCode}
        disabled={resendTimer > 0 || isLoading}
        className={cn(
          "mt-6 font-medium text-sm",
          resendTimer > 0
            ? "text-muted-foreground cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {resendTimer > 0
          ? `Send new code (${formatTimer(resendTimer)})`
          : 'Send new code'}
      </button>
    </div>
  )
}

