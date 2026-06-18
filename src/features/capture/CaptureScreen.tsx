import { useRef, useState } from "react";
import { createCameraService, type CameraService } from "./cameraService";
import { createSampleStore, type SampleStore } from "./sampleStore";
import {
  createDefaultSampleCounts,
  DEFAULT_PROJECT_STATES
} from "../projects/projectStates";

type CaptureState = {
  id: string;
  name: string;
  order?: number;
};

export function CaptureScreen(props: {
  projectId?: string;
  cameraService?: CameraService;
  sampleStore?: SampleStore;
  states?: CaptureState[];
  onStateNameChange?: (stateId: string, name: string) => void;
  onSampleCaptured?: (stateId: string, count: number) => void;
  onNext: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraService = props.cameraService ?? createCameraService();
  const sampleStore = props.sampleStore ?? createSampleStore();
  const projectId = props.projectId ?? "local_project";
  const states = props.states ?? DEFAULT_PROJECT_STATES;
  const [selectedStateId, setSelectedStateId] = useState(states[0]?.id ?? "state_a");
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>(() =>
    createDefaultSampleCounts(states)
  );
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState("先开启摄像头，然后为每个状态采集样本。");

  const selectedState =
    states.find((state) => state.id === selectedStateId) ?? states[0];

  async function startCamera() {
    if (!videoRef.current) {
      return;
    }

    try {
      streamRef.current = await cameraService.start(videoRef.current);
      setCameraReady(true);
      setStatus("摄像头已开启，可以采集样本。");
    } catch {
      setStatus("摄像头开启失败，请检查浏览器权限。");
    }
  }

  async function captureSample() {
    if (!videoRef.current || !selectedState) {
      return;
    }

    try {
      const blob = await cameraService.captureFrame(videoRef.current);
      await sampleStore.saveSample(projectId, selectedState.id, blob);
      const nextCount = (sampleCounts[selectedState.id] ?? 0) + 1;
      setSampleCounts((current) => ({
        ...current,
        [selectedState.id]: nextCount
      }));
      props.onSampleCaptured?.(selectedState.id, nextCount);
      setStatus(`已为 ${selectedState.name} 采集 ${nextCount} 个样本。`);
    } catch {
      setStatus("采集样本失败，请重新尝试。");
    }
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h1>采集训练样本</h1>
        <p className="muted">对每个真实世界状态拍几张样本，例如物体在左边和右边。</p>
        <div className="camera-preview">
          <video ref={videoRef} aria-label="摄像头预览" muted playsInline />
          {!cameraReady && <span>摄像头预览</span>}
        </div>
        <p className="muted" role="status">
          {status}
        </p>
      </div>

      <div className="panel stack">
        <h2>选择状态</h2>
        <div className="state-name-list">
          {states.map((state) => (
            <label className="stack compact-stack" key={state.id}>
              <span>{state.name} 名称</span>
              <input
                aria-label={`${state.name} 名称`}
                onChange={(event) =>
                  props.onStateNameChange?.(state.id, event.target.value)
                }
                type="text"
                value={state.name}
              />
            </label>
          ))}
        </div>
        <div className="state-grid">
          {states.map((state) => (
            <button
              className={state.id === selectedStateId ? "state-button active" : "state-button"}
              key={state.id}
              onClick={() => setSelectedStateId(state.id)}
              type="button"
            >
              {state.name} {sampleCounts[state.id] ?? 0} 个样本
            </button>
          ))}
        </div>
      </div>

      <div className="action-row">
        <button className="secondary-button" onClick={startCamera} type="button">
          开启摄像头
        </button>
        <button
          className="primary-button"
          disabled={!cameraReady}
          onClick={captureSample}
          type="button"
        >
          采集样本
        </button>
      </div>

      <button className="primary-button" onClick={props.onNext} type="button">
        下一步：训练
      </button>
    </div>
  );
}
