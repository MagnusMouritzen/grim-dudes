'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useGrimMotion } from '@/lib/useMotion';

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { rise } = useGrimMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={rise.initial}
        animate={rise.animate}
        exit={rise.exit}
        transition={rise.transition}
        className="relative w-full min-w-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
