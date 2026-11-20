import { cn } from "@/lib/utils/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
