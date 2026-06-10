import type { Transform } from "../projects/projectTypes";
import type { ARAdapter, WebXRLike } from "./arTypes";

type NavigatorWithXR = Navigator & {
  xr?: WebXRLike;
};

export function createWebXRAdapter(): ARAdapter {
  let session: unknown;

  return {
    mode: "webxr",

    async isSupported() {
      const xr = (navigator as NavigatorWithXR).xr;
      return xr ? xr.isSessionSupported("immersive-ar").catch(() => false) : false;
    },

    async start() {
      const xr = (navigator as NavigatorWithXR).xr;
      if (!xr?.requestSession) {
        throw new Error("当前浏览器不支持 WebXR。");
      }
      session = await xr.requestSession("immersive-ar");
    },

    async stop() {
      const end = (session as { end?: () => Promise<void> } | undefined)?.end;
      if (end) {
        await end.call(session);
      }
      session = undefined;
    },

    async placeObject() {
      throw new Error("WebXR 空间摆放将在后续阶段增强。");
    },

    async updateObjectTransform(_assetId: string, _transform: Transform) {
      throw new Error("WebXR 空间变换将在后续阶段增强。");
    }
  };
}
