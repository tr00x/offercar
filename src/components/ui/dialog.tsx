import * as React from "react"
import * as ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogContextType {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType>({})

const Dialog = ({
  children,
  open,
  onOpenChange
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  React.useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

type DialogTriggerProps = {
  asChild?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const DialogTrigger = ({ asChild, children, ...props }: DialogTriggerProps) => {
  const { onOpenChange } = React.useContext(DialogContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => {
        onOpenChange?.(true)
      },
      ...props
    })
  }

  return (
    <button
      onClick={() => onOpenChange?.(true)}
      {...props}
    >
      {children}
    </button>
  )
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  fullScreen?: boolean
  hideCloseOnMobile?: boolean
  hideCloseButton?: boolean
  closeButtonClassName?: string
}

const DialogContent = ({ className, children, fullScreen, hideCloseOnMobile, hideCloseButton, closeButtonClassName, ...props }: DialogContentProps) => {
  const { open, onOpenChange } = React.useContext(DialogContext)

  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full min-w-[320px] sm:min-w-[500px] max-w-[900px] max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide pointer-events-auto",
          fullScreen && "p-0",
          !fullScreen && "p-6 sm:p-8",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <button
            className={cn(
              "absolute right-2 top-2 sm:right-0 sm:-top-12 z-20 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition-colors focus:outline-none",
              hideCloseOnMobile && "hidden sm:flex",
              closeButtonClassName
            )}
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)} {...props} />
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
