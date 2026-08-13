import { BracketMatch, BracketState } from '@/types/game';

export function createBracket(participants: string[], playoffFormat: 'BO3' | 'BO5' = 'BO3', grandFinalFormat: 'BO3' | 'BO5' = 'BO5'): BracketState {
  if (participants.length !== 8) throw new Error('A Major playoff bracket requires exactly eight participants.');
  const seeds = [0, 7, 3, 4, 1, 6, 2, 5];
  const ordered = seeds.map((seed) => participants[seed]);
  const matches: BracketMatch[] = [];
  for (let slot = 0; slot < 4; slot += 1) matches.push({ id: `qf-${slot + 1}`, round: 'quarterfinal', slot, teamAId: ordered[slot * 2], teamBId: ordered[slot * 2 + 1], format: playoffFormat });
  for (let slot = 0; slot < 2; slot += 1) matches.push({ id: `sf-${slot + 1}`, round: 'semifinal', slot, format: playoffFormat });
  matches.push({ id: 'gf-1', round: 'grand-final', slot: 0, format: grandFinalFormat });
  return { participants: [...participants], matches };
}

export function bracketReadyMatch(bracket: BracketState, teamId: string) {
  return bracket.matches.find((match) => !match.winnerId && (match.teamAId === teamId || match.teamBId === teamId) && match.teamAId && match.teamBId);
}

export function recordBracketResult(bracket: BracketState, matchId: string, winnerId: string, score: string, mvp: string, highlight: string): BracketState {
  const matches = bracket.matches.map((match) => ({ ...match }));
  const match = matches.find((item) => item.id === matchId);
  if (!match?.teamAId || !match.teamBId || ![match.teamAId, match.teamBId].includes(winnerId)) return { ...bracket, matches };
  match.winnerId = winnerId;
  match.loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;
  match.score = score;
  match.mvp = mvp;
  match.highlight = highlight;
  if (match.round === 'quarterfinal') {
    const semifinal = matches.find((item) => item.round === 'semifinal' && item.slot === Math.floor(match.slot / 2));
    if (semifinal) {
      if (match.slot % 2 === 0) semifinal.teamAId = winnerId;
      else semifinal.teamBId = winnerId;
    }
  } else if (match.round === 'semifinal') {
    const final = matches.find((item) => item.round === 'grand-final');
    if (final) {
      if (match.slot === 0) final.teamAId = winnerId;
      else final.teamBId = winnerId;
    }
  }
  const final = matches.find((item) => item.round === 'grand-final');
  return { ...bracket, matches, championId: final?.winnerId, runnerUpId: final?.loserId };
}

export function assertBracketIntegrity(bracket: BracketState) {
  if (bracket.participants.length !== 8) return false;
  return bracket.matches.length === 7 && bracket.matches.every((match) => !match.winnerId || match.winnerId === match.teamAId || match.winnerId === match.teamBId);
}
