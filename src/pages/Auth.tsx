import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/store/auth'
import {
  loginWithEmail,
  loginWithPhone,
  confirmEmailOtp,
  confirmPhoneOtp,
} from '@/api/auth'
import { Mail, Phone, ArrowLeft } from 'lucide-react'

type AuthMethod = 'email' | 'phone'
type AuthStep = 'input' | 'otp'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
})

const otpSchema = z.object({
  otp: z.string().min(4, 'Please enter the verification code'),
})

export function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [method, setMethod] = useState<AuthMethod>('email')
  const [step, setStep] = useState<AuthStep>('input')
  const [credential, setCredential] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string })?.from || '/'

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const handleSendCode = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (method === 'email') {
        const { email } = emailForm.getValues()
        await loginWithEmail(email)
        setCredential(email)
      } else {
        const { phone } = phoneForm.getValues()
        await loginWithPhone(phone)
        setCredential(phone)
      }
      setStep('otp')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send code'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const { otp } = otpForm.getValues()
      let response

      if (method === 'email') {
        response = await confirmEmailOtp(credential, otp)
      } else {
        response = await confirmPhoneOtp(credential, otp)
      }

      await login(response.access_token, response.refresh_token)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('input')
    setError(null)
    otpForm.reset()
  }

  const switchMethod = (newMethod: AuthMethod) => {
    setMethod(newMethod)
    setStep('input')
    setError(null)
    emailForm.reset()
    phoneForm.reset()
    otpForm.reset()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {step === 'input' ? 'Welcome to MashynBazar' : 'Enter verification code'}
          </CardTitle>
          <CardDescription>
            {step === 'input'
              ? 'Sign in or create an account to continue'
              : `We sent a code to ${credential}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {step === 'input' ? (
            <>
              {/* Method tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={method === 'email' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => switchMethod('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={method === 'phone' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => switchMethod('phone')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </Button>
              </div>

              {/* Email form */}
              {method === 'email' && (
                <form
                  onSubmit={emailForm.handleSubmit(handleSendCode)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      {...emailForm.register('email')}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {emailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                    Continue with Email
                  </Button>
                </form>
              )}

              {/* Phone form */}
              {method === 'phone' && (
                <form
                  onSubmit={phoneForm.handleSubmit(handleSendCode)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      {...phoneForm.register('phone')}
                    />
                    {phoneForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {phoneForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                    Continue with Phone
                  </Button>
                </form>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Google login */}
              <Button variant="outline" className="w-full" disabled>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Business link */}
              <div className="text-center text-sm text-muted-foreground mt-6 space-y-1">
                <p>
                  Are you a business?{' '}
                  <a href="/biz/apply" className="text-primary hover:underline">
                    Register here
                  </a>
                </p>
                <p>
                  Already have a business account?{' '}
                  <a href="/biz/auth" className="text-primary hover:underline">
                    Log in
                  </a>
                </p>
              </div>
            </>
          ) : (
            /* OTP form */
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter code"
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  {...otpForm.register('otp')}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-destructive">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Verify
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleSendCode}
                  disabled={isLoading}
                >
                  Resend
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
