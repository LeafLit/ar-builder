export type TrainingExample = {
  stateId: string;
  embedding: number[];
};

export type Prediction = {
  stateId: string;
  confidence: number;
};

export type TrainableClassifier = {
  train(examples: TrainingExample[]): void;
  predict(embedding: number[]): Prediction | undefined;
};

export type ImageEmbedder = {
  embed(image: HTMLImageElement | HTMLCanvasElement | ImageData): Promise<number[]>;
};
