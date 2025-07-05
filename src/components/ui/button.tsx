import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-destructive/20",
        outline:
          "border-2 border-border bg-background text-foreground hover:bg-muted hover:border-primary/30 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm border border-secondary/20",
        ghost: "text-foreground hover:bg-muted hover:text-foreground/90",
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
        gradient:
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 border border-primary/20 shadow-sm",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm border border-accent/20",
      },
      size: {
        default: "h-11 px-4 py-2 text-sm",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-14 rounded-lg px-8 text-base font-semibold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
