import { Href, router, useLocalSearchParams, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

import { SCREEN_IDS, ScreenId } from '@/constants/routes';
import { GameScreen } from '@/screens/game-screen';

export function generateStaticParams() {
  return SCREEN_IDS.map((screen) => ({ screen }));
}

export default function DynamicGameRoute() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  const pathname = usePathname();
  const routeFromPath = pathname.split('/').filter(Boolean).at(-1)?.replace(/\.html$/, '');
  const [browserScreen] = useState(() => typeof globalThis.location === 'object' ? globalThis.location.pathname.split('/').filter(Boolean).at(-1)?.replace(/\.html$/, '') : undefined);
  const candidate = [screen, browserScreen, routeFromPath].find((value) => SCREEN_IDS.includes(value as ScreenId));
  const selected: ScreenId = candidate ? candidate as ScreenId : 'dashboard';
  useEffect(() => { router.replace(`/game?view=${selected}` as Href); }, [selected]);
  return <GameScreen screen={selected} />;
}
