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
 * Format a lift for display with optional 1RM
 * 
 * @param exercise - Exercise name
 * @param weight - Weight lifted
 * @param reps - Number of reps
 * @returns Formatted string like "405 lbs × 3 reps (est. 1RM: 446 lbs)"
 */
export function formatLiftWithOneRM(exercise: string, weight: number, reps: number): {
  exercise: string
  weight: number
  reps: number
  oneRM: number | null
  displayText: string
} {
  const oneRM = reps > 1 ? calculateOneRepMax(weight, reps) : null
  
  let displayText = `${weight} lbs`
  if (reps > 1) {
    displayText += ` × ${reps} reps`
  }
  if (oneRM) {
    displayText += ` (est. 1RM: ${oneRM} lbs)`
  }
  
  return {
    exercise,
    weight,
    reps,
    oneRM,
    displayText
  }
}

