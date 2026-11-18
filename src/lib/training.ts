// Double progression: add reps inside a range until every set reaches the top,
// then add weight and start again at the bottom. Also the marathon countdown.

export interface Prescription { weight: number; reps: number }
export interface ProgressionRule { minReps: number; maxReps: number; increment: number }

export function nextTarget(last: Prescription, rule: ProgressionRule): Prescription & { addedWeight: boolean } {
  if (last.reps >= rule.maxReps) {
    return { weight: last.weight + rule.increment, reps: rule.minReps, addedWeight: true };
  }
  return { weight: last.weight, reps: last.reps + 1, addedWeight: false };
}

/** Whole days from `now` until the start of `target` in local time; negative once it has passed. */
export function daysUntil(target: Date, now: Date): number {
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86_400_000);
}
