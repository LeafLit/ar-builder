import type {
  SerializableClassifierPredictor,
  SerializedEmbeddingClassifier,
  TrainableClassifier,
  TrainingExample
} from "./classifierTypes";

type Centroid = {
  stateId: string;
  vector: number[];
};

export type EmbeddingClassifier = TrainableClassifier & SerializableClassifierPredictor;

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

export function createEmbeddingClassifier(): EmbeddingClassifier {
  return createClassifier();
}

export function createEmbeddingClassifierFromSnapshot(
  snapshot: SerializedEmbeddingClassifier
): EmbeddingClassifier {
  if (snapshot.kind !== "embedding-centroid-v1") {
    throw new Error("Unsupported embedding classifier snapshot.");
  }

  return createClassifier(snapshot.centroids);
}

function createClassifier(initialCentroids: Centroid[] = []): EmbeddingClassifier {
  let centroids: Centroid[] = cloneCentroids(initialCentroids);

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
    },

    serialize() {
      return {
        kind: "embedding-centroid-v1",
        centroids: cloneCentroids(centroids)
      };
    }
  };
}

function cloneCentroids(centroids: Centroid[]): Centroid[] {
  return centroids.map((centroid) => ({
    stateId: centroid.stateId,
    vector: [...centroid.vector]
  }));
}
