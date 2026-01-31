import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">{children}</div>
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-background rounded-lg shadow-lg p-6 w-full max-w-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mb-4">{children}</div>
}

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h2 className={cn('text-2xl font-semibold', className)} {...props}>
      {children}
    </h2>
  )
}

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  )
}

const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
