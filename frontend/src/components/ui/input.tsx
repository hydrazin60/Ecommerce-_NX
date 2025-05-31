import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
        "flex h-9 w-full min-w-0 border border-blue-500 bg-transparent px-3 py-1 text-base shadow-xs transition-all outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        
        // 🔵 Blue shadow (ring) and border on focus
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",

        className
      )}
      {...props}
    />
  );
}

export { Input };
