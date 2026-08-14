import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { TEAM_LOGO_ASSETS } from '@/data/team-logo-assets';

function hash(value: string) { return [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7); }

function AbstractTeamCrest({ id, color, size }: { id: string; color: string; size: number }) {
  const seed = hash(id); const inset = 12 + seed % 8; const notch = 28 + seed % 15;
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`Identidad alternativa de ${id}`}>
    <Defs><LinearGradient id={`g-${seed}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={color} /><Stop offset="1" stopColor={Colors.bgRaised} /></LinearGradient></Defs>
    <Polygon points={`50,4 92,22 84,76 50,96 16,76 8,22`} fill={Colors.bgRaised} stroke={color} strokeWidth="3" />
    <Path d={`M${inset} 28 L50 12 L${100 - inset} 28 L${78 - seed % 9} 70 L50 86 L${22 + seed % 9} 70 Z`} fill={`url(#g-${seed})`} opacity="0.88" />
    <Path d={`M24 ${notch} L50 70 L76 ${notch}`} fill="none" stroke={Colors.text} strokeWidth="5" strokeLinecap="square" opacity="0.72" />
    <Circle cx="50" cy="50" r={6 + seed % 6} fill={color} />
  </Svg>;
}

export function RoundOneMark({ size = 32, color = Colors.orange }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="ROUND ONE mark">
    <Rect x="4" y="4" width="92" height="92" rx="22" fill={Colors.bgRaised} stroke={color} strokeWidth="5" />
    <Path d="M27 27 H59 C72 27 78 35 78 45 C78 55 72 62 59 62 H43 V77 H27 Z M43 40 V50 H58 C62 50 64 48 64 45 C64 42 62 40 58 40 Z" fill={color} />
    <Path d="M72 68 L82 78" stroke={Colors.text} strokeWidth="5" strokeLinecap="square" />
  </Svg>;
}

export function TeamCrest({ id, color, size = 54 }: { id: string; color: string; size?: number }) {
  const source = TEAM_LOGO_ASSETS[id];
  const [failedId, setFailedId] = useState<string>();

  if (!source || failedId === id) return <View style={[styles.crestFrame, styles.crestFallback, { width: size, height: size }]}><AbstractTeamCrest id={id} color={color} size={size - 8} /></View>;
  return <View style={[styles.crestFrame, { width: size, height: size }]}>
    <Image
      source={source}
      style={styles.crestImage}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={80}
      accessibilityLabel={`Logo oficial de ${id}`}
      onError={() => setFailedId(id)}
    />
  </View>;
}

export function PlayerAvatar({ id, color = Colors.orange, size = 72 }: { id: string; color?: string; size?: number }) {
  const seed = hash(id);
  const variant = seed % 8;
  const skin = [Colors.orange, Colors.blue, Colors.green, Colors.purple, '#e46b5d', '#d8a24a', '#55c9b2', '#a66cff'][variant];
  const hair = variant % 2 === 0 ? Colors.text : Colors.bg;
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Avatar ficticio configurable">
    <Defs><LinearGradient id={`a-${seed}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color === Colors.orange ? skin : color} /><Stop offset="1" stopColor={Colors.panelSoft} /></LinearGradient></Defs>
    <Rect width="100" height="100" rx={variant === 7 ? 18 : 50} fill={Colors.bgRaised} stroke={color === Colors.orange ? skin : color} strokeWidth="2" />
    <Circle cx="50" cy="39" r={17 + variant % 4} fill={`url(#a-${seed})`} />
    <Path d={`M18 92 C21 ${67 - variant % 5}, 35 60, 50 60 C65 60, 79 ${67 - variant % 5}, 82 92`} fill={`url(#a-${seed})`} />
    {variant < 4 ? <Path d={`M${30 + variant} 30 Q50 ${12 + variant * 2} ${70 - variant} 30 L${65 - variant} 24 Q50 ${18 + variant} ${35 + variant} 24 Z`} fill={hair} opacity="0.8" /> : null}
    {variant === 4 || variant === 5 ? <Path d="M30 31 Q50 12 70 31" fill="none" stroke={hair} strokeWidth="8" strokeLinecap="round" /> : null}
    <Path d={variant % 3 === 0 ? 'M31 39 L44 36 M56 36 L69 39' : 'M33 39 L43 39 M57 39 L67 39'} stroke={Colors.text} strokeWidth="3" opacity="0.62" />
    <Path d={variant % 2 === 0 ? 'M42 51 Q50 56 58 51' : 'M42 52 L58 52'} fill="none" stroke={Colors.text} strokeWidth="2" opacity="0.7" />
  </Svg>;
}

export function TrophyMark({ size = 72, color = Colors.orange }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Trofeo original ROUND ONE">
    <Defs><LinearGradient id="trophy-gradient" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={Colors.text} /><Stop offset="0.5" stopColor={color} /><Stop offset="1" stopColor={Colors.panelSoft} /></LinearGradient></Defs>
    <Polygon points="50,4 76,25 65,64 50,78 35,64 24,25" fill="url(#trophy-gradient)" stroke={color} strokeWidth="2" />
    <Path d="M25 27 L50 44 L75 27 M35 64 L65 64" fill="none" stroke={Colors.bg} strokeWidth="4" opacity="0.65" />
    <Rect x="43" y="76" width="14" height="10" fill={color} /><Rect x="27" y="86" width="46" height="9" fill={Colors.panelSoft} stroke={color} strokeWidth="2" />
  </Svg>;
}

const styles = StyleSheet.create({
  crestFrame: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgRaised, borderRadius: 10, borderWidth: 1, borderColor: Colors.line },
  crestFallback: { overflow: 'hidden' },
  crestImage: { width: '100%', height: '100%' },
});
