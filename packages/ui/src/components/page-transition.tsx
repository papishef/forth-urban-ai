import * as React from "react";
import { motion } from "framer-motion";

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const isTestEnv = import.meta.env.MODE === "test";

  if (isTestEnv) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="min-h-screen w-full"
    >
      {children}
    </motion.div>
  );
};
