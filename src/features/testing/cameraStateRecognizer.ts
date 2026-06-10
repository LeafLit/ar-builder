import { createCameraService, type CameraService } from "../capture/cameraService";
import type { ImageEmbedder, TrainableClassifier } from "../ml/classifierTypes";
import type { RecognitionListener, RecognitionSession, StateRecognizer } from "./stateRecognizer";

export type FrameLoader = (blob: Blob) => Promise<HTMLImageElement | HTMLCanvasElement | ImageData>;

export type CameraStateRecognizerOptions = {
  video: HTMLVideoElement;
  embedder: ImageEmbedder;
  classifier: Pick<TrainableClassifier, "predict">;
  cameraService?: CameraService;
  frameLoader?: FrameLoader;
  intervalMs?: number;
};

export function createCameraStateRecognizer(
  options: CameraStateRecognizerOptions
): StateRecognizer {
  const cameraService = options.cameraService ?? createCameraService();
  const frameLoader = options.frameLoader ?? loadBlobAsImage;
  const intervalMs = options.intervalMs ?? 900;

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
          const frame = await cameraService.captureFrame(options.video);
          const image = await frameLoader(frame);
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
      reject(new Error("无法读取相机帧。"));
    };
    image.src = url;
  });
}
