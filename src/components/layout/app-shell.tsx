import { router } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Layout, Radius, Spacing } from '@/constants/theme';
import { ScreenId } from '@/constants/routes';
import { getTeam } from '@/data/teams';
import { useCareerStore } from '@/state/career-store';
import { Badge, ProgressBar, TeamMark } from '@/components/ui/game-ui';

const groups: { label: string; items: { id: ScreenId; label: string; icon: string }[] }[] = [
  { label: 'Carrera', items: [{ id: 'dashboard', label: 'Dashboard', icon: '⌂' }, { id: 'profile', label: 'Perfil', icon: '◎' }, { id: 'timeline', label: 'Timeline', icon: '≡' }, { id: 'decision', label: 'Decisiones', icon: '◆' }, { id: 'calendar', label: 'Calendario', icon: '▦' }] },
  { label: 'Competición', items: [{ id: 'tournament', label: 'Torneos', icon: '◇' }, { id: 'match', label: 'Partidos', icon: '◫' }, { id: 'statistics', label: 'Estadísticas', icon: '∑' }, { id: 'rankings', label: 'Ranking mundial', icon: '↗' }] },
  { label: 'Organización', items: [{ id: 'team', label: 'Equipo', icon: '⬡' }, { id: 'roster', label: 'Roster', icon: '♙' }, { id: 'market', label: 'Mercado', icon: '⇄' }, { id: 'contract', label: 'Contrato', icon: '▤' }] },
  { label: 'Desarrollo', items: [{ id: 'training', label: 'Entrenamiento', icon: '＋' }, { id: 'health', label: 'Salud y fatiga', icon: '♡' }, { id: 'trophies', label: 'Trofeos', icon: '✦' }, { id: 'rivalries', label: 'Rivalidades', icon: '⚔' }] },
  { label: 'Mundo', items: [{ id: 'news', label: 'Noticias', icon: '◧' }, { id: 'social', label: 'Redes', icon: '@' }, { id: 'awards', label: 'Premios', icon: '★' }, { id: 'hall-of-fame', label: 'Hall of Fame', icon: '♛' }] },
  { label: 'Final', items: [{ id: 'retirement', label: 'Retiro', icon: '◉' }, { id: 'summary', label: 'Resumen', icon: '□' }, { id: 'settings', label: 'Configuración', icon: '⚙' }] },
];

function navigate(id: ScreenId) { router.push({ pathname: '/[screen]', params: { screen: id } }); }

