import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { Colors, Fonts } from '@/constants/theme';

export interface ChartDatum { label: string; value: number; secondary?: number; }

const finite = (value: number) => Number.isFinite(value) ? value : 0;
const pointsPath = (points: { x: number; y: number }[]) => points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');

function ChartContainer({ title, subtitle, empty, children }: { title: string; subtitle?: string; empty: boolean; children: React.ReactNode }) {
  return <View style={styles.card}><View style={styles.header}><View><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View></View>{empty ? <View style={styles.empty}><Text style={styles.emptyMark}>∿</Text><Text style={styles.emptyText}>Todavía no hay datos suficientes.</Text></View> : children}</View>;
}

export function LineChart({ title, subtitle, data, unit = '', color = Colors.orange, secondaryColor = Colors.blue }: { title: string; subtitle?: string; data: ChartDatum[]; unit?: string; color?: string; secondaryColor?: string }) {
  const [width, setWidth] = useState(320); const [selected, setSelected] = useState<number | null>(null);
  const safe = useMemo(() => data.map((item) => ({ ...item, value: finite(item.value), secondary: item.secondary === undefined ? undefined : finite(item.secondary) })), [data]);
  const height = 190; const padding = { left: 35, right: 16, top: 20, bottom: 31 };
  const values = safe.flatMap((item) => item.secondary === undefined ? [item.value] : [item.value, item.secondary]);
  const min = Math.min(0, ...values); const max = Math.max(1, ...values); const range = Math.max(1, max - min);
  const x = (index: number) => padding.left + index / Math.max(1, safe.length - 1) * (width - padding.left - padding.right);
  const y = (value: number) => padding.top + (max - value) / range * (height - padding.top - padding.bottom);
  const primary = safe.map((item, index) => ({ x: x(index), y: y(item.value) }));
  const secondary = safe.filter((item) => item.secondary !== undefined).map((item, index) => ({ x: x(index), y: y(item.secondary ?? 0) }));
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.max(260, event.nativeEvent.layout.width));
  return <ChartContainer title={title} subtitle={subtitle} empty={!safe.length}><View onLayout={onLayout} style={styles.chart}><Svg width={width} height={height}>
    <Defs><LinearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity="0.26" /><Stop offset="1" stopColor={color} stopOpacity="0" /></LinearGradient></Defs>
    {[0, .25, .5, .75, 1].map((tick) => { const yy = padding.top + tick * (height - padding.top - padding.bottom); const value = max - tick * range; return <G key={tick}><Line x1={padding.left} x2={width - padding.right} y1={yy} y2={yy} stroke={Colors.line} strokeWidth="1" /><SvgText x={padding.left - 6} y={yy + 3} fill={Colors.muted} fontSize="8" textAnchor="end">{value.toFixed(max <= 3 ? 1 : 0)}</SvgText></G>; })}
    {primary.length > 1 ? <Path d={`${pointsPath(primary)} L ${primary.at(-1)!.x} ${height - padding.bottom} L ${primary[0].x} ${height - padding.bottom} Z`} fill="url(#line-fill)" /> : null}
    <Path d={pointsPath(primary)} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />
    {secondary.length ? <Path d={pointsPath(secondary)} fill="none" stroke={secondaryColor} strokeWidth="2" strokeDasharray="5 4" /> : null}
    {primary.map((point, index) => <Circle key={safe[index].label} cx={point.x} cy={point.y} r={selected === index ? 6 : 4} fill={selected === index ? Colors.text : color} stroke={Colors.bg} strokeWidth="2" onPress={() => setSelected(index)} />)}
    {safe.map((item, index) => index === 0 || index === safe.length - 1 || safe.length <= 6 ? <SvgText key={`label-${item.label}`} x={x(index)} y={height - 10} fill={Colors.muted} fontSize="8" textAnchor={index === 0 ? 'start' : index === safe.length - 1 ? 'end' : 'middle'}>{item.label.slice(0, 10)}</SvgText> : null)}
  </Svg>{selected !== null && safe[selected] ? <View pointerEvents="none" style={[styles.tooltip, { left: Math.max(4, Math.min(width - 120, x(selected) - 48)) }]}><Text style={styles.tooltipLabel}>{safe[selected].label}</Text><Text style={styles.tooltipValue}>{safe[selected].value.toFixed(max <= 3 ? 2 : 1)}{unit}</Text></View> : null}</View></ChartContainer>;
}

export function BarChart({ title, subtitle, data, unit = '', color = Colors.orange }: { title: string; subtitle?: string; data: ChartDatum[]; unit?: string; color?: string }) {
  const [width, setWidth] = useState(320); const [selected, setSelected] = useState<number | null>(null); const safe = data.map((item) => ({ ...item, value: finite(item.value) }));
  const height = 190; const left = 38; const bottom = 32; const max = Math.max(1, ...safe.map((item) => Math.abs(item.value))); const slot = (width - left - 14) / Math.max(1, safe.length); const barWidth = Math.max(8, Math.min(34, slot * .58));
  return <ChartContainer title={title} subtitle={subtitle} empty={!safe.length}><View style={styles.chart} onLayout={(event) => setWidth(Math.max(260, event.nativeEvent.layout.width))}><Svg width={width} height={height}>
    <Line x1={left} x2={width - 12} y1={height - bottom} y2={height - bottom} stroke={Colors.lineStrong} />
    {safe.map((item, index) => { const h = Math.abs(item.value) / max * (height - bottom - 25); const xx = left + slot * index + (slot - barWidth) / 2; return <G key={item.label} onPress={() => setSelected(index)}><Rect x={xx} y={height - bottom - h} width={barWidth} height={h} fill={selected === index ? Colors.text : item.value < 0 ? Colors.red : color} rx="2" /><SvgText x={xx + barWidth / 2} y={height - 12} fill={Colors.muted} fontSize="8" textAnchor="middle">{item.label.slice(0, 7)}</SvgText><SvgText x={xx + barWidth / 2} y={Math.max(10, height - bottom - h - 5)} fill={Colors.textSoft} fontSize="8" textAnchor="middle">{Math.round(item.value)}{unit}</SvgText></G>; })}
  </Svg></View></ChartContainer>;
}

export function RadarChart({ title, subtitle, labels, values, comparison, color = Colors.orange }: { title: string; subtitle?: string; labels: string[]; values: number[]; comparison?: number[]; color?: string }) {
  const safeValues = labels.map((_, index) => Math.max(0, Math.min(100, finite(values[index] ?? 0)))); const safeComparison = comparison?.map((value) => Math.max(0, Math.min(100, finite(value)))); const size = 260; const center = size / 2; const radius = 88;
  const polygon = (items: number[]) => items.map((value, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length; const distance = radius * value / 100; return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`; }).join(' ');
  const ring = (value: number) => labels.map((_, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length; return `${center + Math.cos(angle) * radius * value},${center + Math.sin(angle) * radius * value}`; }).join(' ');
  return <ChartContainer title={title} subtitle={subtitle} empty={!labels.length}><View style={styles.radar}><Svg width={size} height={size}>
    {[.25, .5, .75, 1].map((value) => <Polygon key={value} points={ring(value)} fill="none" stroke={Colors.line} strokeWidth="1" />)}
    {labels.map((label, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length; const lx = center + Math.cos(angle) * (radius + 24); const ly = center + Math.sin(angle) * (radius + 18); return <G key={label}><Line x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke={Colors.line} /><SvgText x={lx} y={ly} fill={Colors.muted} fontSize="8" textAnchor="middle">{label.slice(0, 11)}</SvgText></G>; })}
    {safeComparison ? <Polygon points={polygon(safeComparison)} fill={Colors.blue} fillOpacity="0.11" stroke={Colors.blue} strokeWidth="2" /> : null}
    <Polygon points={polygon(safeValues)} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="3" />
    {safeValues.map((value, index) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length; return <Circle key={labels[index]} cx={center + Math.cos(angle) * radius * value / 100} cy={center + Math.sin(angle) * radius * value / 100} r="3" fill={Colors.text} />; })}
  </Svg></View></ChartContainer>;
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 280, backgroundColor: Colors.panel, borderWidth: 1, borderColor: Colors.line, padding: 14 }, header: { minHeight: 42, marginBottom: 6 }, title: { color: Colors.text, fontSize: 12, fontWeight: '900' }, subtitle: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 10, marginTop: 4 }, chart: { minHeight: 190, overflow: 'hidden' }, empty: { height: 190, alignItems: 'center', justifyContent: 'center' }, emptyMark: { color: Colors.lineStrong, fontSize: 35 }, emptyText: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 10, marginTop: 8 }, tooltip: { position: 'absolute', top: 4, width: 112, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.lineStrong, padding: 7 }, tooltipLabel: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 10 }, tooltipValue: { color: Colors.text, fontSize: 13, fontWeight: '900', marginTop: 2 }, radar: { alignItems: 'center' },
});
