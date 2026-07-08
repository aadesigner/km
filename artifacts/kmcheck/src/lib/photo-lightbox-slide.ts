/** Lightbox-only photo slide — plain translateX, no fade / 3D. */

export const LIGHTBOX_SLIDE_PX = 48;

export const LIGHTBOX_SLIDE_TRANSITION = {
  duration: 0.2,
  ease: [0.33, 1, 0.32, 1] as const,
};

export function photoNavDirection(current: number, target: number, length: number): 1 | -1 {
  if (length <= 1) return 1;
  let delta = target - current;
  if (delta > length / 2) delta -= length;
  if (delta < -length / 2) delta += length;
  return delta >= 0 ? 1 : -1;
}

export function lightboxSlideVariants(reducedMotion: boolean | null) {
  if (reducedMotion) {
    return {
      enter: { x: 0 },
      center: { x: 0 },
      exit: { x: 0 },
    };
  }
  return {
    enter: (dir: number) => ({ x: dir * LIGHTBOX_SLIDE_PX }),
    center: { x: 0 },
    exit: (dir: number) => ({ x: dir * -LIGHTBOX_SLIDE_PX }),
  };
}
