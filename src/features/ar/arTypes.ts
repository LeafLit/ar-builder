import type { Transform } from "../projects/projectTypes";

export type ARMode = "webxr" | "camera-overlay" | "screen-only";

export type WebXRLike = {
  isSessionSupported(mode: "immersive-ar"): Promise<boolean>;
  requestSession?(mode: "immersive-ar"): Promise<unknown>;
};

export type DeviceCapabilities = {
  camera: boolean;
  webxrImmersiveAr: boolean;
  mode: ARMode;
};

export type ARAdapter = {
  mode: ARMode;
  isSupported(): Promise<boolean>;
  start(container: HTMLElement): Promise<void>;
  stop(): Promise<void>;
  placeObject(assetId: string): Promise<void>;
  updateObjectTransform(assetId: string, transform: Transform): Promise<void>;
};
