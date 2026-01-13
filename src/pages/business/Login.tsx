import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/store/auth'
import { loginBusiness, setTokens } from '@/api/auth'
import { Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { AxiosError } from 'axios'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Please enter your password'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function BusinessLogin() {
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

      toast.success('Login successful!')
      
      // Redirect based on role
      switch (roleId) {
        case 2: navigate('/biz/dealer/garage'); break;
        case 3: navigate('/biz/logistic/dashboard'); break;
        case 4: navigate('/biz/broker/dashboard'); break;
        case 5: navigate('/biz/service/dashboard'); break;
        default: navigate('/biz/dealer/garage');
      }
    } catch (err: unknown) {
      let message = 'Invalid email or password'
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>
      // Extract server-provided message if available
      const serverMsg =
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.error ||
        axiosErr?.message
      if (serverMsg) {
        message = typeof serverMsg === 'string' ? serverMsg : message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Business Login</CardTitle>
          <CardDescription>
            Sign in to manage your dealership
          </CardDescription>
          <div className="mt-3 text-xs text-muted-foreground">
            Use the password sent in approval email.
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your business email"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner size="sm" className="mr-2" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Don't have a business account?{' '}
              <Link to="/biz/apply" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
            <p className="mt-2">
              <Link to="/auth" className="text-muted-foreground hover:text-foreground">
                Back to user login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
