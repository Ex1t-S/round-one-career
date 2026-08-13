import { Link, router } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, Layout, Radius, Spacing } from '@/constants/theme';
import { ScreenId } from '@/constants/routes';
import { getCareerEvent } from '@/data/events';
import { getTeam } from '@/data/teams';
import { useCareerStore } from '@/state/career-store';
import { Badge, ProgressBar } from '@/components/ui/game-ui';
import { TeamCrest } from '@/components/visual/game-marks';
import { GameImage } from '@/components/visual/game-image';

const groups: { label: string; items: { id: ScreenId; label: string; icon: string }[] }[] = [
  { label: 'Carrera', items: [{ id: 'dashboard', label: 'Dashboard', icon: '⌂' }, { id: 'profile', label: 'Perfil', icon: '◎' }, { id: 'timeline', label: 'Timeline', icon: '≡' }, { id: 'decision', label: 'Decisiones', icon: '◆' }, { id: 'calendar', label: 'Calendario', icon: '▦' }] },
  { label: 'Competición', items: [{ id: 'tournament', label: 'Torneos', icon: '◇' }, { id: 'match', label: 'Partidos', icon: '◫' }, { id: 'statistics', label: 'Estadísticas', icon: '∑' }, { id: 'rankings', label: 'Ranking mundial', icon: '↗' }] },
  { label: 'Major', items: [{ id: 'major-hub', label: 'Major Hub', icon: '◆' }, { id: 'swiss-stage', label: 'Swiss Stage', icon: '3' }, { id: 'major-bracket', label: 'Bracket', icon: '⌁' }, { id: 'minigames', label: 'Minijuegos', icon: '◎' }] },
  { label: 'Organización', items: [{ id: 'team', label: 'Equipo', icon: '⬡' }, { id: 'roster', label: 'Roster', icon: '♙' }, { id: 'market', label: 'Mercado', icon: '⇄' }, { id: 'contract', label: 'Contrato', icon: '▤' }] },
  { label: 'Desarrollo', items: [{ id: 'training', label: 'Entrenamiento', icon: '＋' }, { id: 'health', label: 'Salud y fatiga', icon: '♡' }, { id: 'trophies', label: 'Trofeos', icon: '✦' }, { id: 'rivalries', label: 'Rivalidades', icon: '⚔' }] },
  { label: 'Mundo', items: [{ id: 'news', label: 'Noticias', icon: '◧' }, { id: 'social', label: 'Redes', icon: '@' }, { id: 'awards', label: 'Premios', icon: '★' }, { id: 'hall-of-fame', label: 'Hall of Fame', icon: '♛' }] },
  { label: 'Career Lab', items: [{ id: 'analytics', label: 'Career Analytics', icon: '⌁' }, { id: 'records', label: 'Récords', icon: '↑' }, { id: 'trophy-room', label: 'Trophy Room', icon: '▲' }, { id: 'lifestyle', label: 'Lifestyle', icon: '$' }, { id: 'inventory', label: 'Inventario', icon: '□' }, { id: 'investments', label: 'Inversiones', icon: '%' }] },
  { label: 'Final', items: [{ id: 'retirement', label: 'Retiro', icon: '◉' }, { id: 'summary', label: 'Resumen', icon: '□' }, { id: 'settings', label: 'Configuración', icon: '⚙' }] },
];

function navigate(id: ScreenId) { router.push({ pathname: '/[screen]', params: { screen: id } }); }
function getDecisionTitle(id: string) { return getCareerEvent(id)?.title ?? 'Tenés una elección pendiente'; }

