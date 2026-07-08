import * as React from "react";
import { cn } from "../lib/cn.js";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, disabled, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    
    return (
    <motion.div 
      className="relative w-full"
      whileTap={disabled ? {} : { scale: 0.995 }}
    >
      <input
        ref={ref}
        disabled={disabled}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        className={cn(
          "peer flex h-12 w-full rounded-xl border border-white/50 bg-white/60 px-4 text-base text-[#181818] placeholder:text-[#181818]/50 backdrop-blur-sm transition-all duration-300 outline-none focus:outline-none focus:border-[#5C4033]/60 focus:bg-white/80 focus:backdrop-blur-xl focus:shadow-[0_0_0_3px_rgba(92,64,51,0.14),0_8px_32px_-6px_rgba(92,64,51,0.45)] shadow-sm hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50",
          className,
          isPassword && "pr-11"
        )}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 mr-1 text-[#181818]/50 hover:text-[#181818] transition-colors"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </motion.div>
  )},
);
Input.displayName = "Input";
