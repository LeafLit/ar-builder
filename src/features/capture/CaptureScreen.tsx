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
  const [largePreview, setLargePreview] = useState<{
    label: string;
    url: string;
  } | null>(null);
  const [deletedSampleGroups, setDeletedSampleGroups] = useState<TrainingSampleRecord[][]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [status, setStatus] = useState("先开启摄像头，然后为每个状态采集样本。");

  const selectedState =
    states.find((state) => state.id === selectedStateId) ?? states[0];
  const selectedSamples = samplesByState[selectedState?.id ?? ""] ?? [];

  useEffect(() => {
    setStateNameDrafts(createStateNameDrafts(states));
  }, [states]);

  useEffect(() => {
    setSelectionMode(false);
    setSelectedSampleIds([]);
  }, [selectedStateId]);

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
      setDeletedSampleGroups([]);
      setStatus(`已为 ${selectedState.name} 采集 ${nextCount} 个样本。`);
    } catch {
      setStatus("采集样本失败，请重新尝试。");
    }
  }

  async function deleteSample(sample: TrainingSampleRecord) {
    await deleteSamples([sample]);
  }

  async function deleteSelectedSamples() {
    const samplesToDelete = selectedSamples.filter((sample) =>
      selectedSampleIds.includes(sample.id)
    );

    await deleteSamples(samplesToDelete);
  }

  async function deleteSamples(samplesToDelete: TrainingSampleRecord[]) {
    if (!selectedState) {
      return;
    }

    try {
      if (samplesToDelete.length === 0) {
        return;
      }

      await Promise.all(samplesToDelete.map((sample) => sampleStore.deleteSample(sample.id)));
      const deletedIds = new Set(samplesToDelete.map((sample) => sample.id));
      const stateId = samplesToDelete[0].stateId;
      const nextSamples = (samplesByState[stateId] ?? []).filter(
        (item) => !deletedIds.has(item.id)
      );
      const nextCount = nextSamples.length;

      setSamplesByState((current) => ({
        ...current,
        [stateId]: nextSamples
      }));
      updateSampleCount(stateId, nextCount);
      props.onSampleCaptured?.(stateId, nextCount);
      setDeletedSampleGroups((current) => [...current, samplesToDelete]);
      setSelectedSampleIds([]);
      setSelectionMode(false);
      setStatus(`已删除 ${selectedState.name} 的 ${samplesToDelete.length} 个坏样本。`);
    } catch {
      setStatus("删除样本失败，请重新尝试。");
    }
  }

  async function undoDeleteSamples() {
    if (deletedSampleGroups.length === 0) {
      return;
    }

    const samplesToRestore = deletedSampleGroups[deletedSampleGroups.length - 1];

    try {
      await Promise.all(
        samplesToRestore.map((sample) => sampleStore.saveSampleRecord(sample))
      );
      const stateId = samplesToRestore[0].stateId;
      const nextSamples = [
        ...(samplesByState[stateId] ?? []),
        ...samplesToRestore
      ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      setSamplesByState((current) => ({
        ...current,
        [stateId]: nextSamples
      }));
      updateSampleCount(stateId, nextSamples.length);
      props.onSampleCaptured?.(stateId, nextSamples.length);
      setDeletedSampleGroups((current) => current.slice(0, -1));
      setStatus(`已撤销删除，恢复 ${samplesToRestore.length} 个样本。`);
    } catch {
      setStatus("撤销删除失败，请重新尝试。");
    }
  }

  function toggleSampleSelection(sampleId: string) {
    setSelectedSampleIds((current) =>
      current.includes(sampleId)
        ? current.filter((id) => id !== sampleId)
        : [...current, sampleId]
    );
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
      <div aria-label="采集主操作" className="panel capture-workspace" role="region">
        <h1>采集训练样本</h1>
        <p className="muted">对每个真实世界状态拍几张样本，例如物体在左边和右边。</p>
        <div className="camera-preview">
          <video ref={videoRef} aria-label="摄像头预览" muted playsInline />
          {!cameraReady && <span>摄像头预览</span>}
        </div>
        <p className="muted" role="status">
          {status}
        </p>
        <p className="capture-current-state">
          当前采集：{selectedState?.name ?? "未选择状态"}，已有 {sampleCounts[selectedState?.id ?? ""] ?? 0} 个样本
        </p>
        <div className="state-grid compact-state-grid">
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
        <div className="action-row capture-action-row">
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
      </div>

      <details className="quality-tip-panel compact-tip-panel">
        <summary>拍样本小贴士</summary>
        <ul>
          <li>每个状态尽量拍 5 张以上。</li>
          <li>光线尽量充足，避免画面太暗或反光。</li>
          <li>换一点角度、距离和背景，但不要把两个状态拍得太像。</li>
        </ul>
      </details>

      <div className="panel stack">
        <h2>状态名称</h2>
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
      </div>

      <div className="panel stack">
        <h2>样本管理</h2>
        <p className="muted">
          当前查看：{selectedState?.name ?? "未选择状态"}。拍坏的样本可以删除，再重新采集。
        </p>
        {deletedSampleGroups.length > 0 && (
          <button className="secondary-button" onClick={undoDeleteSamples} type="button">
            撤销删除
          </button>
        )}
        {selectedSamples.length > 0 ? (
          <>
            <div className="sample-bulk-actions">
              {selectionMode ? (
                <>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedSampleIds([]);
                    }}
                    type="button"
                  >
                    取消选择
                  </button>
                  <button
                    className="secondary-button"
                    disabled={selectedSampleIds.length === 0}
                    onClick={deleteSelectedSamples}
                    type="button"
                  >
                    删除选中的 {selectedSampleIds.length} 个样本
                  </button>
                </>
              ) : (
                <button
                  className="secondary-button"
                  onClick={() => setSelectionMode(true)}
                  type="button"
                >
                  批量选择
                </button>
              )}
            </div>
            <div
              aria-label={`${selectedState?.name ?? "状态"} 样本列表，${selectedSamples.length} 个样本`}
              className="sample-list sample-list-scroll"
              role="region"
            >
              {selectedSamples.map((sample, index) => (
                <SamplePreview
                  index={index}
                  isSelected={selectedSampleIds.includes(sample.id)}
                  isSelectionMode={selectionMode}
                  key={sample.id}
                  onDelete={() => deleteSample(sample)}
                  onOpenLargePreview={setLargePreview}
                  onToggleSelection={() => toggleSampleSelection(sample.id)}
                  sample={sample}
                  stateName={selectedState?.name ?? "状态"}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="empty-note">这个状态还没有样本。开启摄像头后点击“采集样本”。</p>
        )}
      </div>

      <button className="primary-button" onClick={props.onNext} type="button">
        下一步：训练
      </button>

      {largePreview && (
        <div
          aria-label={`${largePreview.label} 大图`}
          aria-modal="true"
          className="sample-preview-dialog"
          role="dialog"
        >
          <div className="sample-preview-dialog-content">
            <img
              alt={`${largePreview.label} 大图`}
              className="sample-preview-large-image"
              src={largePreview.url}
            />
            <button
              className="primary-button"
              onClick={() => setLargePreview(null)}
              type="button"
            >
              关闭大图
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function createStateNameDrafts(states: CaptureState[]) {
  return Object.fromEntries(states.map((state) => [state.id, state.name]));
}

function SamplePreview({
  index,
  isSelected,
  isSelectionMode,
  onDelete,
  onOpenLargePreview,
  onToggleSelection,
  sample,
  stateName
}: {
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  onDelete: () => void;
  onOpenLargePreview: (preview: { label: string; url: string }) => void;
  onToggleSelection: () => void;
  sample: TrainingSampleRecord;
  stateName: string;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const sampleNumber = index + 1;
  const sampleLabel = `${stateName} 样本 ${sampleNumber}`;

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
        <button
          aria-label={`放大查看 ${sampleLabel}`}
          className="sample-thumbnail-button"
          onClick={() => onOpenLargePreview({ label: sampleLabel, url: previewUrl })}
          type="button"
        >
          <img alt={sampleLabel} src={previewUrl} />
        </button>
      )}
      <div className="sample-card-body">
        <strong>{sampleLabel}</strong>
        <span>{formatSampleTime(sample.createdAt)}</span>
        {isSelectionMode ? (
          <label className="sample-select-control">
            <input
              aria-label={`选择 ${sampleLabel}`}
              checked={isSelected}
              onChange={onToggleSelection}
              type="checkbox"
            />
            <span>选择</span>
          </label>
        ) : (
          <button
            className="secondary-button"
            onClick={onDelete}
            type="button"
          >
            删除 {stateName} 样本 {sampleNumber}
          </button>
        )}
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
