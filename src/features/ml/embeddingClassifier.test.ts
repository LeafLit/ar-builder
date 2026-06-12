import {
  createEmbeddingClassifier,
  createEmbeddingClassifierFromSnapshot
} from "./embeddingClassifier";

describe("embeddingClassifier", () => {
  it("predicts the nearest trained state", () => {
    const classifier = createEmbeddingClassifier();

    classifier.train([
      { stateId: "left", embedding: [0, 0, 0] },
      { stateId: "left", embedding: [0.1, 0, 0] },
      { stateId: "right", embedding: [1, 1, 1] },
      { stateId: "right", embedding: [0.9, 1, 1] }
    ]);

    const prediction = classifier.predict([0.05, 0, 0]);

    expect(prediction?.stateId).toBe("left");
    expect(prediction?.confidence).toBeGreaterThan(0.5);
  });

  it("returns undefined before training", () => {
    const classifier = createEmbeddingClassifier();

    expect(classifier.predict([1, 2, 3])).toBeUndefined();
  });

  it("keeps confidence high when the embedding is clearly closer to one state", () => {
    const classifier = createEmbeddingClassifier();

    classifier.train([
      { stateId: "state_a", embedding: [0, 0] },
      { stateId: "state_b", embedding: [10, 0] }
    ]);

    const prediction = classifier.predict([3, 0]);

    expect(prediction?.stateId).toBe("state_a");
    expect(prediction?.confidence).toBeGreaterThan(0.45);
  });

  it("keeps confidence low when the embedding is between trained states", () => {
    const classifier = createEmbeddingClassifier();

    classifier.train([
      { stateId: "state_a", embedding: [0, 0] },
      { stateId: "state_b", embedding: [10, 0] }
    ]);

    const prediction = classifier.predict([5, 0]);

    expect(prediction?.confidence).toBeLessThan(0.45);
  });

  it("restores the same nearest-state predictions from a serialized snapshot", () => {
    const classifier = createEmbeddingClassifier();
    classifier.train([
      { stateId: "state_a", embedding: [0, 0, 0] },
      { stateId: "state_a", embedding: [0.2, 0, 0] },
      { stateId: "state_b", embedding: [1, 1, 1] },
      { stateId: "state_b", embedding: [0.8, 1, 1] }
    ]);

    const restored = createEmbeddingClassifierFromSnapshot(classifier.serialize());

    expect(restored.predict([0.1, 0, 0])).toEqual(classifier.predict([0.1, 0, 0]));
    expect(restored.predict([0.9, 1, 1])?.stateId).toBe("state_b");
  });
});
