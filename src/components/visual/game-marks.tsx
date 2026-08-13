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

export function TeamCrest({ id, color, size = 54 }: { id: string; color: string; size?: number }) {
  const source = TEAM_LOGO_ASSETS[id];
  const [failedId, setFailedId] = useState<string>();

  if (!source || failedId === id) return <AbstractTeamCrest id={id} color={color} size={size} />;
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
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Avatar ficticio configurable">
    <Defs><LinearGradient id={`a-${seed}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} /><Stop offset="1" stopColor={Colors.panelSoft} /></LinearGradient></Defs>
    <Rect width="100" height="100" rx="50" fill={Colors.bgRaised} stroke={color} strokeWidth="2" />
    <Circle cx="50" cy="39" r={18 + seed % 4} fill={`url(#a-${seed})`} />
    <Path d={`M18 92 C21 ${67 - seed % 5}, 35 60, 50 60 C65 60, 79 ${67 - seed % 5}, 82 92`} fill={`url(#a-${seed})`} />
    <Path d="M32 35 L44 31 M56 31 L68 35" stroke={Colors.text} strokeWidth="3" opacity="0.55" />
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
  crestFrame: { alignItems: 'center', justifyContent: 'center' },
  crestImage: { width: '100%', height: '100%' },
});
