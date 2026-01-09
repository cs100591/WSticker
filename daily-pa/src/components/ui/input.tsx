import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass' | 'minimal';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
        variant === 'default' && 'border-input bg-background hover:border-blue-300 focus-visible:border-blue-500',
        variant === 'glass' && 'bg-white/50 backdrop-blur-sm border border-white/30 hover:bg-white/60 focus-visible:bg-white/70 focus-visible:border-blue-300',
        variant === 'minimal' && 'bg-transparent border-b border-gray-300 hover:border-gray-400 focus-visible:border-blue-500 rounded-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
