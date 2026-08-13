import { useLocalSearchParams } from 'expo-router';

import { SCREEN_IDS } from '@/constants/routes';
import { GameScreen } from '@/screens/game-screen';

export function generateStaticParams() {
  return SCREEN_IDS.map((screen) => ({ screen }));
}

export default function DynamicGameRoute() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  return <GameScreen screen={screen ?? 'dashboard'} />;
}
