import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@forth-urban/ui";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#FFECE4] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex max-w-xl flex-col gap-4"
      >
        <h1 className="font-heading text-4xl font-bold text-[#181818]">Forth Urban AI Property Advisor</h1>
        <p className="text-[#181818]/70">
          Free readiness quiz, matched Abuja land recommendations, budget &amp; ROI calculators, and a guided path to
          your next site inspection.
        </p>
        <div className="mt-2 flex justify-center gap-3">
          <Link to="/register">
            <Button size="lg">Get started</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Log in
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
