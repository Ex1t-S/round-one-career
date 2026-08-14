import { useLocalSearchParams } from 'expo-router';

import { SCREEN_IDS, ScreenId } from '@/constants/routes';
import { GameScreen } from '@/screens/game-screen';

export default function CanonicalGameRoute() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const screen: ScreenId = SCREEN_IDS.includes(view as ScreenId) ? view as ScreenId : 'dashboard';
  return <GameScreen screen={screen} />;
}
