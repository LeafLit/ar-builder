import { createCameraService, type CameraService } from "../capture/cameraService";
import type { Prediction } from "../ml/classifierTypes";
import type { RecognitionListener, RecognitionSession, StateRecognizer } from "./stateRecognizer";

export type ColorMarkerRecognizerOptions = {
  cameraService?: CameraService;
  frameExtractor?: FrameExtractor;
  frameSize?: number;
  intervalMs?: number;
  stateIds: string[];
  video: HTMLVideoElement;
};
export type FrameExtractor = (video: HTMLVideoElement, size: number) => ImageData;

type MarkerColor = "red" | "green" | "blue";

const COLOR_TO_STATE_INDEX: Record<MarkerColor, number> = {
  red: 0,
  green: 1,
  blue: 2
};

export function detectColorMarker(
  imageData: ImageData,
  stateIds: string[]
): Prediction | undefined {
  const average = averageColor(imageData);
  const channels = [
    { color: "red" as const, value: average.red },
    { color: "green" as const, value: average.green },
    { color: "blue" as const, value: average.blue }
  ].sort((a, b) => b.value - a.value);
  const dominant = channels[0];
  const runnerUp = channels[1];
  const brightness = (average.red + average.green + average.blue) / 3;
  const colorGap = dominant.value - runnerUp.value;

  if (brightness < 45 || dominant.value < 140 || colorGap < 55) {
    return undefined;
  }

  const stateId = stateIds[COLOR_TO_STATE_INDEX[dominant.color]];

  if (!stateId) {
    return undefined;
  }

  return {
    stateId,
    confidence: Math.round((colorGap / 255) * 100) / 100
  };
}

export function createColorMarkerRecognizer(
  options: ColorMarkerRecognizerOptions
): StateRecognizer {
  const cameraService = options.cameraService ?? createCameraService();
  const frameExtractor = options.frameExtractor ?? extractVideoFrame;
  const frameSize = options.frameSize ?? 32;
  const intervalMs = options.intervalMs ?? 220;

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
          const frame = frameExtractor(options.video, frameSize);
          const prediction = detectColorMarker(frame, options.stateIds);

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
    throw new Error("无法创建颜色标记识别画布。");
  }

  context.drawImage(video, 0, 0, size, size);
  return context.getImageData(0, 0, size, size);
}

function averageColor(imageData: ImageData) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let pixels = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    red += imageData.data[index];
    green += imageData.data[index + 1];
    blue += imageData.data[index + 2];
    pixels += 1;
  }

  return {
    red: red / pixels,
    green: green / pixels,
    blue: blue / pixels
  };
}
