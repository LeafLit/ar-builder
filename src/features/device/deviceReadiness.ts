import type { WebXRLike } from "../ar/arTypes";
import { detectDeviceCapabilities } from "../ar/capabilities";

export type DeviceReadinessSnapshot = {
  cameraApi: boolean;
  manifest: boolean;
  secureContext: boolean;
  serviceWorker: boolean;
  webxrImmersiveAr: boolean;
};

export type ReadinessLevel = "ready" | "warning" | "blocked";

export type DeviceReadinessItem = {
  label: string;
  level: ReadinessLevel;
  text: string;
};

export type DeviceReadinessReport = {
  items: DeviceReadinessItem[];
  summary: string;
};

type MediaDevicesLike = {
  getUserMedia?: MediaDevices["getUserMedia"];
};

type DeviceReadinessProbeInput = {
  manifestElement?: Element | null;
  mediaDevices?: MediaDevicesLike;
  secureContext?: boolean;
  serviceWorker?: ServiceWorkerContainer;
  xr?: WebXRLike;
};

type NavigatorWithXR = Navigator & {
  xr?: WebXRLike;
};

export function createDeviceReadinessReport(
  snapshot: DeviceReadinessSnapshot
): DeviceReadinessReport {
  const setupBlocked = !snapshot.secureContext || !snapshot.cameraApi;
  const pwaReady = snapshot.serviceWorker && snapshot.manifest;
  const arModeItem = createArModeItem(snapshot);

  return {
    summary: createReadinessSummary(snapshot, setupBlocked),
    items: [
      {
        label: "安全连接",
        level: snapshot.secureContext ? "ready" : "blocked",
        text: snapshot.secureContext ? "已满足" : "需要 HTTPS 或 localhost"
      },
      {
        label: "相机 API",
        level: snapshot.cameraApi ? "ready" : "blocked",
        text: snapshot.cameraApi ? "浏览器支持" : "当前浏览器未提供 getUserMedia"
      },
      {
        label: "PWA 安装",
        level: pwaReady ? "ready" : "warning",
        text: pwaReady ? "基础文件已就绪" : "需要 manifest 和 service worker"
      },
      arModeItem
    ]
  };
}

export async function probeDeviceReadiness(
  input: DeviceReadinessProbeInput = getBrowserProbeInput()
): Promise<DeviceReadinessSnapshot> {
  const capabilities = await detectDeviceCapabilities({
    mediaDevices: input.mediaDevices,
    xr: input.xr
  });

  return {
    cameraApi: capabilities.camera,
    manifest: Boolean(input.manifestElement),
    secureContext: Boolean(input.secureContext),
    serviceWorker: Boolean(input.serviceWorker),
    webxrImmersiveAr: capabilities.webxrImmersiveAr
  };
}

function createReadinessSummary(
  snapshot: DeviceReadinessSnapshot,
  setupBlocked: boolean
) {
  if (setupBlocked) {
    return "真机能力：需要先修复运行环境";
  }

  if (snapshot.webxrImmersiveAr) {
    return "真机能力：空间 AR 可用";
  }

  return "真机能力：相机叠加模式";
}

function createArModeItem(snapshot: DeviceReadinessSnapshot): DeviceReadinessItem {
  if (snapshot.webxrImmersiveAr) {
    return {
      label: "AR 模式",
      level: "ready",
      text: "空间 AR（WebXR）"
    };
  }

  if (snapshot.cameraApi) {
    return {
      label: "AR 模式",
      level: "warning",
      text: "相机叠加降级"
    };
  }

  return {
    label: "AR 模式",
    level: "blocked",
    text: "纯屏幕预览"
  };
}

function getBrowserProbeInput(): DeviceReadinessProbeInput {
  return {
    manifestElement: document.querySelector('link[rel="manifest"]'),
    mediaDevices: navigator.mediaDevices,
    secureContext: window.isSecureContext,
    serviceWorker: navigator.serviceWorker,
    xr: (navigator as NavigatorWithXR).xr
  };
}
