'use client';

import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

// Helper to merge class names
function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

// Define Button styles and variants using cva
const buttonVariants = cva(
    // Base styles applied to all buttons
    'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-black',
    {
        variants: {
            variant: {
                primary: 'bg-amber-400 text-black hover:bg-amber-300 focus-visible:ring-amber-500 shadow-sm',
                outline: 'border border-amber-400 bg-transparent text-amber-400 hover:bg-amber-400 hover:text-black',
                ghost: 'hover:bg-gray-700 hover:text-white',
            },
            size: {
                default: 'px-5 py-3',
                sm: 'h-9 px-3 rounded-md',
                lg: 'h-11 px-8 rounded-md',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    }
);

// Define the props for the component
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    children,
    variant,
    size,
    href,
    ...props
}, ref) => {
    // If an href is provided, render a Next.js Link
    if (href) {
        return (
            <Link href={href} className={cn(buttonVariants({ variant, size, className }))}>
                {children}
            </Link>
        );
    }

    // Otherwise, render a standard button
    return (
        <button 
            ref={ref}
            className={cn(buttonVariants({ variant, size, className }))} 
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button, buttonVariants };