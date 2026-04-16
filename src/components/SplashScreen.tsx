import { motion } from "motion/react";
import splashBg from "@/assets/splash-bg.jpg";
import logoImg from "@/assets/overseez-logo.png";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Full-page background image */}
      <img
        src={splashBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Logo slides up from below centre into final position */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.img
          src={logoImg}
          alt="Overseez"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ height: 72, width: "auto", imageRendering: "crisp-edges" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
