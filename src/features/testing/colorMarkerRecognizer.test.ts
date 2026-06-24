import { createColorMarkerRecognizer, detectColorMarker } from "./colorMarkerRecognizer";
import type { CameraService } from "../capture/cameraService";

function createSolidImageData(red: number, green: number, blue: number, size = 4) {
  const data = new Uint8ClampedArray(size * size * 4);

  for (let index = 0; index < data.length; index += 4) {
    data[index] = red;
    data[index + 1] = green;
    data[index + 2] = blue;
    data[index + 3] = 255;
  }

  return {
    colorSpace: "srgb",
    data,
    height: size,
    width: size
  } as ImageData;
}

describe("detectColorMarker", () => {
  const stateIds = ["state_a", "state_b", "state_c"];

  it("maps a red marker to the first state", () => {
    expect(detectColorMarker(createSolidImageData(230, 40, 35), stateIds)).toEqual({
      stateId: "state_a",
      confidence: 0.75
    });
  });

  it("maps a green marker to the second state", () => {
    expect(detectColorMarker(createSolidImageData(40, 220, 55), stateIds)).toEqual({
      stateId: "state_b",
      confidence: 0.65
    });
  });

  it("maps a blue marker to the third state when it exists", () => {
    expect(detectColorMarker(createSolidImageData(45, 70, 230), stateIds)).toEqual({
      stateId: "state_c",
      confidence: 0.63
    });
  });

  it("ignores blue markers when the project has only two states", () => {
    expect(detectColorMarker(createSolidImageData(45, 70, 230), ["state_a", "state_b"])).toBeUndefined();
  });

  it("does not emit a prediction for gray or weak color frames", () => {
    expect(detectColorMarker(createSolidImageData(130, 130, 125), stateIds)).toBeUndefined();
    expect(detectColorMarker(createSolidImageData(150, 120, 110), stateIds)).toBeUndefined();
  });
});

describe("createColorMarkerRecognizer", () => {
  it("starts the camera and emits detected marker predictions", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    const stream = {} as MediaStream;
    const cameraService = createFakeCameraService(stream);
    const frameExtractor = vi.fn(() => createSolidImageData(230, 40, 35));
    const recognizer = createColorMarkerRecognizer({
      cameraService,
      frameExtractor,
      stateIds: ["state_a", "state_b"],
      video
    });
    const onResult = vi.fn();

    await recognizer.start(onResult);

    expect(cameraService.start).toHaveBeenCalledWith(video);
    expect(onResult).toHaveBeenCalledWith({
      stateId: "state_a",
      confidence: 0.75
    });

    vi.useRealTimers();
  });

  it("stops the interval and camera stream", async () => {
    vi.useFakeTimers();
    const video = document.createElement("video");
    const stream = {} as MediaStream;
    const cameraService = createFakeCameraService(stream);
    const frameExtractor = vi.fn(() => createSolidImageData(40, 220, 55));
    const recognizer = createColorMarkerRecognizer({
      cameraService,
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
