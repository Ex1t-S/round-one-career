import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/layout/app-shell';
import { SCREEN_IDS, ScreenId } from '@/constants/routes';
import { Colors, Fonts } from '@/constants/theme';
import { useCareerStore } from '@/state/career-store';
import { CalendarView, DashboardView, DecisionView, ProfileView, TimelineView } from './views/career-views';
import { MatchView, RankingsView, StatisticsView, TournamentView } from './views/competition-views';
import { ContractView, HealthView, MarketView, RivalriesView, RosterView, TeamView, TrainingView, TrophiesView } from './views/organization-views';
import { AwardsView, HallOfFameView, NewsView, RetirementView, SettingsView, SocialView, SummaryView } from './views/world-views';
import { MajorBracketView, MajorCeremonyView, MajorHubView, MajorMatchCenterView, MajorQualificationView, MinigameCenterView, SwissStageView } from './views/major-views';
import { FinancialReportView, InventoryView, InvestmentsView, LifestyleUpgradesView, SeasonReviewView } from './views/economy-views';
import { CareerAnalyticsView, RecordsView, TrophyRoomView } from './views/analytics-views';
import { FinanceCenterView, LegacyCenterView, PerformanceCenterView } from './views/centers-views';

const screens: Record<ScreenId, () => React.JSX.Element | null> = {
  dashboard: DashboardView, profile: ProfileView, timeline: TimelineView, decision: DecisionView, calendar: CalendarView,
  tournament: TournamentView, match: MatchView, statistics: StatisticsView, performance: PerformanceCenterView, rankings: RankingsView,
  'major-hub': MajorHubView, 'major-qualification': MajorQualificationView, 'swiss-stage': SwissStageView, 'major-bracket': MajorBracketView, 'major-match': MajorMatchCenterView, minigames: MinigameCenterView, 'major-ceremony': MajorCeremonyView,
  team: TeamView, roster: RosterView, market: MarketView, contract: ContractView, training: TrainingView, health: HealthView, trophies: TrophiesView, rivalries: RivalriesView,
  'season-review': SeasonReviewView, 'financial-report': FinancialReportView, lifestyle: LifestyleUpgradesView, inventory: InventoryView, investments: InvestmentsView, analytics: CareerAnalyticsView, records: RecordsView, 'trophy-room': TrophyRoomView,
  news: NewsView, social: SocialView, awards: AwardsView, retirement: RetirementView, 'hall-of-fame': HallOfFameView, summary: SummaryView, settings: SettingsView, legacy: LegacyCenterView, finance: FinanceCenterView,
};

export function GameScreen({ screen }: { screen: string }) {
  const { career, hydrated } = useCareerStore();
  const active: ScreenId = SCREEN_IDS.includes(screen as ScreenId) ? screen as ScreenId : 'dashboard';
  useEffect(() => { if (hydrated && !career) router.replace('/'); }, [career, hydrated]);
  if (!hydrated) return <View style={styles.loading}><Text style={styles.loadingText}>LOADING CAREER DATA</Text></View>;
  if (!career) return <View style={styles.loading}><Text style={styles.loadingText}>NO ACTIVE CAREER</Text></View>;
  const Screen = screens[active];
  return <AppShell active={active}><Screen /></AppShell>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }, loadingText: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5 } });
