import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-light text-primary',
        outline: 'border border-border text-muted',
        linkedin: 'bg-linkedin/15 text-linkedin',
        twitter: 'bg-twitter/15 text-twitter',
        instagram: 'bg-instagram/15 text-instagram',
        success: 'bg-success/15 text-success',
        warning: 'bg-warning/15 text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}
