import { createSampleModelTrainer } from "../features/ml/sampleModelTrainer";
import type { ModelTrainer } from "../features/ml/TrainScreen";

export function createAppTrainer(
  sampleCounts: Record<string, number>
): ModelTrainer | undefined {
  const stateIds = Object.keys(sampleCounts);
  const hasSamples = stateIds.some((stateId) => (sampleCounts[stateId] ?? 0) > 0);

  if (!hasSamples) {
    return undefined;
  }

  return createSampleModelTrainer({ stateIds });
}
