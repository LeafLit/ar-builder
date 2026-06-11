import { createCameraService, type CameraService } from "../capture/cameraService";
import type { ImageEmbedder, TrainableClassifier } from "../ml/classifierTypes";
import type { RecognitionListener, RecognitionSession, StateRecognizer } from "./stateRecognizer";

export type FrameLoader = (blob: Blob) => Promise<HTMLImageElement | HTMLCanvasElement | ImageData>;
export type FrameExtractor = (video: HTMLVideoElement, size: number) => ImageData;

export type CameraStateRecognizerOptions = {
  video: HTMLVideoElement;
  embedder: ImageEmbedder;
  classifier: Pick<TrainableClassifier, "predict">;
  cameraService?: CameraService;
  frameExtractor?: FrameExtractor;
  frameLoader?: FrameLoader;
  frameSize?: number;
  intervalMs?: number;
};

export function createCameraStateRecognizer(
  options: CameraStateRecognizerOptions
): StateRecognizer {
  const cameraService = options.cameraService ?? createCameraService();
  const frameExtractor = options.frameExtractor ?? extractVideoFrame;
  const frameSize = options.frameSize ?? 48;
  const intervalMs = options.intervalMs ?? 350;

  return {
    async start(onResult: RecognitionListener): Promise<RecognitionSession> {
      const stream = await cameraService.start(options.video);
      let stopped = false;
      let recognizing = false;

      async function recognizeFrame() {
        if (stopped || recognizing) {
          return;
        }

        recognizing = true;

        try {
          const image = frameExtractor(options.video, frameSize);
          const embedding = await options.embedder.embed(image);
          const prediction = options.classifier.predict(embedding);

          if (!stopped && prediction) {
            onResult(prediction);
          }
        } finally {
          recognizing = false;
        }
      }

      await recognizeFrame();
      const intervalId = globalThis.setInterval(() => {
        void recognizeFrame();
      }, intervalMs);

      return {
        stop() {
          stopped = true;
          globalThis.clearInterval(intervalId);
          cameraService.stop(stream);
        }
      };
    }
  };
}

function extractVideoFrame(video: HTMLVideoElement, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("无法创建实时识别画布。");
  }

  context.drawImage(video, 0, 0, size, size);

  return context.getImageData(0, 0, size, size);
}
