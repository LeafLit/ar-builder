import { useEffect, useMemo, useRef, useState } from "react";
import { createCameraService, type CameraService } from "./cameraService";
import {
  createSampleStore,
  type SampleStore,
  type TrainingSampleRecord
} from "./sampleStore";
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
  const cameraService = useMemo(
    () => props.cameraService ?? createCameraService(),
    [props.cameraService]
  );
  const sampleStore = useMemo(
    () => props.sampleStore ?? createSampleStore(),
    [props.sampleStore]
  );
  const projectId = props.projectId ?? "local_project";
  const states = props.states ?? DEFAULT_PROJECT_STATES;
  const [selectedStateId, setSelectedStateId] = useState(states[0]?.id ?? "state_a");
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>(() =>
    createDefaultSampleCounts(states)
  );
  const [samplesByState, setSamplesByState] = useState<
    Record<string, TrainingSampleRecord[]>
  >({});
  const [stateNameDrafts, setStateNameDrafts] = useState<Record<string, string>>(() =>
    createStateNameDrafts(states)
  );
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState("先开启摄像头，然后为每个状态采集样本。");

  const selectedState =
    states.find((state) => state.id === selectedStateId) ?? states[0];

  useEffect(() => {
    setStateNameDrafts(createStateNameDrafts(states));
  }, [states]);

  useEffect(() => {
    let cancelled = false;

    async function loadSamples() {
      const sampleEntries = await Promise.all(
        states.map(async (state) => {
          const samples = (await sampleStore.listByState(state.id)).filter(
            (sample) => sample.projectId === projectId
          );

          return [state.id, samples] as const;
        })
      );

      if (cancelled) {
        return;
      }

      const nextSamplesByState = Object.fromEntries(sampleEntries);
      const nextSampleCounts = Object.fromEntries(
        sampleEntries.map(([stateId, samples]) => [stateId, samples.length])
      );

      setSamplesByState(nextSamplesByState);
      setSampleCounts((current) => ({
        ...current,
        ...nextSampleCounts
      }));
      sampleEntries.forEach(([stateId, samples]) => {
        props.onSampleCaptured?.(stateId, samples.length);
      });
    }

    void loadSamples();

    return () => {
      cancelled = true;
    };
  }, [projectId, sampleStore, states]);

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
      const savedSample = await sampleStore.saveSample(projectId, selectedState.id, blob);
      const nextSamples = [
        ...(samplesByState[selectedState.id] ?? []),
        savedSample
      ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const nextCount = nextSamples.length;
      setSamplesByState((current) => ({
        ...current,
        [selectedState.id]: nextSamples
      }));
      updateSampleCount(selectedState.id, nextCount);
      props.onSampleCaptured?.(selectedState.id, nextCount);
      setStatus(`已为 ${selectedState.name} 采集 ${nextCount} 个样本。`);
    } catch {
      setStatus("采集样本失败，请重新尝试。");
    }
  }

  async function deleteSample(sample: TrainingSampleRecord) {
    if (!selectedState) {
      return;
    }

    try {
      await sampleStore.deleteSample(sample.id);
      const nextSamples = (samplesByState[sample.stateId] ?? []).filter(
        (item) => item.id !== sample.id
      );
      const nextCount = nextSamples.length;

      setSamplesByState((current) => ({
        ...current,
        [sample.stateId]: nextSamples
      }));
      updateSampleCount(sample.stateId, nextCount);
      props.onSampleCaptured?.(sample.stateId, nextCount);
      setStatus(`已删除 ${selectedState.name} 的 1 个坏样本。`);
    } catch {
      setStatus("删除样本失败，请重新尝试。");
    }
  }

  function updateSampleCount(stateId: string, count: number) {
    setSampleCounts((current) => ({
      ...current,
      [stateId]: count
    }));
  }

  function updateStateNameDraft(stateId: string, name: string) {
    setStateNameDrafts((current) => ({
      ...current,
      [stateId]: name
    }));
    props.onStateNameChange?.(stateId, name);
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
                  updateStateNameDraft(state.id, event.target.value)
                }
                type="text"
                value={stateNameDrafts[state.id] ?? state.name}
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

      <div className="panel stack">
        <h2>样本管理</h2>
        <p className="muted">
          当前查看：{selectedState?.name ?? "未选择状态"}。拍坏的样本可以删除，再重新采集。
        </p>
        {(samplesByState[selectedState?.id ?? ""] ?? []).length > 0 ? (
          <div className="sample-list">
            {(samplesByState[selectedState?.id ?? ""] ?? []).map((sample, index) => (
              <SamplePreview
                index={index}
                key={sample.id}
                onDelete={() => deleteSample(sample)}
                sample={sample}
                stateName={selectedState?.name ?? "状态"}
              />
            ))}
          </div>
        ) : (
          <p className="empty-note">这个状态还没有样本。开启摄像头后点击“采集样本”。</p>
        )}
      </div>

      <button className="primary-button" onClick={props.onNext} type="button">
        下一步：训练
      </button>
    </div>
  );
}

function createStateNameDrafts(states: CaptureState[]) {
  return Object.fromEntries(states.map((state) => [state.id, state.name]));
}

function SamplePreview({
  index,
  onDelete,
  sample,
  stateName
}: {
  index: number;
  onDelete: () => void;
  sample: TrainingSampleRecord;
  stateName: string;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const sampleNumber = index + 1;

  useEffect(() => {
    const url = URL.createObjectURL(sample.blob);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [sample.blob]);

  return (
    <div className="sample-card">
      {previewUrl && (
        <img alt={`${stateName} 样本 ${sampleNumber}`} src={previewUrl} />
      )}
      <div className="sample-card-body">
        <strong>{stateName} 样本 {sampleNumber}</strong>
        <span>{formatSampleTime(sample.createdAt)}</span>
        <button
          className="secondary-button"
          onClick={onDelete}
          type="button"
        >
          删除 {stateName} 样本 {sampleNumber}
        </button>
      </div>
    </div>
  );
}

function formatSampleTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  const datePart = date.toISOString().slice(0, 10);
  const timePart = date.toISOString().slice(11, 16);

  return `${datePart} ${timePart}`;
}
