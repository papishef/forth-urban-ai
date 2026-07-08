import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button, PageTransition } from "@forth-urban/ui";

export function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 800], [0, 200]);
  const y2 = useTransform(scrollY, [0, 800], [0, -200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const backgroundY = useTransform(scrollY, [0, 1000], ["0%", "50%"]);

  return (
    <PageTransition>
      <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#181818] to-[#5C4033] px-6">
        
        {/* Dynamic Architectural Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden mix-blend-luminosity opacity-40">
          <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 scale-[1.15]"
          >
             {/* Using a placeholder premium architectural photo rotating slowly */}
             <motion.img 
               src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000"
               alt="Modern Architecture"
               className="w-full h-full object-cover origin-center"
               animate={{ rotate: 360, scale: [1, 1.05, 1] }}
               transition={{ duration: 180, ease: "linear", repeat: Infinity }}
             />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />
        </div>

        {/* Floating gradient orbs */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#d4af37]/20 blur-[120px] pointer-events-none z-0"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute -right-32 top-1/2 h-[600px] w-[600px] rounded-full bg-[#FFECE4]/10 blur-[150px] pointer-events-none z-0"
        />

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ opacity }}
            className="flex max-w-3xl flex-col items-center gap-6 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
          >
            <div className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2 mr-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4af37]"></span>
              </span>
              Premium AI Real Estate Experience
            </div>
            
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-xl leading-[1.1]">
              Discover Your <br className="hidden sm:block" />
              <span className="bg-gradient-to-br from-[#d4af37] to-[#FCE3D6] bg-clip-text text-transparent">Premium</span> Future.
            </h1>
            
            <p className="max-w-xl text-lg sm:text-xl text-white/70 leading-relaxed font-light">
              Free readiness quiz, matched Abuja land recommendations, budget &amp; ROI calculators, and a guided path to
              your next site inspection.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <motion.div
                  animate={{ scale: [1, 1.03, 1], boxShadow: ["0px 0px 0px 0px rgba(212,175,55,0)", "0px 0px 20px 2px rgba(212,175,55,0.4)", "0px 0px 0px 0px rgba(212,175,55,0)"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="rounded-xl"
                >
                  <Button variant="premium" size="lg" className="w-full sm:w-[180px] h-14 text-base font-semibold shadow-xl shadow-[#d4af37]/20 border-none">
                    Get started
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-[180px] h-14 text-base font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md">
                  Log in
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Footer with Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative z-10 pb-8 pt-4 flex flex-col items-center justify-center gap-4 opacity-80 mix-blend-screen"
        >
          <img src="/FU-Logo.webp" alt="Forth Urban" className="h-10 w-auto brightness-200 contrast-125 sepia hover:scale-105 transition-transform duration-500" />
          <p className="text-white/40 text-xs tracking-widest font-heading uppercase">
            © {new Date().getFullYear()} Forth Urban. All Rights Reserved.
          </p>
        </motion.div>

      </div>
    </PageTransition>
  );
}
