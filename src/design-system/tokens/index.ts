export const colors = {
  surface: {
    base: '#0a0a0b',
    elevated: '#121214',
    card: '#1a1a1e',
    hover: '#222228',
  },
  accent: {
    primary: '#e50914',
    hover: '#f40612',
    muted: '#b20710',
  },
  gold: '#f5c518',
  text: {
    primary: '#ffffff',
    secondary: '#a1a1ab',
    muted: '#8b8b95',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const typography = {
  fontFamily: {
    sans: '"DM Sans", system-ui, sans-serif',
    display: '"Bebas Neue", system-ui, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '2.5rem',
    hero: 'clamp(2.5rem, 6vw, 5rem)',
  },
} as const;

export const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const transitions = {
  fast: '150ms ease',
  base: '250ms ease',
  slow: '400ms ease',
} as const;
