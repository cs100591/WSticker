import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'solid' | 'gradient' | 'premium' | 'minimal' | 'elevated';
  interactive?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-5 transition-all duration-300',
          variant === 'default' && 'bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl hover:bg-white/80',
          variant === 'solid' && 'bg-white shadow-lg hover:shadow-xl',
          variant === 'gradient' && 'bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/30 shadow-lg',
          variant === 'premium' && 'bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-2xl border border-blue-200/30 shadow-2xl hover:shadow-2xl hover:border-blue-200/50',
          variant === 'minimal' && 'bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/60',
          variant === 'elevated' && 'bg-white/95 backdrop-blur-lg border border-white/40 shadow-2xl hover:shadow-3xl',
          interactive && 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
GlassCardContent.displayName = 'GlassCardContent';

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent };
