import {
  createInitialStableRecognitionState,
  updateStableRecognition
} from "./stableRecognition";

describe("stableRecognition", () => {
  it("does not confirm a state after only one matching frame", () => {
    const state = updateStableRecognition(
      createInitialStableRecognitionState(),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );

    expect(state).toEqual({
      candidateStateId: "state_a",
      candidateCount: 1,
      confirmedStateId: undefined,
      missedCount: 0
    });
  });

  it("confirms a state after two consecutive matching frames", () => {
    const first = updateStableRecognition(
      createInitialStableRecognitionState(),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );
    const second = updateStableRecognition(first, { stateId: "state_a", confidence: 0.8 }, 0.15);

    expect(second.confirmedStateId).toBe("state_a");
    expect(second.candidateCount).toBe(2);
    expect(second.missedCount).toBe(0);
  });

  it("requires two consecutive frames before switching confirmed states", () => {
    const confirmedA = updateStableRecognition(
      updateStableRecognition(
        createInitialStableRecognitionState(),
        { stateId: "state_a", confidence: 0.9 },
        0.15
      ),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );
    const firstB = updateStableRecognition(
      confirmedA,
      { stateId: "state_b", confidence: 0.9 },
      0.15
    );
    const secondB = updateStableRecognition(firstB, { stateId: "state_b", confidence: 0.9 }, 0.15);

    expect(firstB.confirmedStateId).toBe("state_a");
    expect(firstB.candidateStateId).toBe("state_b");
    expect(firstB.candidateCount).toBe(1);
    expect(secondB.confirmedStateId).toBe("state_b");
  });

  it("clears confirmed state after two missed frames", () => {
    const confirmed = updateStableRecognition(
      updateStableRecognition(
        createInitialStableRecognitionState(),
        { stateId: "state_a", confidence: 0.9 },
        0.15
      ),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );
    const firstMiss = updateStableRecognition(
      confirmed,
      { stateId: "state_a", confidence: 0.05 },
      0.15
    );
    const secondMiss = updateStableRecognition(
      firstMiss,
      { stateId: "state_a", confidence: 0.04 },
      0.15
    );

    expect(firstMiss.confirmedStateId).toBe("state_a");
    expect(firstMiss.missedCount).toBe(1);
    expect(secondMiss.confirmedStateId).toBeUndefined();
    expect(secondMiss.candidateStateId).toBeUndefined();
    expect(secondMiss.candidateCount).toBe(0);
    expect(secondMiss.missedCount).toBe(2);
  });

  it("does not accumulate low-confidence candidates", () => {
    const first = updateStableRecognition(
      createInitialStableRecognitionState(),
      { stateId: "state_a", confidence: 0.05 },
      0.15
    );
    const second = updateStableRecognition(first, { stateId: "state_a", confidence: 0.05 }, 0.15);

    expect(second.confirmedStateId).toBeUndefined();
    expect(second.candidateStateId).toBeUndefined();
    expect(second.candidateCount).toBe(0);
  });
});
