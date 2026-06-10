import type { Prediction } from "../ml/classifierTypes";

export type RecognitionListener = (prediction: Prediction) => void;

export type RecognitionSession = {
  stop(): void;
};

export type StateRecognizer = {
  start(onResult: RecognitionListener): Promise<RecognitionSession>;
};

export function createSequenceRecognizer(
  stateIds: string[] = ["state_a", "state_b"],
  intervalMs = 1600
): StateRecognizer {
  return {
    async start(onResult) {
      let currentIndex = 0;
      let stopped = false;

      function emitNext() {
        if (stopped || stateIds.length === 0) {
          return;
        }

        onResult({
          stateId: stateIds[currentIndex],
          confidence: 1
        });
        currentIndex = (currentIndex + 1) % stateIds.length;
      }

      emitNext();
      const intervalId = globalThis.setInterval(emitNext, intervalMs);

      return {
        stop() {
          stopped = true;
          globalThis.clearInterval(intervalId);
        }
      };
    }
  };
}
