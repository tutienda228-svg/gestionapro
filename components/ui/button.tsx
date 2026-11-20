import { cn } from "@/lib/utils/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none",
      variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
      variant === "secondary" && "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
      variant === "ghost" && "hover:bg-neutral-100",
      variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";
