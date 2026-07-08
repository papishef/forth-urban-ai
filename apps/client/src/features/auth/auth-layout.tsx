import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MotionCard, CardContent, CardHeader, CardTitle, CardDescription, PageTransition, Logo } from "@forth-urban/ui";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <PageTransition>
      <div className="flex min-h-screen bg-gradient-to-br from-[#FFECE4] to-[#fce3d6] overflow-hidden">
        
        {/* Left Side: Premium Image Carousel / Branding banner (Hidden on Mobile) */}
        <div className="hidden w-1/2 lg:flex relative items-end p-12 overflow-hidden bg-[#5C4033]">
          <Link to="/" className="absolute top-10 left-8 z-20">
            <Logo variant="white" className="h-9" />
          </Link>

          <div className="absolute inset-0 z-0">
             {/* Abstract organic shapes behind the glass layer */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
              className="absolute -top-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-[#d4af37]/20 blur-[100px]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#5C4033] via-[#5C4033]/60 to-transparent z-10" />
            
            {/* Placeholder for an actual premium image in production */}
            <img 
               src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000" 
               alt="Premium Architecture" 
               className="h-full w-full object-cover opacity-60 mix-blend-overlay"
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative z-20 max-w-lg mb-8"
          >
            <div className="inline-block rounded-xl border border-white/20 bg-white/10 px-3 py-1 mb-4 backdrop-blur-md">
              <span className="text-sm font-semibold tracking-wide text-white">Forth Urban Premium</span>
            </div>
            <h2 className="text-4xl font-heading font-bold text-white mb-4 leading-tight">
              Invest in your future with AI-guided precision.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Experience land ownership tailored mathematically to your exact readiness and financial capability.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 relative sm:p-12">
          
          {/* Subtle bg glow on the right side */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-white/40 blur-[120px] -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md relative z-10"
          >
            <MotionCard className="!bg-white/60 !border-white/50">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#181818] to-[#5C4033]">{title}</CardTitle>
                <CardDescription className="text-base mt-2 text-[#181818]/60">{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 pt-4">
                {children}
                {footer ? (
                  <div className="pt-2 text-center text-sm font-medium text-[#181818]/70">
                    {footer}
                  </div>
                ) : null}
              </CardContent>
            </MotionCard>
          </motion.div>
        </div>

      </div>
    </PageTransition>
  );
}
