import type { Transition, Variants } from "framer-motion";

/** Shared B2B motion — keep durations short for snappy feel; callers pass reduceMotion to skip. */
export const easeOutSoft = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const springSnap: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
};

export const fadeUpTransition = (delay = 0): Transition => ({
  duration: 0.36,
  delay,
  ease: easeOutSoft,
});

export const viewportOnce = { once: true, margin: "-40px 0px" as const };
