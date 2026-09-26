import { randomInt } from 'node:crypto';
import { z } from 'zod';
export type MiniType = 'wheel' | 'chests' | 'targets' | 'scratch';
export const isMiniType = (value: string): value is MiniType => ['wheel', 'chests', 'targets', 'scratch'].includes(value);
export const miniConfigSchema = z.object({
  durationSeconds: z.number().int().min(5).max(120).optional(),
  mode: z.enum(['instant', 'multiplier']),
  targetRange: z.object({ min: z.number().int().min(0).max(1000000), max: z.number().int().min(0).max(1000000) }).strict().optional(),
  baseAmount: z.number().int().min(1).max(10000).optional(),
  prizes: z.array(z.object({ mode: z.enum(['instant', 'multiplier']).optional(), amount: z.number().int().min(0).max(1000000), label: z.string().trim().max(30).optional() }).strict()).min(2).max(16),
}).strict().superRefine((value, ctx) => {
  if ((value.mode === 'multiplier' || value.prizes.some((p) => p.mode === 'multiplier')) && value.baseAmount === undefined) ctx.addIssue({ code: 'custom', message: 'baseAmount is required for multiplier prizes', path: ['baseAmount'] });
  if (value.targetRange && (value.targetRange.min > value.targetRange.max || value.targetRange.max * (value.mode === 'multiplier' ? value.baseAmount ?? 1 : 1) > 1000000)) ctx.addIssue({ code: 'custom', message: 'Invalid target prize range or maximum payout' });
  if (value.prizes.some((p) => p.amount * ((p.mode ?? value.mode) === 'multiplier' ? value.baseAmount ?? 1 : 1) > 1000000)) ctx.addIssue({ code: 'custom', message: 'Each prize payout must not exceed 1,000,000 credits' });
});
export type MiniConfig = z.infer<typeof miniConfigSchema>;
export interface MiniOutcome { total?: boolean; hitCount?: number; prizeIndex: number; choiceIndex?: number; revealedPrizes?: number[]; amount: number; payout: number; mode: MiniConfig['mode']; baseAmount?: number }
export function defaultMiniConfig(type: MiniType): MiniConfig {
  return { mode: 'instant', ...(type === 'targets' ? {targetRange:{min:5,max:100}} : {}), prizes: (type === 'wheel' ? [5, 10, 15, 25, 50, 100, 10, 20] : [5, 10, 20, 30, 50, 100]).map((amount) => ({ amount })) };
}
export function validateMiniConfig(type: MiniType, value: unknown): MiniConfig {
  const config = miniConfigSchema.parse(value);
  if (type !== 'wheel' && config.prizes.length > 12) throw new z.ZodError([{ code: 'custom', path: ['prizes'], message: 'Choose between 2 and 12 choices.' }]);
  if (type !== 'scratch' && config.prizes.some((p) => p.mode !== undefined)) throw new z.ZodError([{code:'custom',path:['prizes'],message:'Per-zone modes are only supported for scratch cards.'}]);
  if (config.targetRange && type !== 'targets') throw new z.ZodError([{code:'custom',path:['targetRange'],message:'Prize ranges are only supported for targets.'}]);
  return config;
}
export function drawMini(type: MiniType, config: MiniConfig, choiceIndex?: number, draw = randomInt): MiniOutcome {
  validateMiniConfig(type, config);
  if (type !== 'wheel' && (!Number.isInteger(choiceIndex) || choiceIndex! < 0 || choiceIndex! >= config.prizes.length)) throw new Error('Choose a valid game item.');
  const prizeIndex = draw(config.prizes.length);
  const amount = type === 'targets' && config.targetRange
    ? config.targetRange.min + draw(config.targetRange.max - config.targetRange.min + 1)
    : config.prizes[prizeIndex].amount;
  const mode = config.prizes[prizeIndex].mode ?? config.mode;
  let revealedPrizes: number[] | undefined;
  if (type === 'chests' || type === 'scratch') {
    // Store the entire layout with the paid result so retries reveal the same board.
    const remaining = config.prizes.map((_, i) => i).filter((i) => i !== prizeIndex);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = draw(i + 1); [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    revealedPrizes = Array.from({ length: config.prizes.length }, (_, i) => i === choiceIndex ? prizeIndex : remaining.shift()!);
  }
  return { prizeIndex, ...(type !== 'wheel' ? { choiceIndex } : {}), ...(revealedPrizes ? { revealedPrizes } : {}), amount, payout: amount * (mode === 'multiplier' ? config.baseAmount! : 1), mode, ...(mode === 'multiplier' ? { baseAmount: config.baseAmount } : {}) };
}
