import { ImageSource } from 'expo-image';

export type VisualAssetKey = 'major-cologne' | 'major-singapore' | 'offseason-studio' | 'career-finale' | 'training-center' | 'health-recovery' | 'contract-market';

export const VISUAL_ASSETS: Record<VisualAssetKey, ImageSource> = {
  'major-cologne': require('../../assets/phase2/major-cologne.webp'),
  'major-singapore': require('../../assets/phase2/major-singapore.webp'),
  'offseason-studio': require('../../assets/phase2/offseason-studio.webp'),
  'career-finale': require('../../assets/phase2/career-finale.webp'),
  'training-center': require('../../assets/phase2/training-center.webp'),
  'health-recovery': require('../../assets/phase2/health-recovery.webp'),
  'contract-market': require('../../assets/phase2/contract-market.webp'),
};

export function majorBannerKey(tournamentId: string): VisualAssetKey {
  return tournamentId === 'singapore-major' ? 'major-singapore' : 'major-cologne';
}
