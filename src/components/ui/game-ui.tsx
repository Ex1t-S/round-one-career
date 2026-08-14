import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export function Panel({ children, style, accent }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accent?: 'orange' | 'green' | 'red' }>) {
  return <View style={[styles.panel, accent === 'orange' && styles.panelOrange, accent === 'green' && styles.panelGreen, accent === 'red' && styles.panelRed, style]}>{children}</View>;
}

export function Eyebrow({ children, color = Colors.muted }: PropsWithChildren<{ color?: string }>) { return <Text style={[styles.eyebrow, { color }]}>{children}</Text>; }
export function Title({ children, size = 'large' }: PropsWithChildren<{ size?: 'hero' | 'large' | 'medium' }>) { return <Text style={[styles.title, size === 'hero' && styles.hero, size === 'medium' && styles.medium]}>{children}</Text>; }
export function Body({ children, muted = false, style }: PropsWithChildren<{ muted?: boolean; style?: StyleProp<ViewStyle> }>) { return <Text style={[styles.body, muted && styles.muted, style as never]}>{children}</Text>; }

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'neutral' | 'orange' | 'green' | 'red' | 'blue' | 'purple' }>) {
  const palette = { neutral: [Colors.panelSoft, Colors.textSoft], orange: [Colors.orangeSoft, Colors.orange], green: [Colors.greenSoft, Colors.green], red: [Colors.redSoft, Colors.red], blue: ['#142b4f', Colors.blue], purple: ['#2a1f42', Colors.purple] }[tone];
  return <View style={[styles.badge, { backgroundColor: palette[0] }]}><Text style={[styles.badgeText, { color: palette[1] }]}>{children}</Text></View>;
}

export function Button({ label, onPress, variant = 'primary', disabled = false, compact = false }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean; compact?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[`button${variant[0].toUpperCase()}${variant.slice(1)}` as keyof typeof styles], compact && styles.buttonCompact, disabled && styles.disabled, pressed && styles.pressed]}><Text style={[styles.buttonText, variant === 'primary' && styles.buttonTextDark, variant === 'danger' && styles.buttonTextDanger]}>{label}</Text></Pressable>;
}

export function Metric({ label, value, detail, tone = 'neutral' }: { label: string; value: string | number; detail?: string; tone?: 'neutral' | 'orange' | 'green' | 'red' }) {
  const color = tone === 'orange' ? Colors.orange : tone === 'green' ? Colors.green : tone === 'red' ? Colors.red : Colors.text;
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color }]}>{value}</Text>{detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}</View>;
}

export function ProgressBar({ value, color = Colors.orange, height = 5 }: { value: number; color?: string; height?: number }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return <View style={[styles.progressTrack, { height }]}><View style={[styles.progressFill, { width: `${safe}%`, backgroundColor: color, height }]} /></View>;
}

export function StatRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return <View style={styles.statRow}><View style={styles.statHeader}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statNumber}>{Math.round(value)}</Text></View><ProgressBar value={value} color={color} /></View>;
}

export function TeamMark({ code, color, size = 44 }: { code: string; color: string; size?: number }) {
  return <View style={[styles.teamMark, { width: size, height: size, borderColor: color }]}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.teamMarkText, { color, maxWidth: size - 8 }]}>{code}</Text></View>;
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <View style={styles.sectionHeader}><View style={styles.sectionHeaderCopy}>{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{action}</View>;
}

export function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.panel, borderWidth: 1, borderColor: Colors.line, padding: Spacing.lg, borderRadius: Radius.md },
  panelOrange: { borderLeftWidth: 3, borderLeftColor: Colors.orange }, panelGreen: { borderLeftWidth: 3, borderLeftColor: Colors.green }, panelRed: { borderLeftWidth: 3, borderLeftColor: Colors.red },
  eyebrow: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1 },
  hero: { fontSize: 52, lineHeight: 56, letterSpacing: -2 }, medium: { fontSize: 23, lineHeight: 28 },
  body: { color: Colors.textSoft, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, muted: { color: Colors.muted },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.line }, badgeText: { fontFamily: Fonts.sans, fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 0.35, textTransform: 'uppercase' },
  button: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 11, borderWidth: 1, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: Colors.orange, borderColor: Colors.orange }, buttonSecondary: { backgroundColor: Colors.panelSoft, borderColor: Colors.lineStrong }, buttonDanger: { backgroundColor: Colors.redSoft, borderColor: Colors.red }, buttonGhost: { backgroundColor: 'transparent', borderColor: Colors.line },
  buttonCompact: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 13 }, buttonText: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 0.25 }, buttonTextDark: { color: Colors.black }, buttonTextDanger: { color: Colors.red },
  disabled: { opacity: 0.35 }, pressed: { opacity: 0.72 },
  metric: { minWidth: 100, flex: 1 }, metricLabel: { color: Colors.muted, fontFamily: Fonts.sans, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 0.55, textTransform: 'uppercase' }, metricValue: { fontFamily: Fonts.sans, fontSize: 25, lineHeight: 30, fontWeight: '800', marginTop: 7, letterSpacing: -0.5 }, metricDetail: { color: Colors.muted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17, marginTop: 4 },
  progressTrack: { width: '100%', backgroundColor: Colors.panelSoft, overflow: 'hidden' }, progressFill: {}, statRow: { gap: 7, marginBottom: 13 }, statHeader: { flexDirection: 'row', justifyContent: 'space-between' }, statLabel: { color: Colors.muted, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }, statNumber: { color: Colors.text, fontFamily: Fonts.mono, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  teamMark: { borderWidth: 1, backgroundColor: Colors.bgRaised, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm }, teamMarkText: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: Spacing.md, marginTop: 3, marginBottom: Spacing.lg }, sectionHeaderCopy: { flex: 1 }, sectionTitle: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: -0.35 },
  divider: { height: 1, backgroundColor: Colors.line, marginVertical: Spacing.lg },
});
