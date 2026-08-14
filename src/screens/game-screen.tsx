import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/layout/app-shell';
import { SCREEN_IDS, ScreenId } from '@/constants/routes';
import { Colors, Fonts } from '@/constants/theme';
import { useCareerStore } from '@/state/career-store';
import { CalendarView, DashboardView, DecisionView, ProfileView } from './views/career-views';
import { MatchView, RankingsView, TournamentView } from './views/competition-views';
import { ContractView, HealthView, MarketView, RivalriesView, RosterView, TeamView, TrainingView, TrophiesView } from './views/organization-views';
import { HallOfFameView, NewsView, RetirementView, SettingsView, SocialView, SummaryView } from './views/world-views';
import { MajorBracketView, MajorCeremonyView, MajorHubView, MajorMatchCenterView, MajorQualificationView, MinigameCenterView, SwissStageView } from './views/major-views';
import { SeasonReviewView } from './views/economy-views';
import { FinanceCenterView, LegacyCenterView, PerformanceCenterView } from './views/centers-views';

const screens: Record<ScreenId, () => React.JSX.Element | null> = {
  dashboard: DashboardView, profile: ProfileView, timeline: () => <LegacyCenterView initialTab="history" />, decision: DecisionView, calendar: CalendarView,
  tournament: TournamentView, match: MatchView, statistics: () => <PerformanceCenterView initialTab="overview" />, performance: PerformanceCenterView, rankings: RankingsView,
  'major-hub': MajorHubView, 'major-qualification': MajorQualificationView, 'swiss-stage': SwissStageView, 'major-bracket': MajorBracketView, 'major-match': MajorMatchCenterView, minigames: MinigameCenterView, 'major-ceremony': MajorCeremonyView,
  team: TeamView, roster: RosterView, market: MarketView, contract: ContractView, training: TrainingView, health: HealthView, trophies: TrophiesView, rivalries: RivalriesView,
  'season-review': SeasonReviewView, 'financial-report': () => <FinanceCenterView initialTab="cashflow" />, lifestyle: () => <FinanceCenterView initialTab="store" />, inventory: () => <FinanceCenterView initialTab="inventory" />, investments: () => <FinanceCenterView initialTab="investments" />, analytics: () => <PerformanceCenterView initialTab="advanced" />, records: () => <LegacyCenterView initialTab="records" />, 'trophy-room': () => <LegacyCenterView initialTab="trophies" />,
  news: NewsView, social: SocialView, awards: () => <LegacyCenterView initialTab="awards" />, retirement: RetirementView, 'hall-of-fame': HallOfFameView, summary: SummaryView, settings: SettingsView, legacy: LegacyCenterView, finance: FinanceCenterView,
};

export function GameScreen({ screen }: { screen: string }) {
  const { career, hydrated } = useCareerStore();
  const active: ScreenId = SCREEN_IDS.includes(screen as ScreenId) ? screen as ScreenId : 'dashboard';
  useEffect(() => { if (hydrated && !career) router.replace('/'); }, [career, hydrated]);
  if (!hydrated) return <View style={styles.loading}><Text style={styles.loadingText}>CARGANDO DATOS DE LA CARRERA</Text></View>;
  if (!career) return <View style={styles.loading}><Text style={styles.loadingText}>NO HAY UNA CARRERA ACTIVA</Text></View>;
  const Screen = screens[active];
  return <AppShell active={active}><Screen /></AppShell>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }, loadingText: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1.5 } });
