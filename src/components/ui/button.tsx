import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/utils/cn";
import { Spinner } from "../Loading";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent/50 hover:text-accent-foreground hover:border-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        premium:
          "font-bold bg-clip-padding border-[2px] before:-m-[2px] rounded-lg before:rounded-lg border-transparent bg-white dark:bg-secondary text-primary hover:before:bg-gradient-to-r hover:before:from-pink-500 hover:before:to-purple-500 before:bg-gradient-to-r before:from-purple-500 before:to-pink-500 hover:bg-white/90 dark:hover:bg-secondary/90 relative before:content before:absolute before:z-[-1] before:inset-0 before:bg-primary before:transition-opacity before:duration-500 before:delay-100 hover:before:opacity-100",
      },
      size: {
        default: "h-11 py-2.5 px-5",
        sm: "h-10 px-4 text-xs",
        lg: "h-12 px-8",
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
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, children, loading, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // When asChild is used, Slot requires exactly one child.
    // Don't inject Spinner as a sibling — just pass children through.
    if (asChild) {
      return (
        <Comp
          className={cn(
            "relative flex select-none items-center justify-center",
            buttonVariants({ variant, size, className }),
          )}
          data-loading={loading}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(
          "relative flex select-none items-center justify-center",
          buttonVariants({ variant, size, className }),
        )}
        data-loading={loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <Spinner className="absolute text-primary-foreground dark:text-primary" />
        )}
        {loading ? <span className="opacity-0">{children}</span> : children}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
