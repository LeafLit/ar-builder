import {
  createSampleStore,
  type SampleStore,
  type TrainingSampleRecord
} from "../capture/sampleStore";
import {
  type ImageEmbedder,
  type RecognitionModel,
  type TrainableClassifier,
  type TrainingExample
} from "./classifierTypes";
import { createEmbeddingClassifier } from "./embeddingClassifier";
import type { ModelTrainer, TrainingResult } from "./TrainScreen";

export type SampleImageLoader = (
  blob: Blob
) => Promise<HTMLImageElement | HTMLCanvasElement | ImageData>;

export type SampleModelTrainerOptions = {
  stateIds: string[];
  sampleStore?: SampleStore;
  embedderFactory?: () => Promise<ImageEmbedder>;
  classifierFactory?: () => TrainableClassifier;
  imageLoader?: SampleImageLoader;
};

export function createSampleModelTrainer(options: SampleModelTrainerOptions): ModelTrainer {
  const sampleStore = options.sampleStore ?? createSampleStore();
  const embedderFactory = options.embedderFactory ?? createDefaultEmbedder;
  const classifierFactory = options.classifierFactory ?? createEmbeddingClassifier;
  const imageLoader = options.imageLoader ?? loadBlobAsImage;

  return {
    async train(projectId: string): Promise<TrainingResult> {
      const embedder = await embedderFactory();
      const classifier = classifierFactory();
      const examples: TrainingExample[] = [];
      const samplesByState = new Map<string, TrainingSampleRecord[]>();

      for (const stateId of options.stateIds) {
        const samples = (await sampleStore.listByState(stateId)).filter(
          (sample) => sample.projectId === projectId
        );

        if (samples.length === 0) {
          throw new Error(`状态 ${stateId} 没有可训练样本。`);
        }

        samplesByState.set(stateId, samples);
      }

      for (const stateId of options.stateIds) {
        const samples = samplesByState.get(stateId) ?? [];

        for (const sample of samples) {
          const image = await imageLoader(sample.blob);
          const embedding = await embedder.embed(image);
          examples.push({
            stateId,
            embedding
          });
        }
      }

      classifier.train(examples);

      const model: RecognitionModel = {
        classifier,
        embedder
      };

      return {
        stateCount: options.stateIds.length,
        exampleCount: examples.length,
        model
      };
    }
  };
}

async function createDefaultEmbedder() {
  const { createMobileNetEmbedder } = await import("./mobileNetEmbedder");

  return createMobileNetEmbedder();
}

function loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取训练样本图片。"));
    };
    image.src = url;
  });
}
