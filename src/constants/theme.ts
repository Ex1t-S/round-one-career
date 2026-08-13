import { Platform } from 'react-native';

export const Colors = {
  bg: '#090b10',
  bgRaised: '#0d1017',
  panel: '#121722',
  panelSoft: '#191f2b',
  panelHover: '#202838',
  line: '#293140',
  lineStrong: '#3a4558',
  text: '#f4f1ea',
  textSoft: '#bec5d0',
  muted: '#7e8797',
  orange: '#ff6a2b',
  orangeSoft: '#402116',
  green: '#62d99b',
  greenSoft: '#15362a',
  red: '#f06f72',
  redSoft: '#3b1d22',
  blue: '#75a7ff',
  purple: '#b085f5',
  yellow: '#f2c45d',
  white: '#ffffff',
  black: '#050608',
};

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };
export const Radius = { sm: 2, md: 4, lg: 8, pill: 999 };
export const Layout = { maxWidth: 1440, sidebar: 224, content: 1160 };

export const Fonts = Platform.select({
  web: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
  },
  default: { sans: 'System', mono: 'monospace' },
})!;
