import { useEffect, useMemo, useRef, useState } from "react";
import { createWebXRSpatialAdapter } from "./webxrSpatialAdapter";

export type SpatialARExperimentAdapter = {
  isSupported(): Promise<boolean>;
  start(container: HTMLElement): Promise<void>;
  stop(): Promise<void>;
  placeDemoObject(): Promise<void>;
};

type SpatialARPhase = "checking" | "unsupported" | "ready" | "starting" | "running" | "failed";

export function SpatialARExperiment({
  adapter: providedAdapter
}: {
  adapter?: SpatialARExperimentAdapter;
}) {
  const defaultAdapter = useMemo(() => createWebXRSpatialAdapter(), []);
  const adapter = providedAdapter ?? defaultAdapter;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<SpatialARPhase>("checking");
  const [message, setMessage] = useState("正在检查 WebXR 空间 AR 能力...");
  const [started, setStarted] = useState(false);
  const [placed, setPlaced] = useState(false);
  const supportsPlacement = phase === "running";

  const statusText = useMemo(() => {
    if (phase === "unsupported") {
      return "当前设备暂不支持 WebXR 空间 AR。";
    }

    return message;
  }, [message, phase]);

  useEffect(() => {
    let active = true;

    adapter
      .isSupported()
      .then((supported) => {
        if (!active) {
          return;
        }

        if (supported) {
          setPhase("ready");
          setMessage("当前设备支持 WebXR 空间 AR。");
        } else {
          setPhase("unsupported");
          setMessage("当前设备暂不支持 WebXR 空间 AR。");
        }
      })
      .catch(() => {
        if (active) {
          setPhase("unsupported");
          setMessage("当前设备暂不支持 WebXR 空间 AR。");
        }
      });

    return () => {
      active = false;
    };
  }, [adapter]);

  useEffect(() => {
    return () => {
      if (started) {
        void adapter.stop();
      }
    };
  }, [adapter, started]);

  async function startSpatialAR() {
    if (!containerRef.current) {
      return;
    }

    setPhase("starting");
    setMessage("正在启动空间 AR...");

    try {
      await adapter.start(containerRef.current);
      setStarted(true);
      setPhase("running");
      setMessage("空间 AR 已启动，可以放置演示物体。");
    } catch {
      setStarted(false);
      setPhase("failed");
      setMessage("空间 AR 启动失败，请检查浏览器和系统 AR 权限。");
    }
  }

  async function placeDemoObject() {
    try {
      await adapter.placeDemoObject();
      setPlaced(true);
      setMessage("已放置演示物体。");
    } catch {
      setMessage("放置演示物体失败，请退出后重试。");
    }
  }

  return (
    <section aria-labelledby="spatial-ar-title" className="panel stack spatial-ar-panel">
      <div className="stack compact-stack">
        <h2 id="spatial-ar-title">空间 AR 实验</h2>
        <p className="muted">
          支持 WebXR 的 Android 浏览器可以尝试把一个 3D 演示物体放进真实空间。
        </p>
      </div>
      <div
        aria-label="WebXR 空间 AR 画布"
        className="spatial-ar-stage"
        ref={containerRef}
        role="region"
      >
        <span>{phase === "running" ? "空间 AR 运行中" : "等待进入空间 AR"}</span>
      </div>
      <p className="muted spatial-ar-status">
        {statusText}
      </p>
      {phase === "unsupported" && (
        <p className="muted">可以继续使用上面的相机叠加测试。</p>
      )}
      {phase !== "unsupported" && phase !== "checking" && (
        <div className="action-row">
          <button
            className="primary-button"
            disabled={phase !== "ready" && phase !== "failed"}
            onClick={startSpatialAR}
            type="button"
          >
            进入空间 AR
          </button>
          <button
            className="secondary-button"
            disabled={!supportsPlacement}
            onClick={placeDemoObject}
            type="button"
          >
            {placed ? "再次放置演示物体" : "放置演示物体"}
          </button>
        </div>
      )}
    </section>
  );
}
