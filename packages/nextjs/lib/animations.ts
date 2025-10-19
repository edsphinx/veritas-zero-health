/**
 * Centralized Animation Variants
 *
 * Reusable framer-motion animation configurations
 * to ensure consistency across the app.
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================
// Transitions
// ============================================

export const transitions = {
  /** Fast transition for subtle effects */
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,

  /** Standard transition for most animations */
  standard: { duration: 0.25, ease: 'easeInOut' } as Transition,

  /** Smooth spring transition */
  spring: { type: 'spring', bounce: 0.2, duration: 0.6 } as Transition,

  /** Bouncy spring transition */
  bouncy: { type: 'spring', bounce: 0.4, duration: 0.8 } as Transition,
};

// ============================================
// Fade Variants
// ============================================

export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 20,
  },
};

export const fadeDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

// ============================================
// Slide Variants
// ============================================

export const slideRightVariants: Variants = {
  hidden: {
    x: -100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: -100,
    opacity: 0,
  },
};

export const slideLeftVariants: Variants = {
  hidden: {
    x: 100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: 100,
    opacity: 0,
  },
};

// ============================================
// Scale Variants
// ============================================

export const scaleVariants: Variants = {
  hidden: {
    scale: 0.9,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
  },
};

export const scaleUpVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0.8,
    opacity: 0,
  },
};

// ============================================
// Menu/Dropdown Variants
// ============================================

export const menuVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
};

export const mobileMenuVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
  },
  exit: {
    opacity: 0,
    height: 0,
  },
};

// ============================================
// Modal/Dialog Variants
// ============================================

export const modalOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
};

// ============================================
// List/Stagger Variants
// ============================================

export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
};

// ============================================
// Loading/Skeleton Variants
// ============================================

export const pulseVariants: Variants = {
  initial: {
    opacity: 0.6,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// Page Transition Variants
// ============================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

export const pageSlideVariants: Variants = {
  initial: {
    opacity: 0,
    x: -50,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 50,
  },
};
