/**
 * Centralized Framer Motion Animation Utilities
 * 
 * This file contains reusable animation variants, transitions, and presets
 * for consistent animations across the application.
 */

import { Variants, Transition, TargetAndTransition } from "framer-motion";

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transitions = {
  /** Default smooth transition */
  default: {
    type: "tween",
    duration: 0.3,
    ease: "easeOut",
  } as Transition,

  /** Fast transition for micro-interactions */
  fast: {
    type: "tween",
    duration: 0.15,
    ease: "easeOut",
  } as Transition,

  /** Slow transition for dramatic reveals */
  slow: {
    type: "tween",
    duration: 0.6,
    ease: "easeOut",
  } as Transition,

  /** Spring transition for bouncy effects */
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 20,
  } as Transition,

  /** Gentle spring for subtle bounces */
  gentleSpring: {
    type: "spring",
    stiffness: 200,
    damping: 25,
  } as Transition,

  /** For entrance animations */
  enter: {
    type: "tween",
    duration: 0.4,
    ease: [0.25, 0.1, 0.25, 1],
  } as Transition,

  /** For exit animations */
  exit: {
    type: "tween",
    duration: 0.2,
    ease: "easeIn",
  } as Transition,
} as const;

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { opacity: 0, scale: 0.5 },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
};

export const slideDown: Variants = {
  initial: { y: "-100%" },
  animate: { y: 0 },
  exit: { y: "-100%" },
};

export const slideLeft: Variants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

export const slideRight: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
};

// ============================================================================
// HEIGHT/COLLAPSE ANIMATIONS
// ============================================================================

export const expandCollapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// ============================================================================
// HOVER EFFECTS (use with whileHover prop)
// ============================================================================

export const hoverEffects = {
  /** Subtle scale up */
  scale: { scale: 1.02 } as TargetAndTransition,
  
  /** More noticeable scale */
  scaleLarge: { scale: 1.05 } as TargetAndTransition,
  
  /** Subtle lift effect */
  lift: { y: -2 } as TargetAndTransition,
  
  /** Noticeable lift */
  liftLarge: { y: -4 } as TargetAndTransition,
  
  /** Combined scale and lift */
  scaleAndLift: { scale: 1.02, y: -2 } as TargetAndTransition,
  
  /** Brightness effect (for cards) */
  brighten: { filter: "brightness(1.05)" } as TargetAndTransition,
  
  /** Shift right (for list items) */
  shiftRight: { x: 4 } as TargetAndTransition,
  
  /** Shift left */
  shiftLeft: { x: -4 } as TargetAndTransition,
} as const;

// ============================================================================
// TAP/PRESS EFFECTS (use with whileTap prop)
// ============================================================================

export const tapEffects = {
  /** Scale down on press */
  press: { scale: 0.98 } as TargetAndTransition,
  
  /** Stronger press effect */
  pressDeep: { scale: 0.95 } as TargetAndTransition,
  
  /** Light press */
  pressLight: { scale: 0.99 } as TargetAndTransition,
} as const;

// ============================================================================
// STAGGER CONTAINER (for parent elements)
// ============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// ============================================================================
// STAGGER ITEM (for child elements in stagger containers)
// ============================================================================

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const staggerItemFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
};

// ============================================================================
// VIEWPORT/SCROLL ANIMATIONS (use with whileInView)
// ============================================================================

export const viewportAnimations = {
  /** Standard fade up on scroll */
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: transitions.enter,
  },
  
  /** Fade from left */
  fadeLeft: {
    initial: { opacity: 0, x: -20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: transitions.enter,
  },
  
  /** Fade from right */
  fadeRight: {
    initial: { opacity: 0, x: 20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: transitions.enter,
  },
  
  /** Scale up on scroll */
  scaleUp: {
    initial: { opacity: 0, scale: 0.9 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true },
    transition: transitions.enter,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a delayed transition
 */
export const withDelay = (delay: number, transition: Transition = transitions.default): Transition => ({
  ...transition,
  delay,
});

/**
 * Create a staggered delay based on index
 */
export const staggerDelay = (index: number, baseDelay = 0.05): Transition => ({
  ...transitions.default,
  delay: index * baseDelay,
});

/**
 * Create viewport animation props with custom delay
 */
export const createViewportAnimation = (
  direction: "up" | "down" | "left" | "right" = "up",
  delay = 0
) => {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: -20 },
    right: { x: 20 },
  };

  return {
    initial: { opacity: 0, ...directionMap[direction] },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true },
    transition: { ...transitions.enter, delay },
  };
};

// ============================================================================
// PAGE TRANSITION VARIANTS
// ============================================================================

export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// MODAL/OVERLAY ANIMATIONS
// ============================================================================

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: transitions.exit,
  },
};

export const drawerLeft: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: transitions.enter },
  exit: { x: "-100%", transition: transitions.exit },
};

export const drawerRight: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: transitions.enter },
  exit: { x: "100%", transition: transitions.exit },
};

export const drawerBottom: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: transitions.enter },
  exit: { y: "100%", transition: transitions.exit },
};

// ============================================================================
// LIST ANIMATIONS
// ============================================================================

export const listItem: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

export const gridItem: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// ============================================================================
// NOTIFICATION/TOAST ANIMATIONS
// ============================================================================

export const notification: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: transitions.fast,
  },
};

export const toastFromBottom: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const shake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

export const wiggle: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [-3, 3, -3, 3, 0],
    transition: { duration: 0.5 },
  },
};

// ============================================================================
// TYPING / SKELETON ANIMATIONS
// ============================================================================

export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ============================================================================
// RE-EXPORT motion and AnimatePresence for convenience
// ============================================================================

export { 
  motion, 
  AnimatePresence,
  // Hooks
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useAnimation,
  useMotionValue,
  useMotionValueEvent,
  // Other utilities
  animate,
  stagger,
  inView,
  scroll,
} from "framer-motion";
export type { Variants, Transition, TargetAndTransition, MotionValue } from "framer-motion";
