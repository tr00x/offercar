import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getProfile, getThirdPartyProfile } from '@/api/profile'
import { getImageUrl } from '@/api/client'
import type { Destination } from '@/types'
import {
  User,
  Info,
  MapPin,
  Mail,
  MessageCircle,
  Phone as PhoneIcon,
  Settings
} from 'lucide-react'

export function LogisticDashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: thirdPartyProfile, isLoading: thirdPartyLoading } = useQuery({
    queryKey: ['third-party-profile'],
    queryFn: getThirdPartyProfile,
  })

  const isLoading = profileLoading || thirdPartyLoading

  const displayName = thirdPartyProfile?.company_name || profile?.name || 'Logistic partner'

  let registeredText = ''
  if (thirdPartyProfile?.registered) {
    const date = new Date(thirdPartyProfile.registered)
    if (!Number.isNaN(date.getTime())) {
      registeredText = date.toLocaleDateString()
    }
  }

  const contacts = thirdPartyProfile?.contacts || profile?.contacts || {}
  const mainPhone = profile?.phone || thirdPartyProfile?.phone || ''
  const email = thirdPartyProfile?.email || profile?.email || ''
  const whatsapp = contacts.whatsapp
  const telegram = contacts.telegram
  const destinations = (thirdPartyProfile?.destinations || []) as Destination[]
  const address = thirdPartyProfile?.address || profile?.address || ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center px-4 py-6 pb-24">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Profile</h1>
          <Button asChild variant="ghost" size="sm">
            <Link to="/biz/profile">
              <Settings className="h-4 w-4 mr-1" />
              Edit profile
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden bg-card/95 border-border/60 shadow-lg">
          <CardContent className="p-0">
            <div className="relative">
              <div className="h-32 overflow-hidden bg-muted">
                {thirdPartyProfile?.banner && (
                  <img
                    src={getImageUrl(thirdPartyProfile.banner)}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-card bg-muted overflow-hidden">
                {thirdPartyProfile?.avatar || profile?.avatar ? (
                  <img
                    src={getImageUrl(thirdPartyProfile?.avatar || profile?.avatar || '')}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <div className="absolute top-3 right-3">
                <Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                  <Link to="/biz/profile">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-10 px-4 pb-4 space-y-4">
              <div className="space-y-1">
                <div className="text-base font-semibold truncate">{displayName}</div>
                {registeredText && (
                  <div className="text-xs text-muted-foreground">
                    Registered {registeredText}
                  </div>
                )}
              </div>

              {thirdPartyProfile?.about_us && (
                <section className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="h-4 w-4" />
                      <span>About us</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {thirdPartyProfile.about_us}
                  </p>
                </section>
              )}

              <section className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>Destinations</span>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link to="/biz/profile">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {destinations.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {destinations.map((dest) => (
                      <div
                        key={dest.id}
                        className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{dest.from_country?.flag}</span>
                          <span>{dest.from_country?.name}</span>
                        </div>
                        <span className="text-muted-foreground mx-2">→</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{dest.to_country?.flag}</span>
                          <span>{dest.to_country?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No destinations added yet.
                  </p>
                )}
              </section>

              <section className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageCircle className="h-4 w-4" />
                    <span>Contacts</span>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link to="/biz/profile">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2 text-xs">
                  {email && (
                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                      <span className="truncate max-w-[60%] text-muted-foreground">
                        {email}
                      </span>
                    </div>
                  )}
                  {whatsapp && (
                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </div>
                      <span className="truncate max-w-[60%] text-muted-foreground">
                        {whatsapp}
                      </span>
                    </div>
                  )}
                  {telegram && (
                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Telegram</span>
                      </div>
                      <span className="truncate max-w-[60%] text-muted-foreground">
                        {telegram}
                      </span>
                    </div>
                  )}
                  {mainPhone && (
                    <div className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/40">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        <span>Call</span>
                      </div>
                      <span className="truncate max-w-[60%] text-muted-foreground">
                        {mainPhone}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {address && (
                <section className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {address}
                  </p>
                </section>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