export function AppShell({ active, children }: PropsWithChildren<{ active: ScreenId }>) {
  const { width } = useWindowDimensions(); const desktop = width >= 1050;
  const { career, message, clearMessage, advanceToNextAction } = useCareerStore();
  const team = career ? getTeam(career.teamId) : null;
  if (!career || !team) return null;
  const rank = career.rankings.find((entry) => entry.teamId === team.id)?.rank ?? team.initialRanking;
  const navItems = groups.flatMap((group) => group.items);
  const nextAction: { eyebrow: string; title: string; label: string; screen?: ScreenId; tone: string } = career.offseasonPending
    ? { eyebrow: 'TEMPORADA CERRADA', title: 'Completá el balance y definí el próximo año', label: 'Abrir off-season', screen: 'season-review' as ScreenId, tone: Colors.orange }
    : career.pendingMinigame
      ? { eyebrow: 'ACCIÓN BLOQUEANTE', title: 'Resolvé la decisión interactiva pendiente', label: 'Jugar minijuego', screen: 'minigames' as ScreenId, tone: Colors.orange }
      : career.activeMajorId
        ? { eyebrow: 'CAMPAÑA ACTIVA', title: `Continuá el Major · ${career.majorCampaigns.find((item) => item.id === career.activeMajorId)?.stage.replaceAll('-', ' ') ?? 'próxima etapa'}`, label: 'Abrir Major Hub', screen: 'major-hub' as ScreenId, tone: Colors.red }
        : career.pendingMatchId
          ? { eyebrow: 'MATCH DAY', title: 'Elegí el plan táctico y disputá la serie', label: 'Jugar partido', screen: 'match' as ScreenId, tone: Colors.red }
          : career.pendingDecisionId
            ? { eyebrow: `DECISIÓN ${career.decisionSlotsUsed.length + 1}/6`, title: getDecisionTitle(career.pendingDecisionId), label: 'Tomar decisión', screen: 'decision' as ScreenId, tone: Colors.orange }
            : { eyebrow: 'CARRERA EN CURSO', title: 'Avanzá hasta la próxima decisión, serie o campaña', label: 'Continuar carrera', tone: Colors.green };
  const editorial = active === 'training' ? { asset: 'training-center' as const, label: 'PLAYER DEVELOPMENT' } : active === 'health' ? { asset: 'health-recovery' as const, label: 'PERFORMANCE & WELLNESS' } : ['market', 'contract'].includes(active) ? { asset: 'contract-market' as const, label: 'CAREER BUSINESS' } : null;
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.app}>
      {desktop ? <View style={styles.sidebar}>
        <Link href={{ pathname: '/[screen]', params: { screen: 'dashboard' } }} asChild><Pressable style={styles.brand}><Image source={require('../../../assets/images/round-one-icon.png')} style={styles.brandLogo} /><Text style={styles.brandText}>ROUND<Text style={styles.brandAccent}>/</Text>ONE</Text></Pressable></Link>
        <View style={styles.playerMini}><TeamCrest id={team.id} color={team.color} size={38} /><View style={styles.playerMiniCopy}><Text style={styles.nickname}>{career.player.identity.nickname}</Text><Text style={styles.teamLabel}>#{rank} · {team.name}</Text></View><Badge tone={career.player.form >= 60 ? 'green' : 'orange'}>{career.player.form}</Badge></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navScroll}>{groups.map((group) => <View key={group.label} style={styles.navGroup}><Text style={styles.navGroupLabel}>{group.label}</Text>{group.items.map((item) => <Link key={item.id} href={{ pathname: '/[screen]', params: { screen: item.id } }} asChild><Pressable style={StyleSheet.flatten([styles.navItem, active === item.id ? styles.navItemActive : undefined])}><Text style={[styles.navIcon, active === item.id && styles.navTextActive]}>{item.icon}</Text><Text style={[styles.navText, active === item.id && styles.navTextActive]}>{item.label}</Text>{item.id === 'decision' && career.pendingDecisionId ? <View style={styles.navDot} /> : null}{item.id === 'match' && career.pendingMatchId ? <View style={styles.navDot} /> : null}{item.id === 'major-hub' && career.activeMajorId ? <View style={styles.navDot} /> : null}{item.id === 'minigames' && career.pendingMinigame ? <View style={styles.navDot} /> : null}{item.id === 'lifestyle' && career.offseasonPending ? <View style={styles.navDot} /> : null}</Pressable></Link>)}</View>)}</ScrollView>
        <View style={styles.seasonCard}><View style={styles.seasonRow}><Text style={styles.seasonLabel}>TEMPORADA {career.season}</Text><Text style={styles.seasonWeek}>S{career.week}</Text></View><ProgressBar value={((career.month - 1) * 4 + career.week) / 48 * 100} /><Text style={styles.seasonDate}>{String(career.month).padStart(2, '0')}/{career.year}</Text></View>
      </View> : null}
      <View style={styles.main}>
        <View style={[styles.topbar, !desktop && styles.topbarMobile]}><View style={styles.topbarLeft}>{!desktop ? <View style={styles.mobileBrand}><Text style={styles.brandText}>ROUND<Text style={styles.brandAccent}>/</Text>ONE</Text></View> : null}{desktop ? <Text style={styles.topStatus}><Text style={styles.liveDot}>●</Text> {career.offseasonPending ? 'OFF-SEASON PENDING' : career.activeMajorId ? `MAJOR · ${career.majorCampaigns.find((item) => item.id === career.activeMajorId)?.stage.replaceAll('-', ' ')}` : `${career.squad.role.toUpperCase()} · ${career.decisionSlotsUsed.length}/6 CALLS`}</Text> : null}</View><View style={styles.topMetrics}><Text style={styles.topMetric}>${career.player.money.toLocaleString('en-US')}</Text>{desktop ? <><Text style={styles.topMetric}>NW ${Math.round(career.netWorth / 1000)}K</Text><Text style={styles.topMetric}>ROLE {career.squad.roleSecurity}</Text></> : null}<Text style={styles.topMetric}>FAT {career.player.fatigue}</Text></View></View>
        {!desktop ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileNav} contentContainerStyle={styles.mobileNavContent}>{navItems.map((item) => <Link key={item.id} href={{ pathname: '/[screen]', params: { screen: item.id } }} asChild><Pressable style={StyleSheet.flatten([styles.mobileNavItem, active === item.id ? styles.mobileNavItemActive : undefined])}><Text style={[styles.mobileNavText, active === item.id && styles.navTextActive]}>{item.icon} {item.label}</Text></Pressable></Link>)}</ScrollView> : null}
        {message ? <Pressable onPress={clearMessage} style={styles.toast}><Text style={styles.toastDot}>●</Text><Text style={styles.toastText}>{message}</Text><Text style={styles.toastClose}>×</Text></Pressable> : null}
        <ScrollView style={styles.contentScroll} contentContainerStyle={[styles.content, !desktop && styles.contentMobile]} showsVerticalScrollIndicator={false}>
          <View style={[styles.actionDock, { borderColor: nextAction.tone }]}><View style={styles.actionDockCopy}><Text style={[styles.actionDockEyebrow, { color: nextAction.tone }]}>{nextAction.eyebrow}</Text><Text style={styles.actionDockTitle}>{nextAction.title}</Text></View><Pressable accessibilityRole="button" onPress={() => nextAction.screen ? navigate(nextAction.screen) : advanceToNextAction()} style={({ pressed }) => [styles.actionDockButton, { backgroundColor: nextAction.tone, borderColor: nextAction.tone }, pressed && styles.actionDockPressed]}><Text style={styles.actionDockButtonText}>{nextAction.label} →</Text></Pressable></View>
          {editorial ? <GameImage asset={editorial.asset} ratio="cinema" style={styles.editorial}><Text style={styles.editorialLabel}>{editorial.label}</Text></GameImage> : null}{children}
        </ScrollView>
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg }, app: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg },
  sidebar: { width: Layout.sidebar, backgroundColor: Colors.bgRaised, borderRightWidth: 1, borderRightColor: Colors.line, paddingHorizontal: Spacing.lg },
  brand: { height: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.line }, brandLogo: { width: 29, height: 29, borderRadius: 2 }, brandText: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800', letterSpacing: 1.8 }, brandAccent: { color: Colors.orange },
  playerMini: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.line }, playerMiniCopy: { flex: 1 }, nickname: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800' }, teamLabel: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 8, marginTop: 4 },
  navScroll: { paddingVertical: 14, paddingBottom: 26 }, navGroup: { marginBottom: 15 }, navGroupLabel: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 7, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', paddingHorizontal: 10, marginBottom: 6, opacity: 0.68 }, navItem: { height: 35, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: Radius.sm, gap: 10, borderLeftWidth: 2, borderLeftColor: 'transparent' }, navItemActive: { backgroundColor: Colors.panelSoft, borderLeftColor: Colors.orange }, navIcon: { color: Colors.muted, fontSize: 10, width: 16, textAlign: 'center' }, navText: { color: Colors.textSoft, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '600' }, navTextActive: { color: Colors.text }, navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.orange, marginLeft: 'auto' },
  seasonCard: { padding: 12, borderTopWidth: 1, borderTopColor: Colors.line, gap: 8 }, seasonRow: { flexDirection: 'row', justifyContent: 'space-between' }, seasonLabel: { color: Colors.textSoft, fontFamily: Fonts.mono, fontSize: 8, fontWeight: '900' }, seasonWeek: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 8 }, seasonDate: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 8 },
  main: { flex: 1 }, topbar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.bg }, topbarMobile: { height: 54, paddingHorizontal: Spacing.lg }, topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, mobileBrand: {}, topStatus: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, liveDot: { color: Colors.green }, topMetrics: { flexDirection: 'row', gap: 18 }, topMetric: { color: Colors.textSoft, fontFamily: Fonts.mono, fontSize: 8, fontWeight: '800' },
  mobileNav: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.bgRaised }, mobileNavContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 }, mobileNavItem: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.sm }, mobileNavItemActive: { borderColor: Colors.orange, backgroundColor: Colors.orangeSoft }, mobileNavText: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 9, fontWeight: '800' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.xl, marginTop: Spacing.md, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.greenSoft, borderLeftWidth: 3, borderLeftColor: Colors.green }, toastDot: { color: Colors.green, fontSize: 8 }, toastText: { flex: 1, color: Colors.textSoft, fontFamily: Fonts.sans, fontSize: 11 }, toastClose: { color: Colors.muted, fontSize: 17 },
  contentScroll: { flex: 1 }, content: { width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center', padding: Spacing.xl, paddingBottom: 64 }, contentMobile: { padding: Spacing.lg, paddingBottom: 52 },
  actionDock: { minHeight: 76, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, backgroundColor: Colors.bgRaised, borderWidth: 1, borderLeftWidth: 4, paddingHorizontal: 18, paddingVertical: 13, marginBottom: Spacing.xl }, actionDockCopy: { flex: 1, minWidth: 220 }, actionDockEyebrow: { fontFamily: Fonts.mono, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 }, actionDockTitle: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '700', marginTop: 6 }, actionDockButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderRadius: Radius.sm }, actionDockButtonText: { color: Colors.black, fontFamily: Fonts.mono, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }, actionDockPressed: { opacity: 0.72 },
  editorial: { marginBottom: Spacing.lg, maxHeight: 210 }, editorialLabel: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
});
