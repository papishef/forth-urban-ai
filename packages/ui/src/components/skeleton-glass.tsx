import { cn } from "../lib/cn.js";
import { motion, type HTMLMotionProps } from "framer-motion";

export const SkeletonGlass = ({ className, ...props }: HTMLMotionProps<"div">) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.5,
        ease: "easeInOut",
      }}
      className={cn("rounded-2xl bg-white/30 backdrop-blur-sm", className)}
      {...props}
    />
  );
};
