import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '@/global.css';

import { AppErrorBoundary } from '@/components/system/app-error-boundary';
import { CareerStoreProvider } from '@/state/career-store';

const roundOneTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#f25b2a', background: '#090907', card: '#0f0f0d', text: '#f1ede3', border: '#302d26', notification: '#f25b2a' },
};

export default function RootLayout() {
  return <ThemeProvider value={roundOneTheme}><AppErrorBoundary><CareerStoreProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090907' } }}><Stack.Screen name="index" /><Stack.Screen name="[screen]" /></Stack><StatusBar style="light" /></CareerStoreProvider></AppErrorBoundary></ThemeProvider>;
}
