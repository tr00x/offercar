import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AuthCard } from '@/pages/Auth'
import { useAuth } from '@/store/auth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BusinessLoginCard } from '@/pages/business/Login'

export function GlobalAuthModal() {
  const navigate = useNavigate()
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

  return (
    <>
      <Dialog open={isAuthModalOpen && !isBusinessLoginOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <AuthCard
            onSuccess={closeAuthModal}
            hideBusinessRegisterLink
            businessLoginAsButton
            onBusinessLoginClick={() => setIsBusinessLoginOpen(true)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAuthModalOpen && isBusinessLoginOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl">
          <BusinessLoginCard
            onUserLoginClick={() => setIsBusinessLoginOpen(false)}
            onRegisterClick={() => {
              closeAuthModal()
              setIsBusinessLoginOpen(false)
              // Delay navigation to ensure modal is fully closed
              setTimeout(() => {
                navigate('/biz/apply')
              }, 100)
            }}
            onSuccess={closeAuthModal}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
