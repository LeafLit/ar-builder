import type { Prediction, TrainableClassifier, TrainingExample } from "./classifierTypes";

type Centroid = {
  stateId: string;
  vector: number[];
};

function average(vectors: number[][]): number[] {
  const size = vectors[0]?.length ?? 0;
  const result = Array.from({ length: size }, () => 0);

  for (const vector of vectors) {
    vector.forEach((value, index) => {
      result[index] += value;
    });
  }

  return result.map((value) => value / vectors.length);
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

export function createEmbeddingClassifier(): TrainableClassifier {
  let centroids: Centroid[] = [];

  return {
    train(examples) {
      const grouped = new Map<string, number[][]>();

      for (const example of examples) {
        const current = grouped.get(example.stateId) ?? [];
        current.push(example.embedding);
        grouped.set(example.stateId, current);
      }

      centroids = Array.from(grouped.entries()).map(([stateId, vectors]) => ({
        stateId,
        vector: average(vectors)
      }));
    },

    predict(embedding) {
      if (centroids.length === 0) {
        return undefined;
      }

      const ranked = centroids
        .map((centroid) => ({
          stateId: centroid.stateId,
          distance: distance(embedding, centroid.vector)
        }))
        .sort((a, b) => a.distance - b.distance);

      const best = ranked[0];
      const confidence = 1 / (1 + best.distance);

      return { stateId: best.stateId, confidence };
    }
  };
}
