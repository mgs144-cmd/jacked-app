/**
 * Calculate estimated 1 Rep Max using Epley Formula
 * Formula: 1RM = weight × (1 + reps/30)
 *
 * @param weight - Weight lifted in pounds
 * @param reps - Number of repetitions
 * @returns Estimated one rep max, rounded to nearest 0.5 lbs
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) {
    return weight
  }

  // Epley formula
  const oneRM = weight * (1 + reps / 30)

  // Round to nearest 0.5 lbs
  return Math.round(oneRM * 2) / 2
}

/**
 * RPE to %1RM table (reps x RPE) - based on RTS/Barbell Medicine style
 * RPE 10 = max effort. Lower RPE = lower % of 1RM for that rep range.
 * Values are approximate % of 1RM (as decimal, e.g. 0.92 = 92%)
 */
const RPE_TABLE: Record<number, Record<number, number>> = {
  1: { 10: 1.0, 9.5: 0.978, 9: 0.955, 8.5: 0.932, 8: 0.909, 7.5: 0.886, 7: 0.863, 6.5: 0.84, 6: 0.818 },
  2: { 10: 0.955, 9.5: 0.939, 9: 0.922, 8.5: 0.907, 8: 0.892, 7.5: 0.878, 7: 0.863, 6.5: 0.85, 6: 0.836 },
  3: { 10: 0.922, 9.5: 0.908, 9: 0.895, 8.5: 0.881, 8: 0.868, 7.5: 0.855, 7: 0.842, 6.5: 0.83, 6: 0.817 },
  4: { 10: 0.892, 9.5: 0.878, 9: 0.863, 8.5: 0.85, 8: 0.836, 7.5: 0.823, 7: 0.81, 6.5: 0.8, 6: 0.788 },
  5: { 10: 0.863, 9.5: 0.85, 9: 0.836, 8.5: 0.823, 8: 0.81, 7.5: 0.797, 7: 0.784, 6.5: 0.772, 6: 0.76 },
  6: { 10: 0.837, 9.5: 0.824, 9: 0.811, 8.5: 0.799, 8: 0.786, 7.5: 0.774, 7: 0.761, 6.5: 0.75, 6: 0.739 },
  7: { 10: 0.811, 9.5: 0.799, 9: 0.786, 8.5: 0.774, 8: 0.761, 7.5: 0.75, 7: 0.739, 6.5: 0.728, 6: 0.717 },
  8: { 10: 0.786, 9.5: 0.774, 9: 0.761, 8.5: 0.75, 8: 0.739, 7.5: 0.728, 7: 0.717, 6.5: 0.706, 6: 0.696 },
  9: { 10: 0.761, 9.5: 0.75, 9: 0.739, 8.5: 0.728, 8: 0.717, 7.5: 0.707, 7: 0.696, 6.5: 0.686, 6: 0.676 },
  10: { 10: 0.739, 9.5: 0.728, 9: 0.717, 8.5: 0.707, 8: 0.696, 7.5: 0.686, 7: 0.676, 6.5: 0.666, 6: 0.656 },
}

function getRPEPercent(reps: number, rpe: number): number {
  const repRow = RPE_TABLE[Math.min(reps, 10)] || RPE_TABLE[10]
  const rpeKey = Math.floor(rpe * 2) / 2 // round to 0.5
  return repRow[rpeKey] ?? repRow[10] ?? 1
}

/**
 * Calculate estimated 1RM with RPE adjustment
 * When RPE < 10, we were not at true max - adjust upward
 *
 * @param weight - Weight lifted in pounds
 * @param reps - Number of repetitions
 * @param rpe - RPE 5-10 (optional, defaults to 10)
 * @returns Estimated one rep max
 */
export function calculateOneRepMaxWithRPE(
  weight: number,
  reps: number,
  rpe?: number | null
): number {
  if (!rpe || rpe >= 10) {
    return calculateOneRepMax(weight, reps)
  }

  const percentOf1RM = getRPEPercent(reps, rpe)
  const estimated1RM = weight / percentOf1RM
  return Math.round(estimated1RM * 2) / 2
}

/**
 * Format a lift for display with optional 1RM
 */
export function formatLiftWithOneRM(
  exercise: string,
  weight: number,
  reps: number,
  rpe?: number | null
): {
  exercise: string
  weight: number
  reps: number
  oneRM: number | null
  displayText: string
} {
  const oneRM = calculateOneRepMaxWithRPE(weight, reps, rpe ?? 10)

  let displayText = `${weight} lbs`
  if (reps > 1) {
    displayText += ` × ${reps} reps`
  }
  if (rpe && rpe < 10) {
    displayText += ` @${rpe} RPE`
  }
  displayText += ` (e1RM: ${oneRM} lbs)`

  return {
    exercise,
    weight,
    reps,
    oneRM,
    displayText,
  }
}
