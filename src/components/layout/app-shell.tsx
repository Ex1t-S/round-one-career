import { Href, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { ComponentProps, PropsWithChildren, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Fonts, Layout, Radius, Spacing } from "@/constants/theme";
import { SCREEN_IDS, ScreenId } from "@/constants/routes";
import { getCareerEvent } from "@/data/events";
import { getTeam } from "@/data/teams";
import { useCareerStore } from "@/state/career-store";
import { Badge, ProgressBar } from "@/components/ui/game-ui";
import { RoundOneMark, TeamCrest } from "@/components/visual/game-marks";
import { GameImage } from "@/components/visual/game-image";

type SymbolName = ComponentProps<typeof SymbolView>["name"];
const symbols = {
  dashboard: {
    ios: "square.grid.2x2.fill",
    android: "dashboard",
    web: "dashboard",
  },
  profile: {
    ios: "person.crop.circle.fill",
    android: "account_circle",
    web: "account_circle",
  },
  calendar: {
    ios: "calendar",
    android: "calendar_month",
    web: "calendar_month",
  },
  decision: {
    ios: "arrow.triangle.branch",
    android: "alt_route",
    web: "alt_route",
  },
  tournament: {
    ios: "trophy.fill",
    android: "emoji_events",
    web: "emoji_events",
  },
  match: { ios: "scope", android: "sports_esports", web: "sports_esports" },
  statistics: {
    ios: "chart.bar.fill",
    android: "query_stats",
    web: "query_stats",
  },
  rankings: { ios: "list.number", android: "leaderboard", web: "leaderboard" },
  major: { ios: "shield.fill", android: "shield", web: "shield" },
  team: {
    ios: "shield.lefthalf.filled",
    android: "shield_person",
    web: "shield_person",
  },
  roster: { ios: "person.3.fill", android: "groups", web: "groups" },
  market: {
    ios: "arrow.left.arrow.right",
    android: "swap_horiz",
    web: "swap_horiz",
  },
  contract: {
    ios: "doc.text.fill",
    android: "description",
    web: "description",
  },
  training: {
    ios: "figure.strengthtraining.traditional",
    android: "fitness_center",
    web: "fitness_center",
  },
  health: {
    ios: "heart.text.square.fill",
    android: "health_and_safety",
    web: "health_and_safety",
  },
  trophies: { ios: "rosette", android: "hotel_class", web: "hotel_class" },
  investments: {
    ios: "building.columns.fill",
    android: "account_balance",
    web: "account_balance",
  },
  settings: { ios: "gearshape.fill", android: "settings", web: "settings" },
} satisfies Record<string, SymbolName>;

type NavItem = { id: ScreenId; label: string; icon: keyof typeof symbols };
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "CARRERA",
    items: [
      { id: "dashboard", label: "Home", icon: "dashboard" },
      { id: "profile", label: "Jugador", icon: "profile" },
      { id: "calendar", label: "Calendario", icon: "calendar" },
      { id: "decision", label: "Decisiones", icon: "decision" },
    ],
  },
  {
    label: "COMPETICIÓN",
    items: [
      { id: "tournament", label: "Torneos", icon: "tournament" },
      { id: "match", label: "Match Center", icon: "match" },
      { id: "performance", label: "Performance", icon: "statistics" },
      { id: "rankings", label: "Ranking mundial", icon: "rankings" },
      { id: "major-hub", label: "Major", icon: "major" },
    ],
  },
  {
    label: "ORGANIZACIÓN",
    items: [
      { id: "team", label: "Equipo", icon: "team" },
      { id: "roster", label: "Roster", icon: "roster" },
      { id: "market", label: "Mercado", icon: "market" },
      { id: "contract", label: "Contrato", icon: "contract" },
    ],
  },
  {
    label: "DESARROLLO",
    items: [
      { id: "training", label: "Entrenamiento", icon: "training" },
      { id: "health", label: "Salud", icon: "health" },
    ],
  },
  {
    label: "LEGADO",
    items: [{ id: "legacy", label: "Legado", icon: "trophies" }],
  },
  {
    label: "FINANZAS",
    items: [{ id: "finance", label: "Finanzas", icon: "investments" }],
  },
  {
    label: "SISTEMA",
    items: [{ id: "settings", label: "Configuración", icon: "settings" }],
  },
];
const mobileItems: NavItem[] = [
  { id: "dashboard", label: "Home", icon: "dashboard" },
  { id: "match", label: "Match", icon: "match" },
  { id: "profile", label: "Career", icon: "profile" },
  { id: "major-hub", label: "Major", icon: "major" },
];

