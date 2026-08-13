import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { VISUAL_ASSETS, VisualAssetKey } from '@/data/visual-assets';

type ImageMode = 'cover' | 'avatar' | 'crest' | 'trophy';
type Ratio = 'wide' | 'cinema' | 'square' | 'portrait';

export function GameImage({ asset, source, mode = 'cover', ratio = 'wide', overlay = true, children, style }: { asset?: VisualAssetKey; source?: ImageSource; mode?: ImageMode; ratio?: Ratio; overlay?: boolean; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const resolved = source ?? (asset ? VISUAL_ASSETS[asset] : undefined);
  return <View style={[styles.frame, styles[ratio], mode !== 'cover' && styles[mode], style]}>
    {!failed && resolved ? <Image source={resolved} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} onLoadStart={() => setLoading(true)} onLoad={() => setLoading(false)} onError={() => { setFailed(true); setLoading(false); }} /> : <Fallback mode={mode} />}
    {loading && !failed ? <View style={styles.loading}><ActivityIndicator color={Colors.orange} size="small" /></View> : null}
    {overlay ? <LinearGradient colors={['rgba(9,11,16,.08)', 'rgba(9,11,16,.46)', 'rgba(9,11,16,.94)']} locations={[0, 0.58, 1]} style={StyleSheet.absoluteFill} /> : null}
    {children ? <View style={styles.content}>{children}</View> : null}
  </View>;
}

function Fallback({ mode }: { mode: ImageMode }) {
  const mark = mode === 'avatar' ? '01' : mode === 'crest' ? '◇' : mode === 'trophy' ? '▲' : 'R/O';
  return <LinearGradient colors={[Colors.panelSoft, Colors.bgRaised]} style={[StyleSheet.absoluteFill, styles.fallback]}><Text style={styles.fallbackText}>{mark}</Text><View style={styles.fallbackLine} /></LinearGradient>;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: Colors.panelSoft, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.line },
  wide: { aspectRatio: 16 / 9 }, cinema: { aspectRatio: 2.15 }, square: { aspectRatio: 1 }, portrait: { aspectRatio: 0.78 },
  cover: {}, avatar: { borderRadius: 999 }, crest: { borderRadius: Radius.md }, trophy: { borderColor: Colors.orange },
  loading: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgRaised },
  fallback: { alignItems: 'center', justifyContent: 'center' }, fallbackText: { color: Colors.orange, fontFamily: Fonts.mono, fontSize: 20, fontWeight: '900', letterSpacing: 2 }, fallbackLine: { width: '45%', height: 1, backgroundColor: Colors.lineStrong, marginTop: 10 },
  content: { flex: 1, padding: 18, justifyContent: 'flex-end' },
});
