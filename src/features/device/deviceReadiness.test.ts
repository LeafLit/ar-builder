import { createDeviceReadinessReport } from "./deviceReadiness";

describe("createDeviceReadinessReport", () => {
  it("summarizes a WebXR-capable phone as spatial AR ready", () => {
    const report = createDeviceReadinessReport({
      cameraApi: true,
      manifest: true,
      secureContext: true,
      serviceWorker: true,
      webxrImmersiveAr: true
    });

    expect(report.summary).toBe("真机能力：空间 AR 可用");
    expect(report.items).toContainEqual({
      label: "AR 模式",
      level: "ready",
      text: "空间 AR（WebXR）"
    });
  });

  it("explains camera-overlay fallback when WebXR is not available", () => {
    const report = createDeviceReadinessReport({
      cameraApi: true,
      manifest: true,
      secureContext: true,
      serviceWorker: true,
      webxrImmersiveAr: false
    });

    expect(report.summary).toBe("真机能力：相机叠加模式");
    expect(report.items).toContainEqual({
      label: "AR 模式",
      level: "warning",
      text: "相机叠加降级"
    });
  });

  it("prioritizes setup blockers when the page is not secure and camera API is missing", () => {
    const report = createDeviceReadinessReport({
      cameraApi: false,
      manifest: false,
      secureContext: false,
      serviceWorker: false,
      webxrImmersiveAr: false
    });

    expect(report.summary).toBe("真机能力：需要先修复运行环境");
    expect(report.items).toContainEqual({
      label: "安全连接",
      level: "blocked",
      text: "需要 HTTPS 或 localhost"
    });
    expect(report.items).toContainEqual({
      label: "相机 API",
      level: "blocked",
      text: "当前浏览器未提供 getUserMedia"
    });
  });
});
