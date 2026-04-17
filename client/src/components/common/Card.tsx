import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export default function Card({ className, glass = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_18px_38px_-22px_rgba(2,6,23,0.85)]",
        glass && "glass-card border-white/40",
        className
      )}
      {...props}
    />
  );
}
