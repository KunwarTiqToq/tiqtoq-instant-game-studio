import { randomUUID } from 'node:crypto';
import { drawMini, validateMiniConfig, type MiniConfig, type MiniOutcome } from './mini-engine.js';

export interface TargetRound {
  startedAt: number;
  endsAt: number;
  activeIds: string[];
  hits: { id: string; amount: number }[];
  amount: number;
  payout: number;
}
export function startTargetRound(config: MiniConfig, now = Date.now()): TargetRound {
  validateMiniConfig('targets', config);
  const prefix = randomUUID();
  return { startedAt: now, endsAt: now + (config.durationSeconds ?? 30) * 1000,
    activeIds: Array.from({length: Math.max(3, config.prizes.length)}, (_, i) => `${prefix}.${i}.0`), hits: [], amount: 0, payout: 0 };
}
export function nextTargetId(id: string) {
  const parts = id.split('.');
  return `${parts[0]}.${parts[1]}.${Number(parts[2]) + 1}`;
}
export function hitTarget(round: TargetRound, config: MiniConfig, targetId: string, now = Date.now()): TargetRound {
  if (now >= round.endsAt || round.hits.some((hit) => hit.id === targetId)) return round;
  const index = round.activeIds.indexOf(targetId);
  if (index < 0) throw new Error('This target is not active.');
  const prize = drawMini('targets', config, Math.min(index, config.prizes.length - 1));
  const activeIds = [...round.activeIds]; activeIds[index] = nextTargetId(targetId);
  return { ...round, activeIds, hits: [...round.hits, {id: targetId, amount: prize.amount}], amount: round.amount + prize.amount, payout: round.payout + prize.payout };
}
export function targetOutcome(round: TargetRound, config: MiniConfig): MiniOutcome {
  return { prizeIndex: 0, amount: round.amount, payout: round.payout, mode: config.mode,
    ...(config.mode === 'multiplier' ? {baseAmount: config.baseAmount} : {}), total: true, hitCount: round.hits.length };
}
