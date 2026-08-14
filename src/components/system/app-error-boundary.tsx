import { Component, ErrorInfo, PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type ErrorState = { error?: Error };

export class AppErrorBoundary extends Component<PropsWithChildren, ErrorState> {
  state: ErrorState = {};

  static getDerivedStateFromError(error: Error): ErrorState { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ROUND/ONE UI boundary', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <View style={styles.page}><Text style={styles.code}>UI / RECOVERY</Text><Text style={styles.title}>La interfaz encontró un problema.</Text><Text style={styles.copy}>Tu carrera sigue guardada. Reintentá la vista; si el error continúa, reiniciá la aplicación sin borrar la partida.</Text><Pressable accessibilityRole="button" onPress={() => this.setState({ error: undefined })} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>REINTENTAR VISTA →</Text></Pressable><Text style={styles.detail}>{this.state.error.message}</Text></View>;
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', backgroundColor: Colors.bg, padding: Spacing.huge, borderLeftWidth: 6, borderLeftColor: Colors.orange },
  code: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 34, fontWeight: '800', marginTop: 15, maxWidth: 620 },
  copy: { color: Colors.textSoft, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, marginTop: 12, maxWidth: 620 },
  button: { minHeight: 44, backgroundColor: Colors.orange, justifyContent: 'center', paddingHorizontal: 18, marginTop: 24 },
  buttonText: { color: Colors.black, fontFamily: Fonts.mono, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  detail: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 10, lineHeight: 13, marginTop: 20, maxWidth: 720 },
  pressed: { opacity: 0.7 },
});
