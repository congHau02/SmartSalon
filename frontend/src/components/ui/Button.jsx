import React from "react";
import { cn } from "../../lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-pink-600 hover:bg-pink-700 text-white shadow-sm focus:ring-pink-500",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400",
    outline: "border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-pink-500",
    ghost: "hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