export function AppShell({ active, children }: PropsWithChildren<{ active: ScreenId }>) {
  const { width } = useWindowDimensions(); const desktop = width >= 1050;
  const { career, message, clearMessage } = useCareerStore();
  const team = career ? getTeam(career.teamId) : null;
  if (!career || !team) return null;
  const rank = career.rankings.find((entry) => entry.teamId === team.id)?.rank ?? team.initialRanking;
  const navItems = groups.flatMap((group) => group.items);
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.app}>
      {desktop ? <View style={styles.sidebar}>
        <Pressable onPress={() => navigate('dashboard')} style={styles.brand}><Image source={require('../../../assets/images/round-one-icon.png')} style={styles.brandLogo} /><Text style={styles.brandText}>ROUND<Text style={styles.brandAccent}>/</Text>ONE</Text></Pressable>
        <View style={styles.playerMini}><TeamMark code={team.abbreviation} color={team.color} size={38} /><View style={styles.playerMiniCopy}><Text style={styles.nickname}>{career.player.identity.nickname}</Text><Text style={styles.teamLabel}>#{rank} · {team.name}</Text></View><Badge tone={career.player.form >= 60 ? 'green' : 'orange'}>{career.player.form}</Badge></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navScroll}>{groups.map((group) => <View key={group.label} style={styles.navGroup}><Text style={styles.navGroupLabel}>{group.label}</Text>{group.items.map((item) => <Pressable key={item.id} onPress={() => navigate(item.id)} style={[styles.navItem, active === item.id && styles.navItemActive]}><Text style={[styles.navIcon, active === item.id && styles.navTextActive]}>{item.icon}</Text><Text style={[styles.navText, active === item.id && styles.navTextActive]}>{item.label}</Text>{item.id === 'decision' && career.pendingDecisionId ? <View style={styles.navDot} /> : null}{item.id === 'match' && career.pendingMatchId ? <View style={styles.navDot} /> : null}</Pressable>)}</View>)}</ScrollView>
        <View style={styles.seasonCard}><View style={styles.seasonRow}><Text style={styles.seasonLabel}>TEMPORADA {career.season}</Text><Text style={styles.seasonWeek}>S{career.week}</Text></View><ProgressBar value={((career.month - 1) * 4 + career.week) / 48 * 100} /><Text style={styles.seasonDate}>{String(career.month).padStart(2, '0')}/{career.year}</Text></View>
      </View> : null}
      <View style={styles.main}>
        <View style={styles.topbar}><View style={styles.topbarLeft}>{!desktop ? <View style={styles.mobileBrand}><Text style={styles.brandText}>ROUND<Text style={styles.brandAccent}>/</Text>ONE</Text></View> : null}<Text style={styles.topStatus}><Text style={styles.liveDot}>●</Text> CAREER LIVE</Text></View><View style={styles.topMetrics}><Text style={styles.topMetric}>${career.player.money.toLocaleString('en-US')}</Text><Text style={styles.topMetric}>TP {career.player.trainingPoints}</Text><Text style={styles.topMetric}>FAT {career.player.fatigue}</Text></View></View>
        {!desktop ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileNav} contentContainerStyle={styles.mobileNavContent}>{navItems.map((item) => <Pressable key={item.id} onPress={() => navigate(item.id)} style={[styles.mobileNavItem, active === item.id && styles.mobileNavItemActive]}><Text style={[styles.mobileNavText, active === item.id && styles.navTextActive]}>{item.icon} {item.label}</Text></Pressable>)}</ScrollView> : null}
        {message ? <Pressable onPress={clearMessage} style={styles.toast}><Text style={styles.toastDot}>●</Text><Text style={styles.toastText}>{message}</Text><Text style={styles.toastClose}>×</Text></Pressable> : null}
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg }, app: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg },
  sidebar: { width: Layout.sidebar, backgroundColor: Colors.bgRaised, borderRightWidth: 1, borderRightColor: Colors.line, paddingHorizontal: Spacing.md },
  brand: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.line }, brandLogo: { width: 32, height: 32, borderRadius: 4 }, brandText: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '900', letterSpacing: 1.7 }, brandAccent: { color: Colors.orange },
  playerMini: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.line }, playerMiniCopy: { flex: 1 }, nickname: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '900' }, teamLabel: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 8, marginTop: 3 },
  navScroll: { paddingVertical: 12, paddingBottom: 24 }, navGroup: { marginBottom: 12 }, navGroupLabel: { color: '#4e586b', fontFamily: Fonts.mono, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 9, marginBottom: 5 }, navItem: { height: 33, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, borderRadius: Radius.sm, gap: 10 }, navItemActive: { backgroundColor: Colors.orangeSoft, borderLeftWidth: 2, borderLeftColor: Colors.orange }, navIcon: { color: Colors.muted, fontSize: 11, width: 16, textAlign: 'center' }, navText: { color: Colors.muted, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '700' }, navTextActive: { color: Colors.orange }, navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.orange, marginLeft: 'auto' },
  seasonCard: { padding: 12, borderTopWidth: 1, borderTopColor: Colors.line, gap: 8 }, seasonRow: { flexDirection: 'row', justifyContent: 'space-between' }, seasonLabel: { color: Colors.textSoft, fontFamily: Fonts.mono, fontSize: 8, fontWeight: '900' }, seasonWeek: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 8 }, seasonDate: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 8 },
  main: { flex: 1 }, topbar: { height: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.bgRaised }, topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, mobileBrand: {}, topStatus: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, liveDot: { color: Colors.green }, topMetrics: { flexDirection: 'row', gap: 17 }, topMetric: { color: Colors.textSoft, fontFamily: Fonts.mono, fontSize: 9, fontWeight: '800' },
  mobileNav: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.bgRaised }, mobileNavContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 }, mobileNavItem: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.sm }, mobileNavItemActive: { borderColor: Colors.orange, backgroundColor: Colors.orangeSoft }, mobileNavText: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 9, fontWeight: '800' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.xl, marginTop: Spacing.md, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.greenSoft, borderWidth: 1, borderColor: '#28654e' }, toastDot: { color: Colors.green, fontSize: 8 }, toastText: { flex: 1, color: Colors.textSoft, fontFamily: Fonts.sans, fontSize: 11 }, toastClose: { color: Colors.muted, fontSize: 17 },
  contentScroll: { flex: 1 }, content: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', padding: Spacing.xl, paddingBottom: 64 },
});
