import type { DeviceCapabilities, WebXRLike } from "./arTypes";

type MediaDevicesLike = {
  getUserMedia?: MediaDevices["getUserMedia"];
};

type CapabilityInput = {
  mediaDevices?: MediaDevicesLike;
  xr?: WebXRLike;
};

type NavigatorWithXR = Navigator & {
  xr?: WebXRLike;
};

export async function detectDeviceCapabilities(
  input: CapabilityInput = {
    mediaDevices: navigator.mediaDevices,
    xr: (navigator as NavigatorWithXR).xr
  }
): Promise<DeviceCapabilities> {
  const camera = Boolean(input.mediaDevices?.getUserMedia);
  const webxrImmersiveAr = input.xr
    ? await input.xr.isSessionSupported("immersive-ar").catch(() => false)
    : false;

  if (camera && webxrImmersiveAr) {
    return { camera, webxrImmersiveAr, mode: "webxr" };
  }

  if (camera) {
    return { camera, webxrImmersiveAr, mode: "camera-overlay" };
  }

  return { camera, webxrImmersiveAr, mode: "screen-only" };
}
