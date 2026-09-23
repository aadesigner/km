import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLightMotion } from "@/hooks/use-light-motion";

type EnterRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay — capped on desktop; ignored when light motion. */
  delay?: number;
  y?: number;
  /** Fade when scrolled into view (below-the-fold blocks). */
  inView?: boolean;
};

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

/**
 * Page/section enter animation that never blanks content.
 *
 * - Never starts at opacity:0 (SEO + iOS Safari first paint).
 * - Mobile / touch / reduced-motion: plain DOM, instant paint.
 * - Desktop: short transform-only slide; content stays fully readable.
 */
export function EnterReveal({
  children,
  className,
  delay = 0,
  y = 12,
  inView = false,
}: EnterRevealProps) {
  const light = useLightMotion();

  if (light) {
    return <div className={className}>{children}</div>;
  }

  const offset = Math.min(Math.max(y, 0), 16);
  const transition = {
    duration: 0.28,
    ease: EASE,
    delay: Math.min(Math.max(delay, 0), 0.08),
  };

  if (inView) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 1, y: offset }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "100px 0px", amount: 0.01 }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
