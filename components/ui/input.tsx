import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-md)] border border-border-default bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_rgba(230,57,70,0.15)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
