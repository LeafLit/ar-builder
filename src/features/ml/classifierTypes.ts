export type TrainingExample = {
  stateId: string;
  embedding: number[];
};

export type Prediction = {
  stateId: string;
  confidence: number;
};

export type ClassifierPredictor = {
  predict(embedding: number[]): Prediction | undefined;
};

export type SerializedEmbeddingClassifier = {
  kind: "embedding-centroid-v1";
  centroids: {
    stateId: string;
    vector: number[];
  }[];
};

export type SerializedRecognitionModel = {
  version: 1;
  classifier: SerializedEmbeddingClassifier;
};

export type SerializableClassifierPredictor = ClassifierPredictor & {
  serialize(): SerializedEmbeddingClassifier;
};

export type TrainableClassifier = ClassifierPredictor & {
  train(examples: TrainingExample[]): void;
};

export type ImageEmbedder = {
  embed(image: HTMLImageElement | HTMLCanvasElement | ImageData): Promise<number[]>;
};

export type RecognitionModel = {
  classifier: ClassifierPredictor;
  embedder: ImageEmbedder;
};
