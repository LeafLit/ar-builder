import type { CameraService } from "../capture/cameraService";
import type { ImageEmbedder, TrainableClassifier } from "../ml/classifierTypes";
import { createCameraStateRecognizer } from "./cameraStateRecognizer";

function createFakeCameraService(stream: MediaStream, frame: Blob): CameraService {
  return {
    start: vi.fn(async () => stream),
    stop: vi.fn(),
    captureFrame: vi.fn(async () => frame)
  };
}

function createFakeEmbedder(embedding: number[]): ImageEmbedder {
  return {
    embed: vi.fn(async () => embedding)
  };
}

function createFakeClassifier(): TrainableClassifier {
  return {
    train: vi.fn(),
    predict: vi.fn(() => ({
      stateId: "state_a",
      confidence: 0.74
    }))
  };
}

describe("cameraStateRecognizer", () => {
  it("captures a camera frame, embeds it, and emits classifier predictions", async () => {
    const video = document.createElement("video");
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const frame = new Blob(["frame"], { type: "image/jpeg" });
    const image = document.createElement("canvas");
    const cameraService = createFakeCameraService(stream, frame);
    const embedder = createFakeEmbedder([0.1, 0.2]);
    const classifier = createFakeClassifier();
    const frameLoader = vi.fn(async () => image);
    const onResult = vi.fn();

    const recognizer = createCameraStateRecognizer({
      video,
      cameraService,
      embedder,
      classifier,
      frameLoader,
      intervalMs: 1000
    });

    await recognizer.start(onResult);

    expect(cameraService.start).toHaveBeenCalledWith(video);
    expect(cameraService.captureFrame).toHaveBeenCalledWith(video);
    expect(frameLoader).toHaveBeenCalledWith(frame);
    expect(embedder.embed).toHaveBeenCalledWith(image);
    expect(classifier.predict).toHaveBeenCalledWith([0.1, 0.2]);
    expect(onResult).toHaveBeenCalledWith({
      stateId: "state_a",
      confidence: 0.74
    });
  });

  it("stops the camera stream and cancels future captures", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const frame = new Blob(["frame"], { type: "image/jpeg" });
    const cameraService = createFakeCameraService(stream, frame);
    const recognizer = createCameraStateRecognizer({
      video,
      cameraService,
      embedder: createFakeEmbedder([0.1]),
      classifier: createFakeClassifier(),
      frameLoader: vi.fn(async () => document.createElement("canvas")),
      intervalMs: 100
    });

    const session = await recognizer.start(vi.fn());
    session.stop();
    vi.advanceTimersByTime(100);

    expect(cameraService.stop).toHaveBeenCalledWith(stream);
    expect(cameraService.captureFrame).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
