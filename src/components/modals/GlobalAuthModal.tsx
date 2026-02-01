import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AuthCard } from '@/pages/Auth'
import { useAuth } from '@/store/auth'
import { useState } from 'react'
import { BusinessLoginCard } from '@/pages/business/Login'

export function GlobalAuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth()
  const [isBusinessLoginOpen, setIsBusinessLoginOpen] = useState(false)

  // Reset business login state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAuthModal()
      // Small delay to reset internal state after animation
      setTimeout(() => setIsBusinessLoginOpen(false), 300)
    }
  }

  const handleRegisterClick = () => {
    closeAuthModal()
    setIsBusinessLoginOpen(false)
    // Force navigation using window.location to bypass any modal blocking
    window.location.href = '/biz/apply'
  }

  return (
    <>
      <Dialog open={isAuthModalOpen && !isBusinessLoginOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <AuthCard
            onSuccess={closeAuthModal}
            onBusinessLoginClick={() => setIsBusinessLoginOpen(true)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthModalOpen && isBusinessLoginOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <BusinessLoginCard
            onUserLoginClick={() => setIsBusinessLoginOpen(false)}
            onRegisterClick={handleRegisterClick}
            onSuccess={closeAuthModal}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
