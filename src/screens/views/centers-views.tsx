import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BarChart,
  LineChart,
  RadarChart,
} from "@/components/charts/career-charts";
import { Badge, Metric, Panel, SectionHeader } from "@/components/ui/game-ui";
import { Colors, Fonts } from "@/constants/theme";
import { ACTIVE_MAP_IDS, getMap } from "@/data/maps";
import { getTeam } from "@/data/teams";
import { getTournament, TOURNAMENTS } from "@/data/tournaments";
import { calculateFinancialSummary } from "@/engine/economy";
import { useCareerStore } from "@/state/career-store";
import { MatchResult } from "@/types/game";
import {
  FinancialReportView,
  InventoryView,
  InvestmentsView,
  LifestyleUpgradesView,
} from "./economy-views";
import { RecordsView, TrophyRoomView } from "./analytics-views";
import { AwardsView } from "./world-views";

type Tab = { id: string; label: string };
const performanceTabs: Tab[] = [
  { id: "overview", label: "Resumen" },
  { id: "matches", label: "Partidos" },
  { id: "maps", label: "Mapas" },
  { id: "tournaments", label: "Torneos" },
  { id: "seasons", label: "Temporadas" },
  { id: "advanced", label: "Avanzado" },
];
const legacyTabs: Tab[] = [
  { id: "history", label: "Historia" },
  { id: "trophies", label: "Trofeos" },
  { id: "awards", label: "Premios" },
  { id: "records", label: "Récords" },
  { id: "majors", label: "Majors" },
];
const financeTabs: Tab[] = [
  { id: "overview", label: "Resumen" },
  { id: "cashflow", label: "Ingresos y gastos" },
  { id: "store", label: "Tienda" },
  { id: "assets", label: "Activos" },
  { id: "inventory", label: "Inventario" },
  { id: "investments", label: "Inversiones" },
];
const avg = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
const safe = (value: number) => (Number.isFinite(value) ? value : 0);

function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={s.tabs}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          onPress={() => onChange(tab.id)}
          style={[s.tab, value === tab.id && s.tabActive]}
        >
          <Text style={[s.tabText, value === tab.id && s.tabTextActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Filter({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.filter, active && s.filterActive]}>
      <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}
function Metrics({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    tone?: "orange" | "green" | "red";
  }[];
}) {
  return (
    <View style={s.metricGrid}>
      {items.map((item) => (
        <Panel key={item.label} style={s.metric}>
          <Metric label={item.label} value={item.value} tone={item.tone} />
        </Panel>
      ))}
    </View>
  );
}

