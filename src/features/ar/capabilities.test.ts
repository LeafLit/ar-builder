import { detectDeviceCapabilities } from "./capabilities";

describe("detectDeviceCapabilities", () => {
  it("uses screen-only when camera is missing", async () => {
    const result = await detectDeviceCapabilities({
      mediaDevices: undefined,
      xr: undefined
    });

    expect(result).toEqual({
      camera: false,
      webxrImmersiveAr: false,
      mode: "screen-only"
    });
  });

  it("uses camera overlay when camera exists but WebXR AR is unavailable", async () => {
    const result = await detectDeviceCapabilities({
      mediaDevices: { getUserMedia: vi.fn() },
      xr: {
        isSessionSupported: async () => false
      }
    });

    expect(result.mode).toBe("camera-overlay");
  });

  it("uses WebXR when immersive AR is supported", async () => {
    const result = await detectDeviceCapabilities({
      mediaDevices: { getUserMedia: vi.fn() },
      xr: {
        isSessionSupported: async () => true
      }
    });

    expect(result.mode).toBe("webxr");
  });
});
