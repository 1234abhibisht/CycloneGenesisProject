// Cyclone AI Design System - Motion & Animation Tokens (Material Design 3)
export const motionTokens = {
  // Duration Scale (ms)
  duration: {
    instant: 0,
    extraFast: 50,
    fast: 100,
    fastMedium: 150,
    medium: 200,
    mediumSlow: 250,
    slow: 300,
    slowMedium: 350,
    extraSlow: 400,
    verySlow: 500,
    extended: 700,
    long: 1000,
  },

  // Easing Curves (Material Design 3)
  easing: {
    // Standard easing - for most UI transitions
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0.2, 1)',

    // Emphasized easing - for important state changes
    emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',

    // Legacy easing (Material 2)
    legacy: 'cubic-bezier(0.4, 0, 0.2, 1)',
    legacyDecelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    legacyAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    legacyStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Spring-like easings
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    springGentle: 'cubic-bezier(0.25, 1.2, 0.5, 1)',
    springSharp: 'cubic-bezier(0.4, 1.8, 0.6, 1)',

    // Entrance/Exit specific
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',

    // Linear
    linear: 'linear',
  },

  // Semantic Motion Durations
  semanticDuration: {
    // Micro-interactions
    press: 50,           // Button press
    hover: 100,          // Hover state
    focus: 100,          // Focus ring
    ripple: 300,         // Material ripple
    checkbox: 100,       // Checkbox toggle
    radio: 100,          // Radio toggle
    switch: 150,         // Switch toggle
    slider: 100,         // Slider drag

    // Component transitions
    dropdown: 150,       // Dropdown open/close
    tooltip: 100,        // Tooltip show/hide
    toast: 200,          // Toast appear/dismiss
    snackbar: 250,       // Snackbar
    dialog: 200,         // Dialog open/close
    modal: 250,          // Modal
    bottomSheet: 300,    // Bottom sheet
    sideSheet: 250,      // Side sheet
    drawer: 250,         // Navigation drawer
    tab: 150,            // Tab switch
    accordion: 200,      // Accordion expand/collapse
    expansion: 200,      // Expansion panel

    // Navigation
    pageTransition: 300, // Page transitions
    routeChange: 200,    // Route changes
    breadcrumb: 150,     // Breadcrumb navigation

    // Data/Content
    listReorder: 250,    // List reorder
    listInsert: 300,     // List item insert
    listDelete: 200,     // List item delete
    contentLoad: 400,    // Content loading
    skeleton: 1000,      // Skeleton pulse
    refresh: 500,        // Pull to refresh

    // Special
    cyclonePulse: 2000,  // Cyclone animation pulse
    radarSweep: 4000,    // Radar sweep rotation
    particleFloat: 8000, // Particle floating
    gradientShift: 10000, // Gradient background shift
  },

  // Motion Scale (for responsive motion)
  motionScale: {
    reduce: 0,      // prefers-reduced-motion: reduce
    minimal: 0.5,   // Minimal motion
    normal: 1,      // Normal motion
    expressive: 1.5, // Expressive motion
  },

  // Keyframe Animations
  keyframes: {
    // Fade
    fadeIn: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
    fadeOut: {
      '0%': { opacity: 1 },
      '100%': { opacity: 0 },
    },

    // Slide
    slideInFromTop: {
      '0%': { opacity: 0, transform: 'translateY(-16px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
    slideInFromBottom: {
      '0%': { opacity: 0, transform: 'translateY(16px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
    slideInFromLeft: {
      '0%': { opacity: 0, transform: 'translateX(-16px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
    slideInFromRight: {
      '0%': { opacity: 0, transform: 'translateX(16px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
    slideOutToTop: {
      '0%': { opacity: 1, transform: 'translateY(0)' },
      '100%': { opacity: 0, transform: 'translateY(-16px)' },
    },
    slideOutToBottom: {
      '0%': { opacity: 1, transform: 'translateY(0)' },
      '100%': { opacity: 0, transform: 'translateY(16px)' },
    },

    // Scale
    scaleIn: {
      '0%': { opacity: 0, transform: 'scale(0.95)' },
      '100%': { opacity: 1, transform: 'scale(1)' },
    },
    scaleOut: {
      '0%': { opacity: 1, transform: 'scale(1)' },
      '100%': { opacity: 0, transform: 'scale(0.95)' },
    },
    scaleUp: {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.02)' },
      '100%': { transform: 'scale(1)' },
    },

    // Rotate
    rotateIn: {
      '0%': { opacity: 0, transform: 'rotate(-180deg) scale(0.5)' },
      '100%': { opacity: 1, transform: 'rotate(0) scale(1)' },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },

    // Pulse
    pulse: {
      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
      '50%': { opacity: 0.6, transform: 'scale(0.98)' },
    },
    pulseSoft: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.7 },
    },

    // Shimmer
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },

    // Progress
    progressIndeterminate: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },

    // Cyclone specific
    cyclonePulse: {
      '0%, 100%': { transform: 'scale(1)', opacity: 0.4 },
      '50%': { transform: 'scale(1.15)', opacity: 0.2 },
    },
    radarSweep: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    particleFloat: {
      '0%, 100%': { transform: 'translateY(0) translateX(0)' },
      '25%': { transform: 'translateY(-20px) translateX(10px)' },
      '50%': { transform: 'translateY(-10px) translateX(-15px)' },
      '75%': { transform: 'translateY(-30px) translateX(5px)' },
    },
    wave: {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(-50%)' },
    },

    // Loading
    skeletonPulse: {
      '0%': { opacity: 0.4 },
      '50%': { opacity: 0.8 },
      '100%': { opacity: 0.4 },
    },
    spinner: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },

    // Number counter
    countUp: {
      '0%': { opacity: 0, transform: 'translateY(20px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },

    // Typewriter
    typewriter: {
      '0%': { width: 0 },
      '100%': { width: '100%' },
    },

    // Blink
    blink: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0 },
    },

    // Bounce
    bounce: {
      '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
      '40%, 43%': { transform: 'translateY(-15px)' },
      '70%': { transform: 'translateY(-7px)' },
      '90%': { transform: 'translateY(-3px)' },
    },

    // Wiggle
    wiggle: {
      '0%, 100%': { transform: 'rotate(0deg)' },
      '25%': { transform: 'rotate(3deg)' },
      '75%': { transform: 'rotate(-3deg)' },
    },

    // Heartbeat
    heartbeat: {
      '0%': { transform: 'scale(1)' },
      '14%': { transform: 'scale(1.1)' },
      '28%': { transform: 'scale(1)' },
      '42%': { transform: 'scale(1.1)' },
      '70%': { transform: 'scale(1)' },
    },
  },

  // Stagger Delays
  stagger: {
    base: 50,
    item: 30,
    group: 100,
  },
} as const;

export type MotionToken = typeof motionTokens;