export function PerformanceCenterView({
  initialTab = "overview",
}: { initialTab?: string } = {}) {
  const { career } = useCareerStore();
  const [tab, setTab] = useState(initialTab);
  const [season, setSeason] = useState<number | "all">("all");
  const [tournament, setTournament] = useState("all");
  const [map, setMap] = useState("all");
  const [outcome, setOutcome] = useState<"all" | "win" | "loss">("all");
  if (!career) return null;
  const all = career.matches;
  const matches = all.filter(
    (item) =>
      (season === "all" || item.season === season) &&
      (tournament === "all" || item.tournamentId === tournament) &&
      (map === "all" || item.maps.some((entry) => entry.mapId === map)) &&
      (outcome === "all" || (outcome === "win" ? item.won : !item.won)),
  );
  const recent = matches.slice(-10);
  const current = all.filter((item) => item.season === career.season);
  const best = all.reduce(
    (value, item) => Math.max(value, item.aggregate.rating),
    0,
  );
  const comparisons: { label: string; list: MatchResult[] }[] = [
    { label: "Últimas 10", list: recent },
    { label: "Temporada actual", list: current },
    { label: "Carrera", list: all },
  ];
  return (
    <View>
      <SectionHeader
        eyebrow="CENTRO DE RENDIMIENTO"
        title="Una sola lectura de tu rendimiento"
      />
      <Tabs tabs={performanceTabs} value={tab} onChange={setTab} />
      <View style={s.filters}>
        <Filter
          label={season === "all" ? "Todas las temporadas" : `Temporada ${season}`}
          active={season !== "all"}
          onPress={() =>
            setSeason(
              season === "all"
                ? career.season
                : season === 1
                  ? "all"
                  : season - 1,
            )
          }
        />
        {TOURNAMENTS.filter((item) =>
          all.some((match) => match.tournamentId === item.id),
        )
          .slice(0, 5)
          .map((item) => (
            <Filter
              key={item.id}
              label={item.shortName}
              active={tournament === item.id}
              onPress={() =>
                setTournament(tournament === item.id ? "all" : item.id)
              }
            />
          ))}
        {ACTIVE_MAP_IDS.slice(0, 4).map((id) => (
          <Filter
            key={id}
            label={getMap(id).name}
            active={map === id}
            onPress={() => setMap(map === id ? "all" : id)}
          />
        ))}
        <Filter
          label="Wins"
          active={outcome === "win"}
          onPress={() => setOutcome(outcome === "win" ? "all" : "win")}
        />
        <Filter
          label="Losses"
          active={outcome === "loss"}
          onPress={() => setOutcome(outcome === "loss" ? "all" : "loss")}
        />
      </View>
      {!matches.length ? (
        <Panel style={s.emptyState}>
          <Text style={s.emptyTitle}>Todavía no hay series para estos filtros.</Text>
          <Text style={s.muted}>
            Jugá un torneo o quitá filtros para habilitar métricas, comparaciones y gráficos.
          </Text>
        </Panel>
      ) : null}
      {tab === "overview" ? (
        <>
          <Metrics
            items={[
              {
                label: "Rating",
                value: avg(
                  matches.map((item) => item.aggregate.rating),
                ).toFixed(2),
                tone: "orange",
              },
              {
                label: "K/D",
                value: avg(matches.map((item) => item.aggregate.kd)).toFixed(2),
              },
              {
                label: "ADR",
                value: avg(matches.map((item) => item.aggregate.adr)).toFixed(
                  1,
                ),
              },
              {
                label: "KAST",
                value: `${avg(matches.map((item) => item.aggregate.kast)).toFixed(0)}%`,
              },
              {
                label: "Maps",
                value: matches.reduce((sum, item) => sum + item.maps.length, 0),
              },
              { label: "Series", value: matches.length },
              {
                label: "Win rate",
                value: `${((matches.filter((item) => item.won).length / Math.max(1, matches.length)) * 100).toFixed(0)}%`,
                tone: "green",
              },
              {
                label: "Opening",
                value: `${avg(matches.map((item) => item.aggregate.firstKillPercentage)).toFixed(0)}%`,
              },
              {
                label: "Clutches",
                value: matches.reduce(
                  (sum, item) => sum + item.aggregate.clutches,
                  0,
                ),
              },
            ]}
          />
          <View style={s.grid}>
            <LineChart
              title="Rating ultimas series"
              data={recent.map((item, index) => ({
                label: `${item.season}.${index + 1}`,
                value: item.aggregate.rating,
              }))}
              color={Colors.orange}
            />
            <LineChart
              title="Rating por temporada"
              data={career.seasonalStatistics.map((item) => ({
                label: `S${item.season}`,
                value: safe(item.rating),
                secondary: safe(item.kd),
              }))}
              color={Colors.green}
              secondaryColor={Colors.blue}
            />
            <RadarChart
              title="Atributos actuales"
              labels={[
                "Aim",
                "Reaction",
                "Sense",
                "Clutch",
                "Utility",
                "Mental",
                "Comms",
                "Stamina",
              ]}
              values={[
                career.player.attributes.aim,
                career.player.attributes.reaction,
                career.player.attributes.gameSense,
                career.player.attributes.clutch,
                career.player.attributes.utilityUsage,
                career.player.attributes.mentalStrength,
                career.player.attributes.communication,
                career.player.attributes.stamina,
              ]}
              comparison={[72, 70, 74, 68, 70, 72, 73, 75]}
            />
          </View>
          <SectionHeader
            eyebrow="COMPARACION"
            title="Últimas 10 · temporada · carrera · career best"
          />
          <View style={s.compareGrid}>
            {comparisons.map(({ label, list }) => (
              <Panel key={label} style={s.compare}>
                <Text style={s.compareLabel}>{label}</Text>
                <Text style={s.compareValue}>
                  {avg(list.map((item) => item.aggregate.rating)).toFixed(2)}
                </Text>
                <Text style={s.muted}>
                  {list.length} series ·{" "}
                  {(
                    (list.filter((item) => item.won).length /
                      Math.max(1, list.length)) *
                    100
                  ).toFixed(0)}
                  % WR
                </Text>
              </Panel>
            ))}
            <Panel style={s.compare}>
              <Text style={s.compareLabel}>Career best</Text>
              <Text style={[s.compareValue, { color: Colors.orange }]}>
                {best.toFixed(2)}
              </Text>
              <Text style={s.muted}>Mejor rating de una serie</Text>
            </Panel>
          </View>
        </>
      ) : null}
      {tab === "matches" ? (
        <Panel>
          <SectionHeader
            eyebrow="SERIES"
            title={`${matches.length} resultados filtrados`}
          />
          {matches
            .slice()
            .reverse()
            .slice(0, 30)
            .map((item) => (
              <View key={item.id} style={s.matchRow}>
                <Badge tone={item.won ? "green" : "red"}>
                  {item.won ? "W" : "L"}
                </Badge>
                <View style={s.flex}>
                  <Text style={s.matchTitle}>
                    {getTournament(item.tournamentId).shortName} vs{" "}
                    {getTeam(item.opponentTeamId).name}
                  </Text>
                  <Text style={s.muted}>
                    S{item.season} · {item.seriesScore} · {item.maps.length}{" "}
                    maps · {item.aggregate.kills}-{item.aggregate.deaths}
                  </Text>
                </View>
                <Text style={s.rating}>{item.aggregate.rating.toFixed(2)}</Text>
              </View>
            ))}
        </Panel>
      ) : null}
      {tab === "maps" ? (
        <>
          <View style={s.grid}>
            {ACTIVE_MAP_IDS.map((id) => {
              const entries = matches.flatMap((match) =>
                match.maps.filter((item) => item.mapId === id),
              );
              return (
                <Panel key={id} style={s.mapCard}>
                  <Text style={s.mapName}>{getMap(id).name}</Text>
                  <Text style={s.compareValue}>
                    {avg(
                      entries.map((item) => item.playerStats.rating),
                    ).toFixed(2)}
                  </Text>
                  <Text style={s.muted}>
                    {entries.length} maps ·{" "}
                    {(
                      (entries.filter(
                        (item) => item.teamScore > item.opponentScore,
                      ).length /
                        Math.max(1, entries.length)) *
                      100
                    ).toFixed(0)}
                    % win rate
                  </Text>
                </Panel>
              );
            })}
          </View>
          <BarChart
            title="Rendimiento por mapa"
            data={ACTIVE_MAP_IDS.map((id) => {
              const entries = matches.flatMap((match) =>
                match.maps.filter((item) => item.mapId === id),
              );
              return {
                label: getMap(id).name,
                value: avg(entries.map((item) => item.playerStats.rating)),
              };
            })}
            color={Colors.purple}
          />
        </>
      ) : null}
      {tab === "tournaments" ? (
        <>
          <BarChart
            title="Campanas por torneo"
            data={career.tournamentCampaigns
              .slice(-16)
              .map((item) => ({
                label: getTournament(item.tournamentId).shortName,
                value: safe(item.playerRating),
                secondary: item.wins,
              }))}
            color={Colors.green}
          />
          <Panel>
            {career.tournamentCampaigns
              .slice()
              .reverse()
              .slice(0, 20)
              .map((item) => (
                <View key={item.id} style={s.matchRow}>
                  <Badge tone="neutral">{item.finish}</Badge>
                  <View style={s.flex}>
                    <Text style={s.matchTitle}>
                      {getTournament(item.tournamentId).name}
                    </Text>
                    <Text style={s.muted}>
                      S{item.season} · {item.playerMatchIds.length} series ·{" "}
                      {item.wins} wins / {item.losses} losses
                    </Text>
                  </View>
                  <Text style={s.rating}>{item.playerRating.toFixed(2)}</Text>
                </View>
              ))}
          </Panel>
        </>
      ) : null}
      {tab === "seasons" ? (
        <>
          <LineChart
            title="Evolucion de temporadas"
            data={career.seasonalStatistics.map((item) => ({
              label: `S${item.season}`,
              value: item.rating,
              secondary: item.kd,
            }))}
            color={Colors.orange}
            secondaryColor={Colors.blue}
          />
          <BarChart
            title="Volumen anual"
            data={career.seasonalStatistics.map((item) => ({
              label: `S${item.season}`,
              value: item.kills ?? 0,
              secondary: item.maps ?? 0,
            }))}
            color={Colors.green}
          />
        </>
      ) : null}
      {tab === "advanced" ? (
        <>
          <Metrics
            items={[
              {
                label: "CT rating",
                value: avg(
                  matches.map((item) => item.aggregate.ctRating),
                ).toFixed(2),
              },
              {
                label: "T rating",
                value: avg(
                  matches.map((item) => item.aggregate.tRating),
                ).toFixed(2),
              },
              {
                label: "Opening success",
                value: `${avg(matches.map((item) => item.aggregate.firstKillPercentage)).toFixed(1)}%`,
              },
              {
                label: "Pressure",
                value: avg(
                  matches.map((item) => item.aggregate.pressureRating),
                ).toFixed(2),
              },
              { label: "Fatigue", value: career.player.fatigue },
              { label: "Form", value: career.player.form },
            ]}
          />
          <BarChart
            title="CT / T / Opening"
            data={[
              {
                label: "CT",
                value: avg(matches.map((item) => item.aggregate.ctRating)) * 50,
              },
              {
                label: "T",
                value: avg(matches.map((item) => item.aggregate.tRating)) * 50,
              },
              {
                label: "Opening",
                value: avg(
                  matches.map((item) => item.aggregate.firstKillPercentage),
                ),
              },
            ]}
            color={Colors.blue}
          />
        </>
      ) : null}
    </View>
  );
}

