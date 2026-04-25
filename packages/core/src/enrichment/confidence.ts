export const validatedConfidenceThreshold = 0.75;

export function isValidatedConfidence(confidence: number): boolean {
  return confidence >= validatedConfidenceThreshold;
}
