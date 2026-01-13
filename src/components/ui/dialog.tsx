import * as React from "react"
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
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ asChild, children, ...props }: any) => {
  const { onOpenChange } = React.useContext(DialogContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        (children as React.ReactElement<any>).props.onClick?.(e)
        onOpenChange?.(true)
      },
      ...props
    } as any)
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

const DialogContent = ({ className, children, ...props }: any) => {
  const { open, onOpenChange } = React.useContext(DialogContext)
  
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="fixed inset-0" 
        onClick={() => onOpenChange?.(false)}
      />
      <div 
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg animate-in fade-in-0 zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
          onClick={() => onOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
