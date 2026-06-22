import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/common/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55 shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-amber-600 text-white hover:bg-amber-700 rounded-lg',
        outline: 'border border-border bg-paper text-ink-800 hover:bg-sand-50 rounded-full',
        ghost: 'text-ink-500 hover:text-amber-700 rounded-lg',
        secondary: 'bg-sand-100 text-ink-800 hover:bg-sand-200 rounded-lg',
        destructive: 'bg-red-500 text-white hover:bg-red-600 rounded-lg',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4 text-[14px]',
        lg: 'h-11 px-6 text-[15px]',
        icon: 'h-8 w-8 p-0 text-[13px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