function NavIcon({
  name,
  active,
}: {
  name: keyof typeof symbols;
  active: boolean;
}) {
  return (
    <SymbolView
      name={symbols[name]}
      size={20}
      tintColor={active ? Colors.orange : Colors.muted}
      fallback={
        <View
          style={[
            styles.navIconFallback,
            active && styles.navIconFallbackActive,
          ]}
        />
      }
    />
  );
}
function navigate(id: ScreenId) {
  if (!SCREEN_IDS.includes(id)) return;
  router.push(`/game?view=${id}` as Href);
}
function getDecisionTitle(id: string) {
  return getCareerEvent(id)?.title ?? "Tenés una elección pendiente";
}

export function AppShell({
  active,
  children,
}: PropsWithChildren<{ active: ScreenId }>) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;
  const { career, message, clearMessage, advanceToNextAction } =
    useCareerStore();
  const [moreOpen, setMoreOpen] = useState(false);
  if (!career) return null;
  const team = getTeam(career.teamId);
  const rank =
    career.rankings.find((entry) => entry.teamId === team.id)?.rank ??
    team.initialRanking;
  const nextAction: {
    eyebrow: string;
    title: string;
    label: string;
    screen?: ScreenId;
    tone: string;
  } = career.finished
    ? {
        eyebrow: "CARRERA FINALIZADA",
        title: "Revisá tu historia, récords y legado",
        label: "Abrir legado",
        screen: "legacy",
        tone: Colors.muted,
      }
    : career.offseasonPending
      ? {
          eyebrow: "TEMPORADA CERRADA",
          title: "Completá el balance y definí el próximo año",
          label: "Abrir off-season",
          screen: "season-review",
          tone: Colors.orange,
        }
      : career.pendingMinigame
        ? {
            eyebrow: "ACCIÓN PENDIENTE",
            title: "Resolvé la decisión interactiva",
            label: "Jugar minijuego",
            screen: "minigames",
            tone: Colors.orange,
          }
        : career.activeMajorId
          ? {
              eyebrow: "CAMPAÑA ACTIVA",
              title: `Continuá el Major · ${career.majorCampaigns.find((item) => item.id === career.activeMajorId)?.stage.replaceAll("-", " ") ?? "próxima etapa"}`,
              label: "Abrir Major Hub",
              screen: "major-hub",
              tone: Colors.red,
            }
          : career.pendingMatchId
            ? {
                eyebrow: "MATCH DAY",
                title: "Elegí el plan táctico y disputá la serie",
                label: "Abrir Match Center",
                screen: "match",
                tone: Colors.red,
              }
            : career.pendingDecisionId
              ? {
                  eyebrow: `PLAN DE TEMPORADA · ${career.decisionSlotsUsed.length + 1}/6`,
                  title: getDecisionTitle(career.pendingDecisionId),
                  label: "Continuar plan",
                  screen: "decision",
                  tone: Colors.orange,
                }
              : {
                  eyebrow: "CARRERA EN CURSO",
                  title: "Simulá hasta el próximo evento importante",
                  label: "Continuar simulación",
                  tone: Colors.green,
                };
  const editorial =
    active === "training"
      ? { asset: "training-center" as const, label: "PLAYER DEVELOPMENT" }
      : active === "health"
        ? { asset: "health-recovery" as const, label: "PERFORMANCE & WELLNESS" }
        : ["market", "contract"].includes(active)
          ? { asset: "contract-market" as const, label: "CAREER BUSINESS" }
          : null;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.app}>
        {desktop ? (
          <View style={styles.sidebar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Abrir Home" onPress={() => navigate("dashboard")} style={styles.brand}>
              <RoundOneMark size={32} />
              <Text style={styles.brandText}>
                ROUND<Text style={styles.brandAccent}>/</Text>ONE
              </Text>
            </Pressable>
            <View style={styles.playerMini}>
              <TeamCrest id={team.id} color={team.color} size={38} />
              <View style={styles.playerMiniCopy}>
                <Text numberOfLines={1} style={styles.nickname}>
                  {career.player.identity.nickname}
                </Text>
                <Text numberOfLines={1} style={styles.teamLabel}>
                  #{rank} · {team.name}
                </Text>
              </View>
              <Badge tone={career.player.form >= 60 ? "green" : "orange"}>
                {Math.round(career.player.form)}
              </Badge>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.navScroll}
            >
              {groups.map((group) => (
                <View key={group.label} style={styles.navGroup}>
                  <Text style={styles.navGroupLabel}>{group.label}</Text>
                  {group.items.map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir ${item.label}`}
                      key={item.id}
                      onPress={() => navigate(item.id)}
                      style={StyleSheet.flatten([
                        styles.navItem,
                        active === item.id && styles.navItemActive,
                      ])}
                    >
                      <NavIcon name={item.icon} active={active === item.id} />
                      <Text
                        style={[
                          styles.navText,
                          active === item.id && styles.navTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {(item.id === "decision" && career.pendingDecisionId) ||
                      (item.id === "match" && career.pendingMatchId) ||
                      (item.id === "major-hub" && career.activeMajorId) ||
                      (item.id === "finance" && career.offseasonPending) ? (
                        <View style={styles.navDot} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
            <View style={styles.seasonCard}>
              <View style={styles.seasonRow}>
                <Text style={styles.seasonLabel}>SEASON {career.season}</Text>
                <Text style={styles.seasonWeek}>TRAMO {career.week}/4</Text>
              </View>
              <ProgressBar
                value={(((career.month - 1) * 4 + career.week) / 48) * 100}
              />
              <Text style={styles.seasonDate}>
                {String(career.month).padStart(2, "0")}/{career.year}
              </Text>
            </View>
          </View>
        ) : null}
        <View style={styles.main}>
          <View style={[styles.topbar, !desktop && styles.topbarMobile]}>
            <View style={styles.topbarLeft}>
              {!desktop ? (
                <View style={styles.mobileBrand}>
                  <RoundOneMark size={24} />
                  <Text style={styles.brandText}>
                    ROUND<Text style={styles.brandAccent}>/</Text>ONE
                  </Text>
                </View>
              ) : (
                <Text style={styles.topStatus}>
                  <Text style={styles.liveDot}>●</Text>{" "}
                  {career.activeMajorId
                    ? "MAJOR ACTIVE"
                    : `${career.squad.role.toUpperCase()} · ${career.decisionSlotsUsed.length}/6 CALLS`}
                </Text>
              )}
            </View>
            <View style={styles.topMetrics}>
              <Text style={styles.topMetric}>
                ${career.player.money.toLocaleString("en-US")}
              </Text>
              {desktop ? (
                <Text style={styles.topMetric}>
                  NW ${Math.round(career.netWorth / 1000)}K
                </Text>
              ) : null}
              <Text style={styles.topMetric}>FAT {career.player.fatigue}</Text>
            </View>
          </View>
          {!desktop ? (
            <View style={styles.mobileNav}>
              {mobileItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => navigate(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.label}`}
                  style={StyleSheet.flatten([
                    styles.mobileNavItem,
                    active === item.id && styles.mobileNavItemActive,
                  ])}
                >
                  <NavIcon name={item.icon} active={active === item.id} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.mobileNavText,
                      active === item.id && styles.navTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {(item.id === "match" && career.pendingMatchId) ||
                  (item.id === "major-hub" && career.activeMajorId) ? (
                    <View style={styles.navDot} />
                  ) : null}
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir más secciones"
                onPress={() => setMoreOpen(true)}
                style={[
                  styles.mobileNavItem,
                  !mobileItems.some((item) => item.id === active) &&
                    styles.mobileNavItemActive,
                ]}
              >
                <NavIcon
                  name="settings"
                  active={!mobileItems.some((item) => item.id === active)}
                />
                <Text style={styles.mobileNavText}>More</Text>
                {career.pendingDecisionId || career.offseasonPending ? (
                  <View style={styles.navDot} />
                ) : null}
              </Pressable>
            </View>
          ) : null}
          <Modal
            visible={moreOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setMoreOpen(false)}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar navegación"
              style={styles.modalBackdrop}
              onPress={() => setMoreOpen(false)}
            >
              <Pressable
                style={styles.moreSheet}
                onPress={(event) => event.stopPropagation()}
              >
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>ROUND/ONE · NAVIGATION</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar navegación"
                    onPress={() => setMoreOpen(false)}
                    style={styles.sheetClose}
                  >
                    <Text style={styles.sheetCloseText}>Cerrar</Text>
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.sheetScroller}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.sheetScroll}
                >
                  {groups.map((group) => (
                    <View key={group.label} style={styles.sheetGroup}>
                      <Text style={styles.navGroupLabel}>{group.label}</Text>
                      <View style={styles.sheetItems}>
                        {group.items.map((item) => (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Abrir ${item.label}`}
                            key={item.id}
                            onPress={() => {
                              setMoreOpen(false);
                              navigate(item.id);
                            }}
                            style={[
                              styles.sheetItem,
                              active === item.id && styles.sheetItemActive,
                            ]}
                          >
                            <NavIcon
                              name={item.icon}
                              active={active === item.id}
                            />
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.navText,
                                active === item.id && styles.navTextActive,
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
          {message ? (
            <Pressable onPress={clearMessage} style={styles.toast}>
              <Text style={styles.toastDot}>●</Text>
              <Text style={styles.toastText}>{message}</Text>
              <Text style={styles.toastClose}>×</Text>
            </Pressable>
          ) : null}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={[
              styles.content,
              !desktop && styles.contentMobile,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.actionDock, { borderColor: nextAction.tone }]}>
              <View style={styles.actionDockCopy}>
                <Text
                  style={[styles.actionDockEyebrow, { color: nextAction.tone }]}
                >
                  {nextAction.eyebrow}
                </Text>
                <Text style={styles.actionDockTitle}>{nextAction.title}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  nextAction.screen
                    ? navigate(nextAction.screen)
                    : advanceToNextAction()
                }
                style={[
                  styles.actionDockButton,
                  {
                    backgroundColor: nextAction.tone,
                    borderColor: nextAction.tone,
                  },
                ]}
              >
                <Text style={styles.actionDockButtonText}>
                  {nextAction.label} →
                </Text>
              </Pressable>
            </View>
            {editorial ? (
              <GameImage
                asset={editorial.asset}
                ratio="cinema"
                style={styles.editorial}
              >
                <Text style={styles.editorialLabel}>{editorial.label}</Text>
              </GameImage>
            ) : null}
            {children}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  app: { flex: 1, flexDirection: "row", backgroundColor: Colors.bg },
  sidebar: {
    width: Layout.sidebar,
    backgroundColor: Colors.bgRaised,
    borderRightWidth: 1,
    borderRightColor: Colors.line,
    paddingHorizontal: Spacing.lg,
  },
  brand: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  brandText: {
    color: Colors.text,
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  brandAccent: { color: Colors.orange },
  playerMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  playerMiniCopy: { flex: 1 },
  nickname: {
    color: Colors.text,
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: "800",
  },
  teamLabel: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    marginTop: 4,
  },
  navScroll: { paddingVertical: 14, paddingBottom: 26 },
  navGroup: { marginBottom: 15 },
  navGroupLabel: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    paddingHorizontal: 10,
    marginBottom: 6,
    opacity: 0.68,
  },
  navItem: {
    height: 39,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    gap: 11,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  navItemActive: {
    backgroundColor: Colors.panelSoft,
    borderLeftColor: Colors.orange,
  },
  navIconFallback: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.muted,
  },
  navIconFallbackActive: { borderColor: Colors.orange },
  navText: {
    color: Colors.textSoft,
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: "600",
  },
  navTextActive: { color: Colors.text },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
    marginLeft: "auto",
  },
  seasonCard: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    gap: 8,
  },
  seasonRow: { flexDirection: "row", justifyContent: "space-between" },
  seasonLabel: {
    color: Colors.textSoft,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "900",
  },
  seasonWeek: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 10 },
  seasonDate: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 10 },
  main: { flex: 1 },
  topbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.bg,
  },
  topbarMobile: { height: 54, paddingHorizontal: Spacing.lg },
  topbarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  mobileBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  topStatus: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  liveDot: { color: Colors.green },
  topMetrics: { flexDirection: "row", gap: 16 },
  topMetric: {
    color: Colors.textSoft,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "800",
  },
  mobileNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.bgRaised,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  mobileNavItem: {
    minHeight: 43,
    minWidth: 57,
    flex: 1,
    maxWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: Radius.sm,
  },
  mobileNavItemActive: { backgroundColor: Colors.orangeSoft },
  mobileNavText: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.72)",
    justifyContent: "flex-end",
  },
  moreSheet: {
    backgroundColor: Colors.bgRaised,
    borderTopWidth: 1,
    borderTopColor: Colors.orange,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    maxHeight: "88%",
  },
  sheetHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    color: Colors.orange,
    fontFamily: Fonts.mono,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1.2,
  },
  sheetClose: {
    minHeight: 44,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.sm,
  },
  sheetCloseText: {
    color: Colors.textSoft,
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "800",
  },
  sheetScroller: { flexShrink: 1 },
  sheetScroll: { paddingTop: 10, paddingBottom: 24 },
  sheetGroup: { marginBottom: 14 },
  sheetItems: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetItem: {
    width: "47%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 9,
    backgroundColor: Colors.panelSoft,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  sheetItemActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeSoft,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.greenSoft,
    borderLeftWidth: 3,
    borderLeftColor: Colors.green,
  },
  toastDot: { color: Colors.green, fontSize: 10 },
  toastText: {
    flex: 1,
    color: Colors.textSoft,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  toastClose: { color: Colors.muted, fontSize: 17 },
  contentScroll: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: Layout.maxWidth,
    alignSelf: "center",
    padding: Spacing.xl,
    paddingBottom: 64,
  },
  contentMobile: {
    paddingHorizontal: 10,
    paddingVertical: Spacing.lg,
    paddingBottom: 52,
  },
  actionDock: {
    minHeight: 76,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginBottom: Spacing.xl,
  },
  actionDockCopy: { flex: 1, minWidth: 220 },
  actionDockEyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  actionDockTitle: {
    color: Colors.text,
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  actionDockButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  actionDockButtonText: {
    color: Colors.black,
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  editorial: { marginBottom: Spacing.lg, maxHeight: 210 },
  editorialLabel: {
    color: Colors.orange,
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
