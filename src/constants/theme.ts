import { Platform } from 'react-native';

export const Colors = {
  bg: '#090907',
  bgRaised: '#0f0f0d',
  panel: '#151512',
  panelSoft: '#1c1b17',
  panelHover: '#24221c',
  line: '#302d26',
  lineStrong: '#4b463a',
  text: '#f1ede3',
  textSoft: '#c2bcb0',
  muted: '#827c70',
  orange: '#f25b2a',
  orangeSoft: '#2c1710',
  green: '#7fba91',
  greenSoft: '#14251a',
  red: '#d96b63',
  redSoft: '#2a1715',
  blue: '#7f9eb5',
  purple: '#9b88ad',
  yellow: '#c9a95c',
  white: '#faf8f2',
  black: '#070706',
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };
export const Radius = { sm: 1, md: 2, lg: 5, pill: 999 };
export const Layout = { maxWidth: 1420, sidebar: 236, content: 1180 };

export const Fonts = Platform.select({
  web: {
    sans: "'Segoe UI Variable Text', 'Segoe UI', Inter, Arial, ui-sans-serif, system-ui, sans-serif",
    mono: "'Cascadia Mono', 'SFMono-Regular', Consolas, monospace",
  },
  default: { sans: 'System', mono: 'monospace' },
})!;

export const Typography = {
  micro: { fontSize: 10, lineHeight: 14 },
  label: { fontSize: 11, lineHeight: 15, letterSpacing: 0.6 },
  bodySmall: { fontSize: 12, lineHeight: 18 },
  body: { fontSize: 14, lineHeight: 21 },
  titleSmall: { fontSize: 22, lineHeight: 27 },
  title: { fontSize: 34, lineHeight: 39 },
};