export function LegacyCenterView({
  initialTab = "history",
}: { initialTab?: string } = {}) {
  const { career } = useCareerStore();
  const [tab, setTab] = useState(initialTab);
  if (!career) return null;
  const relevant = career.matches
    .filter(
      (match) =>
        getTournament(match.tournamentId).kind === "major" ||
        getTournament(match.tournamentId).tier === "S" ||
        match.aggregate.rating >= 1.15 ||
        match.won,
    )
    .slice()
    .reverse()
    .slice(0, 60);
  return (
    <View>
      <SectionHeader
        eyebrow="CENTRO DE LEGADO"
        title="Los capitulos que definieron tu carrera"
      />
      <Tabs tabs={legacyTabs} value={tab} onChange={setTab} />
      {tab === "history" ? (
        <Panel>
          {relevant.map((match) => (
            <View key={match.id} style={s.matchRow}>
              <Badge tone={match.won ? "green" : "red"}>
                {match.won ? "WIN" : "LOSS"}
              </Badge>
              <View style={s.flex}>
                <Text style={s.matchTitle}>
                  {getTournament(match.tournamentId).name} · vs{" "}
                  {getTeam(match.opponentTeamId).name}
                </Text>
                <Text style={s.muted}>
                  S{match.season} · {match.aggregate.rating.toFixed(2)} rating ·{" "}
                  {match.highlights[0] ?? "Serie registrada"}
                </Text>
              </View>
            </View>
          ))}
          {career.decisions
            .slice()
            .reverse()
            .slice(0, 12)
            .map((item, index) => (
              <View key={`${item.eventId}-${index}`} style={s.matchRow}>
                <Badge tone="orange">DECISION</Badge>
                <View style={s.flex}>
                  <Text style={s.matchTitle}>{item.outcome}</Text>
                  <Text style={s.muted}>
                    S{item.season} · {item.context}
                  </Text>
                </View>
              </View>
            ))}
        </Panel>
      ) : null}
      {tab === "trophies" ? <TrophyRoomView /> : null}
      {tab === "awards" ? <AwardsView /> : null}
      {tab === "records" ? <RecordsView /> : null}
      {tab === "majors" ? (
        <Panel>
          {career.majorCampaigns.length ? (
            career.majorCampaigns
              .slice()
              .reverse()
              .map((item) => (
                <View key={item.id} style={s.matchRow}>
                  <Badge
                    tone={
                      item.status === "completed"
                        ? "green"
                        : item.status === "eliminated"
                          ? "red"
                          : "orange"
                    }
                  >
                    {item.status}
                  </Badge>
                  <View style={s.flex}>
                    <Text style={s.matchTitle}>
                      {getTournament(item.tournamentId).name} · Season{" "}
                      {item.season}
                    </Text>
                    <Text style={s.muted}>
                      {item.outcome ?? item.stage} ·{" "}
                      {item.playerRating.toFixed(2)} rating
                    </Text>
                  </View>
                </View>
              ))
          ) : (
            <Text style={s.muted}>Todavia no hay campanas de Major.</Text>
          )}
        </Panel>
      ) : null}
    </View>
  );
}

