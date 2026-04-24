'use client';

import { useReducedMotion, type Transition } from 'framer-motion';

type Ease = [number, number, number, number];

type MotionStep = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
  transition: Transition;
};

export function useGrimMotion(): {
  prefersReduced: boolean;
  fade: MotionStep;
  rise: MotionStep;
  stagger: { animate: { transition: { staggerChildren: number } } };
  ease: Ease;
} {
  const prefersReduced = Boolean(useReducedMotion());
  const ease: Ease = [0.2, 0.8, 0.2, 1];
  const none: Transition = { duration: 0, ease };

  if (prefersReduced) {
    const still: MotionStep = {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: none,
    };
    return {
      prefersReduced,
      fade: still,
      rise: still,
      stagger: { animate: { transition: { staggerChildren: 0 } } },
      ease,
    };
  }

  return {
    prefersReduced,
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.22, ease },
    },
    rise: {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -4 },
      transition: { duration: 0.24, ease },
    },
    stagger: { animate: { transition: { staggerChildren: 0.045 } } },
    ease,
  };
}
