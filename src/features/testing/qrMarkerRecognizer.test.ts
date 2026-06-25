import { createQrMarkerRecognizer, detectQrMarker } from "./qrMarkerRecognizer";
import type { CameraService } from "../capture/cameraService";

function createImageData(size = 4) {
  return {
    colorSpace: "srgb",
    data: new Uint8ClampedArray(size * size * 4),
    height: size,
    width: size
  } as ImageData;
}

describe("detectQrMarker", () => {
  const stateIds = ["state_a", "state_b", "state_c"];

  it("maps ARBUILDER numbered QR data to state positions", () => {
    expect(
      detectQrMarker(createImageData(), stateIds, () => ({ data: "ARBUILDER:1" }))
    ).toEqual({
      stateId: "state_a",
      confidence: 1
    });
    expect(
      detectQrMarker(createImageData(), stateIds, () => ({ data: "ARBUILDER:2" }))
    ).toEqual({
      stateId: "state_b",
      confidence: 1
    });
    expect(
      detectQrMarker(createImageData(), stateIds, () => ({ data: "ARBUILDER:3" }))
    ).toEqual({
      stateId: "state_c",
      confidence: 1
    });
  });

  it("ignores QR data that does not match a supported state", () => {
    expect(
      detectQrMarker(createImageData(), ["state_a"], () => ({ data: "ARBUILDER:3" }))
    ).toBeUndefined();
    expect(
      detectQrMarker(createImageData(), stateIds, () => ({ data: "hello" }))
    ).toBeUndefined();
    expect(detectQrMarker(createImageData(), stateIds, () => null)).toBeUndefined();
  });

  it("accepts direct state ids for advanced testing", () => {
    expect(
      detectQrMarker(createImageData(), stateIds, () => ({ data: "state:state_b" }))
    ).toEqual({
      stateId: "state_b",
      confidence: 1
    });
  });
});

describe("createQrMarkerRecognizer", () => {
  it("starts the camera and emits detected QR marker predictions", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    const stream = {} as MediaStream;
    const cameraService = createFakeCameraService(stream);
    const frameExtractor = vi.fn(() => createImageData());
    const decoder = vi.fn(() => ({ data: "ARBUILDER:2" }));
    const recognizer = createQrMarkerRecognizer({
      cameraService,
      decoder,
      frameExtractor,
      stateIds: ["state_a", "state_b"],
      video
    });
    const onResult = vi.fn();

    await recognizer.start(onResult);

    expect(cameraService.start).toHaveBeenCalledWith(video);
    expect(decoder).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({
      stateId: "state_b",
      confidence: 1
    });

    vi.useRealTimers();
  });

  it("stops the interval and camera stream", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    const stream = {} as MediaStream;
    const cameraService = createFakeCameraService(stream);
    const frameExtractor = vi.fn(() => createImageData());
    const decoder = vi.fn(() => ({ data: "ARBUILDER:1" }));
    const recognizer = createQrMarkerRecognizer({
      cameraService,
      decoder,
      frameExtractor,
      intervalMs: 100,
      stateIds: ["state_a", "state_b"],
      video
    });
    const onResult = vi.fn();

    const session = await recognizer.start(onResult);
    session.stop();
    await vi.advanceTimersByTimeAsync(300);

    expect(cameraService.stop).toHaveBeenCalledWith(stream);
    expect(onResult).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

function createFakeCameraService(stream: MediaStream) {
  return {
    captureFrame: vi.fn(async () => new Blob()),
    start: vi.fn(async () => stream),
    stop: vi.fn()
  } satisfies CameraService;
}