export function FinanceCenterView({
  initialTab = "overview",
}: { initialTab?: string } = {}) {
  const { career } = useCareerStore();
  const [tab, setTab] = useState(initialTab);
  if (!career) return null;
  const current =
    career.financialHistory.find((item) => item.season === career.season) ??
    calculateFinancialSummary(career);
  const income =
    current.salary +
    current.prizeMoney +
    current.winBonuses +
    current.tournamentBonuses +
    current.majorBonuses +
    current.mvpBonuses +
    current.sponsors +
    current.streaming +
    current.content +
    current.otherIncome;
  const spend =
    current.taxes +
    current.agentFees +
    current.housing +
    current.travel +
    current.health +
    current.training +
    current.maintenance +
    current.purchases;
  return (
    <View>
      <SectionHeader
        eyebrow="CENTRO FINANCIERO"
        title="Dinero, patrimonio y estilo de vida"
      />
      <Tabs tabs={financeTabs} value={tab} onChange={setTab} />
      {tab === "overview" ? (
        <>
          <Metrics
            items={[
              {
                label: "Capital disponible",
                value: `$${career.player.money.toLocaleString("en-US")}`,
                tone: "orange",
              },
              {
                label: "Patrimonio",
                value: `$${career.netWorth.toLocaleString("en-US")}`,
              },
              {
                label: "Balance anual",
                value: `$${current.balance.toLocaleString("en-US")}`,
                tone: current.balance >= 0 ? "green" : "red",
              },
              {
                label: "Mantenimiento",
                value: `$${current.maintenance.toLocaleString("en-US")}`,
                tone: "red",
              },
            ]}
          />
          <LineChart
            title="Patrimonio historico"
            data={career.financialHistory.map((item) => ({
              label: `S${item.season}`,
              value: item.netWorth,
            }))}
            unit="$"
            color={Colors.green}
          />
          <Panel>
            <Text style={s.compareLabel}>ESTADO FINANCIERO</Text>
            <Text style={s.muted}>
              Ingresos ${income.toLocaleString("en-US")} · gastos $
              {spend.toLocaleString("en-US")} ·{" "}
              {career.offseasonPending
                ? "off-season pendiente"
                : "temporada activa"}
            </Text>
          </Panel>
        </>
      ) : null}
      {tab === "cashflow" ? (
        <>
          <View style={s.grid}>
            <BarChart
              title="Ingresos"
              data={[
                { label: "Salario", value: current.salary },
                { label: "Premios", value: current.prizeMoney },
                { label: "Sponsors", value: current.sponsors },
                { label: "Stream", value: current.streaming },
              ]}
              color={Colors.green}
            />
            <BarChart
              title="Gastos"
              data={[
                { label: "Impuestos", value: current.taxes },
                { label: "Vivienda", value: current.housing },
                { label: "Salud", value: current.health },
                { label: "Compras", value: current.purchases },
              ]}
              color={Colors.red}
            />
          </View>
          <FinancialReportView />
        </>
      ) : null}
      {tab === "store" ? <LifestyleUpgradesView /> : null}
      {tab === "assets" || tab === "inventory" ? <InventoryView /> : null}
      {tab === "investments" ? <InvestmentsView /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tab: {
    minHeight: 44,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.line,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  tabActive: { borderBottomColor: Colors.orange },
  tabText: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "900",
  },
  tabTextActive: { color: Colors.orange },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  filter: {
    minHeight: 40,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.panelSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeSoft,
  },
  filterText: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 10 },
  filterTextActive: { color: Colors.orange },
  emptyState: { marginBottom: 15 },
  emptyTitle: { color: Colors.text, fontSize: 13, fontWeight: "800" },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },
  metric: { minWidth: 130, flexGrow: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 15 },
  flex: { flex: 1 },
  compareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  compare: { minWidth: 180, flexGrow: 1 },
  compareLabel: {
    color: Colors.orange,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: "900",
  },
  compareValue: {
    color: Colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 8,
  },
  muted: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 5,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  matchTitle: { color: Colors.text, fontSize: 11, fontWeight: "800" },
  rating: {
    color: Colors.orange,
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: "900",
  },
  mapCard: { minWidth: 150, flexGrow: 1 },
  mapName: { color: Colors.text, fontSize: 13, fontWeight: "900" },
});
