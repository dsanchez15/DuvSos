import { HTMLAttributes } from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  neutral: 'bg-text-muted/15 text-text-secondary',
}

export function Badge({ variant = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}

export default Badge
