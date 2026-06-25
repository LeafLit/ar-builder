import jsQR from "jsqr";
import { createCameraService, type CameraService } from "../capture/cameraService";
import type { Prediction } from "../ml/classifierTypes";
import type { RecognitionListener, RecognitionSession, StateRecognizer } from "./stateRecognizer";

export type QrCodeResult = {
  data: string;
};

export type QrDecoder = (
  data: Uint8ClampedArray,
  width: number,
  height: number
) => QrCodeResult | null;

export type QrMarkerRecognizerOptions = {
  cameraService?: CameraService;
  decoder?: QrDecoder;
  frameExtractor?: FrameExtractor;
  frameSize?: number;
  intervalMs?: number;
  stateIds: string[];
  video: HTMLVideoElement;
};

export type FrameExtractor = (video: HTMLVideoElement, size: number) => ImageData;

export function detectQrMarker(
  imageData: ImageData,
  stateIds: string[],
  decoder: QrDecoder = decodeWithJsQr
): Prediction | undefined {
  const qrCode = decoder(imageData.data, imageData.width, imageData.height);
  const stateId = qrCode ? resolveQrStateId(qrCode.data, stateIds) : undefined;

  if (!stateId) {
    return undefined;
  }

  return {
    stateId,
    confidence: 1
  };
}

export function createQrMarkerRecognizer(options: QrMarkerRecognizerOptions): StateRecognizer {
  const cameraService = options.cameraService ?? createCameraService();
  const decoder = options.decoder ?? decodeWithJsQr;
  const frameExtractor = options.frameExtractor ?? extractVideoFrame;
  const frameSize = options.frameSize ?? 220;
  const intervalMs = options.intervalMs ?? 260;

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
          const prediction = detectQrMarker(frame, options.stateIds, decoder);

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

function resolveQrStateId(value: string, stateIds: string[]) {
  const normalized = value.trim();
  const numberedMatch = /^ARBUILDER:(\d+)$/i.exec(normalized);

  if (numberedMatch) {
    return stateIds[Number(numberedMatch[1]) - 1];
  }

  const stateMatch = /^state:([a-zA-Z0-9_-]+)$/.exec(normalized);

  if (stateMatch && stateIds.includes(stateMatch[1])) {
    return stateMatch[1];
  }

  return undefined;
}

function decodeWithJsQr(data: Uint8ClampedArray, width: number, height: number) {
  return jsQR(data, width, height);
}

function extractVideoFrame(video: HTMLVideoElement, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("无法创建二维码识别画布。");
  }

  context.drawImage(video, 0, 0, size, size);
  return context.getImageData(0, 0, size, size);
}
