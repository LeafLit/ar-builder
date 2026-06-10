import { createEmbeddingClassifier } from "./embeddingClassifier";

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
});
