import React from "react";
import { Button, type ButtonProps } from "../ui";
import { cn } from "@/utils/cn";

export default function SmartButton({
  children,
  className,
  ...props
}: ButtonProps & React.RefAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      className={cn(
        "group/btn relative overflow-hidden rounded-xl px-8 py-3 font-semibold text-white transition-all duration-300",
        "w-full xl:w-auto xl:min-w-[140px]",
        "transform active:scale-95",
        "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow group-hover:shadow-lg hover:shadow-xl",
        className
      )}
    >
      {children}
      {/* Button shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover/btn:translate-x-full" />
    </Button>
  );
}
