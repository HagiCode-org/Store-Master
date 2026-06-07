import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors', {
  variants: {
    variant: {
      default: 'border-primary/15 bg-primary/8 text-primary',
      secondary: 'border-border bg-secondary text-secondary-foreground',
      outline: 'border-border bg-transparent text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
