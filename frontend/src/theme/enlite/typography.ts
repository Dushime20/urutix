// Typography system sourced from Admin → Users (computed styles)

export const enliteTypography = {
  fontFamily: {
    sans: '"Inter", "Mona Sans", system-ui, sans-serif',
    mono: '"Inter", "Mona Sans", system-ui, sans-serif',
  },

  fontSize: {
    '3xs': '0.5625rem', // 9px  — badges
    '2xs': '0.625rem',  // 10px — labels, tabs, buttons, table headers
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px — body, inputs, table cells, nav
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px — section / modal titles
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px — page titles
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },

  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  styles: {
    pageTitle: {
      fontSize: '1.5rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    sectionTitle: {
      fontSize: '1.125rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
      textTransform: 'uppercase' as const,
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    body: {
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: '0.75rem',
      fontWeight: 700,
      lineHeight: 1.5,
    },
    label: {
      fontSize: '0.625rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: '0.625rem',
      fontWeight: 500,
      lineHeight: 1.625,
    },
    tableHeader: {
      fontSize: '0.625rem',
      fontWeight: 900,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    tableBody: {
      fontSize: '0.875rem',
      fontWeight: 900,
      letterSpacing: '-0.025em',
    },
    button: {
      fontSize: '0.625rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    tab: {
      fontSize: '0.625rem',
      fontWeight: 900,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    badge: {
      fontSize: '0.5625rem',
      fontWeight: 900,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    nav: {
      fontSize: '0.875rem',
      fontWeight: 700,
    },
    input: {
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1.5,
    },
    h1: {
      fontSize: '1.5rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.125rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '0.875rem',
      fontWeight: 900,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '0.75rem',
      fontWeight: 900,
      lineHeight: 1.25,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 700,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      fontWeight: 700,
      lineHeight: 1.5,
    },
  },
};

export default enliteTypography;
