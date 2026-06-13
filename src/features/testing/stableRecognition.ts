export type StableRecognitionInput = {
  stateId?: string;
  confidence?: number;
};

export type StableRecognitionState = {
  candidateStateId?: string;
  candidateCount: number;
  confirmedStateId?: string;
  missedCount: number;
};

export type StableRecognitionConfig = {
  requiredMatches: number;
  requiredMisses: number;
};

export const DEFAULT_STABLE_RECOGNITION_CONFIG: StableRecognitionConfig = {
  requiredMatches: 2,
  requiredMisses: 2
};

export function createInitialStableRecognitionState(): StableRecognitionState {
  return {
    candidateCount: 0,
    missedCount: 0
  };
}

export function updateStableRecognition(
  state: StableRecognitionState,
  input: StableRecognitionInput,
  threshold: number,
  config: StableRecognitionConfig = DEFAULT_STABLE_RECOGNITION_CONFIG
): StableRecognitionState {
  if (!isMatchedPrediction(input, threshold)) {
    const missedCount = state.missedCount + 1;

    if (missedCount >= config.requiredMisses) {
      return {
        candidateCount: 0,
        missedCount
      };
    }

    return {
      ...state,
      candidateStateId: undefined,
      candidateCount: 0,
      missedCount
    };
  }

  const candidateCount =
    state.candidateStateId === input.stateId ? state.candidateCount + 1 : 1;
  const confirmedStateId =
    candidateCount >= config.requiredMatches ? input.stateId : state.confirmedStateId;

  return {
    candidateStateId: input.stateId,
    candidateCount,
    confirmedStateId,
    missedCount: 0
  };
}

function isMatchedPrediction(input: StableRecognitionInput, threshold: number) {
  return (
    input.stateId !== undefined &&
    input.confidence !== undefined &&
    input.confidence >= threshold
  );
}
