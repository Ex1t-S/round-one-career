import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '@/global.css';

import { CareerStoreProvider } from '@/state/career-store';

const roundOneTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#ff6a2b', background: '#090b10', card: '#0d1017', text: '#f4f1ea', border: '#293140', notification: '#ff6a2b' },
};

export default function RootLayout() {
  return <ThemeProvider value={roundOneTheme}><CareerStoreProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090b10' } }}><Stack.Screen name="index" /><Stack.Screen name="[screen]" /></Stack><StatusBar style="light" /></CareerStoreProvider></ThemeProvider>;
}
