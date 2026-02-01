import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/store/auth'
import { loginBusiness, setTokens } from '@/api/auth'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import { getProfile, getThirdPartyProfile } from '@/api/profile'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Please enter your password'),
})

type LoginFormData = z.infer<typeof loginSchema>

type BusinessLoginCardProps = {
  onUserLoginClick?: () => void
  onRegisterClick?: () => void
  onSuccess?: () => void
}

export function BusinessLoginCard({ onUserLoginClick, onRegisterClick, onSuccess }: BusinessLoginCardProps) {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await loginBusiness(data)
      setTokens(response.access_token, response.refresh_token)
      await refreshUser()

      let roleId = 2
      try {
        const profile = await getProfile()
        if (typeof profile.role_id === 'number') {
          roleId = profile.role_id
        }

        if (!roleId || roleId < 2) {
          try {
            const thirdParty = await getThirdPartyProfile()
            if (thirdParty?.role_id) {
              roleId = thirdParty.role_id
            }
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile for redirect', e)
      }

      toast.success('Login successful!')

      if (onSuccess) {
        onSuccess()
      }

      switch (roleId) {
        case 2: navigate('/biz/dealer/garage'); break;
        case 3: navigate('/biz/logistic/dashboard'); break;
        case 4: navigate('/biz/broker/dashboard'); break;
        case 5: navigate('/biz/service/dashboard'); break;
        default: navigate('/biz/dealer/garage');
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Invalid email or password')
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto py-4">
      <h2 className="text-xl font-semibold text-foreground text-center mb-1">Business Login</h2>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Sign in to your business account
      </p>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="biz-email">Email address</Label>
          <Input
            id="biz-email"
            type="email"
            placeholder="Enter your business email"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-password">Password</Label>
          <Input
            id="biz-password"
            type="password"
            placeholder="Enter your password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium"
          disabled={isLoading}
        >
          {isLoading && <Spinner size="sm" className="mr-2" />}
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-muted-foreground text-sm">
          Don't have a business account?{' '}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onRegisterClick?.()
            }}
          >
            Register here
          </button>
        </p>

        {onUserLoginClick && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onUserLoginClick}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to user login</span>
          </Button>
        )}
      </div>
    </div>
  )
}
