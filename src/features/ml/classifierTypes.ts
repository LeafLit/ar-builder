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
