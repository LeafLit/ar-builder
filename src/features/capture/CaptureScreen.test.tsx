import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { CameraService } from "./cameraService";
import { CaptureScreen } from "./CaptureScreen";
import type { SampleStore, TrainingSampleRecord } from "./sampleStore";

function createFakeCameraService(): CameraService {
  return {
    start: vi.fn(async () => ({ getTracks: () => [] }) as unknown as MediaStream),
    stop: vi.fn(),
    captureFrame: vi.fn(async () => new Blob(["sample"], { type: "image/jpeg" }))
  };
}

function createFakeSampleStore(): SampleStore {
  return {
    saveSample: vi.fn(async (projectId, stateId, blob) => ({
      id: "sample_1",
      projectId,
      stateId,
      createdAt: "2026-06-10T00:00:00.000Z",
      blob
    })),
    listByState: vi.fn(async () => [] as TrainingSampleRecord[]),
    listByProject: vi.fn(async () => [] as TrainingSampleRecord[]),
    getSampleBlob: vi.fn(async () => undefined),
    deleteSample: vi.fn(async () => undefined),
    saveSampleRecord: vi.fn(async (sample) => sample)
  };
}

beforeEach(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:sample-preview"),
    revokeObjectURL: vi.fn()
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CaptureScreen", () => {
  it("lets users rename input states from the capture step", () => {
    const onStateNameChange = vi.fn();

    render(
      <CaptureScreen
        states={[
          { id: "state_a", name: "状态 A", order: 0 },
          { id: "state_b", name: "状态 B", order: 1 }
        ]}
        onNext={vi.fn()}
        onStateNameChange={onStateNameChange}
      />
    );

    fireEvent.change(screen.getByLabelText("状态 A 名称"), {
      target: { value: "拳头" }
    });

    expect(onStateNameChange).toHaveBeenCalledWith("state_a", "拳头");
  });

  it("lets users add an extra state from state management", () => {
    const onAddState = vi.fn();

    render(
      <CaptureScreen
        states={[
          { id: "state_a", name: "Alpha", order: 0 },
          { id: "state_b", name: "Beta", order: 1 }
        ]}
        onAddState={onAddState}
        onNext={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "添加状态" }));

    expect(onAddState).toHaveBeenCalledTimes(1);
  });

  it("hides the add state action at the four-state limit", () => {
    render(
      <CaptureScreen
        states={[
          { id: "state_a", name: "Alpha", order: 0 },
          { id: "state_b", name: "Beta", order: 1 },
          { id: "state_3", name: "Third", order: 2 },
          { id: "state_4", name: "Fourth", order: 3 }
        ]}
        onAddState={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "添加状态" })).not.toBeInTheDocument();
    expect(screen.getByText("最多可以创建 4 个状态。")).toBeInTheDocument();
  });

  it("lets users delete extra states but keeps default states", async () => {
    const onDeleteState = vi.fn();

    render(
      <CaptureScreen
        states={[
          { id: "state_a", name: "Alpha", order: 0 },
          { id: "state_b", name: "Beta", order: 1 },
          { id: "state_3", name: "Third", order: 2 }
        ]}
        onDeleteState={onDeleteState}
        onNext={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "删除 Alpha" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "删除 Third" }));

    await waitFor(() => {
      expect(onDeleteState).toHaveBeenCalledWith("state_3");
    });
  });

  it("deletes saved samples before deleting an extra state", async () => {
    const sampleStore = createFakeSampleStore();
    const onDeleteState = vi.fn();
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_3"
        ? [
            {
              id: "sample_extra",
              projectId: "project_1",
              stateId: "state_3",
              createdAt: "2026-06-10T00:00:00.000Z",
              blob: new Blob(["sample"], { type: "image/jpeg" })
            }
          ]
        : []
    );

    render(
      <CaptureScreen
        sampleStore={sampleStore}
        projectId="project_1"
        states={[
          { id: "state_a", name: "Alpha", order: 0 },
          { id: "state_b", name: "Beta", order: 1 },
          { id: "state_3", name: "Third", order: 2 }
        ]}
        onDeleteState={onDeleteState}
        onNext={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "删除 Third" }));

    await waitFor(() => {
      expect(sampleStore.deleteSample).toHaveBeenCalledWith("sample_extra");
    });
    expect(onDeleteState).toHaveBeenCalledWith("state_3");
  });

  it("allows users to temporarily clear a state name while editing", () => {
    function ControlledCaptureScreen() {
      const [states, setStates] = useState([
        { id: "state_a", name: "状态 A", order: 0 },
        { id: "state_b", name: "状态 B", order: 1 }
      ]);

      return (
        <CaptureScreen
          states={states}
          onNext={vi.fn()}
          onStateNameChange={(stateId, name) => {
            const trimmedName = name.trim();

            if (!trimmedName) {
              return;
            }

            setStates((current) =>
              current.map((state) =>
                state.id === stateId ? { ...state, name: trimmedName } : state
              )
            );
          }}
        />
      );
    }

    render(<ControlledCaptureScreen />);

    fireEvent.change(screen.getByLabelText("状态 A 名称"), {
      target: { value: "状" }
    });
    const stateNameInput = screen.getByLabelText("状 名称");

    fireEvent.change(stateNameInput, {
      target: { value: "" }
    });

    expect(stateNameInput).toHaveValue("");
  });

  it("uses custom state names in state buttons and capture status", async () => {
    const cameraService = createFakeCameraService();
    const sampleStore = createFakeSampleStore();

    render(
      <CaptureScreen
        cameraService={cameraService}
        sampleStore={sampleStore}
        states={[
          { id: "state_a", name: "拳头", order: 0 },
          { id: "state_b", name: "巴掌", order: 1 }
        ]}
        onNext={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开启摄像头" }));

    await waitFor(() => {
      expect(screen.getByText("摄像头已开启，可以采集样本。")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "采集样本" }));

    await waitFor(() => {
      expect(screen.getByText("已为 拳头 采集 1 个样本。")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "拳头 1 个样本" })).toBeInTheDocument();
  });

  it("keeps camera controls directly in the capture workspace", () => {
    render(<CaptureScreen onNext={vi.fn()} />);

    const captureWorkspace = screen.getByRole("region", { name: "采集主操作" });

    expect(captureWorkspace).toContainElement(screen.getByLabelText("摄像头预览"));
    expect(captureWorkspace).toContainElement(
      screen.getByRole("button", { name: "开启摄像头" })
    );
    expect(captureWorkspace).toContainElement(
      screen.getByRole("button", { name: "采集样本" })
    );
    expect(captureWorkspace).toContainElement(
      screen.getByText("当前采集：状态 A，已有 0 个样本")
    );
  });

  it("shows beginner tips for collecting better training samples", () => {
    render(<CaptureScreen onNext={vi.fn()} />);

    expect(screen.getByText("拍样本小贴士")).toBeInTheDocument();
    expect(screen.getByText("每个状态尽量拍 5 张以上。")).toBeInTheDocument();
    expect(screen.getByText("换一点角度、距离和背景，但不要把两个状态拍得太像。")).toBeInTheDocument();
  });

  it("loads saved samples for the selected state so users can review them", async () => {
    const sampleStore = createFakeSampleStore();
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a"
        ? [
            {
              id: "sample_1",
              projectId: "project_1",
              stateId: "state_a",
              createdAt: "2026-06-10T00:00:00.000Z",
              blob: new Blob(["sample"], { type: "image/jpeg" })
            }
          ]
        : []
    );

    render(
      <CaptureScreen
        sampleStore={sampleStore}
        projectId="project_1"
        onNext={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 1 个样本" })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByAltText("状态 A 样本 1")).toBeInTheDocument();
    });
    expect(screen.getByText("2026-06-10 00:00")).toBeInTheDocument();
  });

  it("opens a large preview when users tap a sample thumbnail", async () => {
    const sampleStore = createFakeSampleStore();
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a"
        ? [
            {
              id: "sample_1",
              projectId: "project_1",
              stateId: "state_a",
              createdAt: "2026-06-10T00:00:00.000Z",
              blob: new Blob(["sample"], { type: "image/jpeg" })
            }
          ]
        : []
    );

    render(
      <CaptureScreen
        sampleStore={sampleStore}
        projectId="project_1"
        onNext={vi.fn()}
      />
    );

    const thumbnail = await screen.findByRole("button", {
      name: "放大查看 状态 A 样本 1"
    });

    fireEvent.click(thumbnail);

    expect(screen.getByRole("dialog", { name: "状态 A 样本 1 大图" })).toBeInTheDocument();
    expect(screen.getByAltText("状态 A 样本 1 大图")).toHaveClass(
      "sample-preview-large-image"
    );
    expect(
      screen.getByRole("dialog", { name: "状态 A 样本 1 大图" }).closest(".sample-card")
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "关闭大图" }));

    expect(screen.queryByRole("dialog", { name: "状态 A 样本 1 大图" })).not.toBeInTheDocument();
  });

  it("keeps many samples inside a bounded review list", async () => {
    const sampleStore = createFakeSampleStore();
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a"
        ? Array.from({ length: 24 }, (_, index) => ({
            id: `sample_${index + 1}`,
            projectId: "project_1",
            stateId: "state_a",
            createdAt: `2026-06-10T00:${String(index).padStart(2, "0")}:00.000Z`,
            blob: new Blob(["sample"], { type: "image/jpeg" })
          }))
        : []
    );

    render(
      <CaptureScreen
        sampleStore={sampleStore}
        projectId="project_1"
        onNext={vi.fn()}
      />
    );

    const sampleList = await screen.findByRole("region", {
      name: "状态 A 样本列表，24 个样本"
    });

    expect(sampleList).toHaveClass("sample-list");
    expect(sampleList).toHaveClass("sample-list-scroll");
    expect(screen.getByRole("button", { name: "状态 A 24 个样本" })).toBeInTheDocument();
  });

  it("deletes a bad sample and updates the selected state count", async () => {
    const sampleStore = createFakeSampleStore();
    const onSampleCaptured = vi.fn();
    let stateASamples: TrainingSampleRecord[] = [
      {
        id: "sample_1",
        projectId: "project_1",
        stateId: "state_a",
        createdAt: "2026-06-10T00:00:00.000Z",
        blob: new Blob(["sample"], { type: "image/jpeg" })
      }
    ];
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a" ? stateASamples : []
    );
    vi.mocked(sampleStore.deleteSample).mockImplementation(async (sampleId) => {
      stateASamples = stateASamples.filter((sample) => sample.id !== sampleId);
    });

    render(
      <CaptureScreen
        sampleStore={sampleStore}
        projectId="project_1"
        onNext={vi.fn()}
        onSampleCaptured={onSampleCaptured}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 1 个样本" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "删除 状态 A 样本 1" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 0 个样本" })).toBeInTheDocument();
    });
    expect(sampleStore.deleteSample).toHaveBeenCalledWith("sample_1");
    expect(onSampleCaptured).toHaveBeenCalledWith("state_a", 0);
    expect(screen.getByText("已删除 状态 A 的 1 个坏样本。")).toBeInTheDocument();
  });

  it("restores a deleted sample when the user taps undo", async () => {
    const sampleStore = createFakeSampleStore();
    const onSampleCaptured = vi.fn();
    let stateASamples: TrainingSampleRecord[] = [
      {
        id: "sample_1",
        projectId: "project_1",
        stateId: "state_a",
        createdAt: "2026-06-10T00:00:00.000Z",
        blob: new Blob(["sample"], { type: "image/jpeg" })
      }
    ];
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a" ? stateASamples : []
    );
    vi.mocked(sampleStore.deleteSample).mockImplementation(async (sampleId) => {
      stateASamples = stateASamples.filter((sample) => sample.id !== sampleId);
    });
    vi.mocked(sampleStore.saveSampleRecord).mockImplementation(async (sample) => {
      stateASamples = [...stateASamples, sample];
      return sample;
    });

    render(
      <CaptureScreen
        sampleStore={sampleStore}
        projectId="project_1"
        onNext={vi.fn()}
        onSampleCaptured={onSampleCaptured}
      />
    );

    await screen.findByRole("button", { name: "状态 A 1 个样本" });
    fireEvent.click(screen.getByRole("button", { name: "删除 状态 A 样本 1" }));
    fireEvent.click(await screen.findByRole("button", { name: "撤销删除" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 1 个样本" })).toBeInTheDocument();
    });
    expect(sampleStore.saveSampleRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sample_1", projectId: "project_1" })
    );
    expect(onSampleCaptured).toHaveBeenLastCalledWith("state_a", 1);
  });

  it("can undo multiple consecutive single-sample deletes", async () => {
    const sampleStore = createFakeSampleStore();
    let stateASamples: TrainingSampleRecord[] = Array.from({ length: 3 }, (_, index) => ({
      id: `sample_${index + 1}`,
      projectId: "project_1",
      stateId: "state_a",
      createdAt: `2026-06-10T00:0${index}:00.000Z`,
      blob: new Blob([`sample-${index + 1}`], { type: "image/jpeg" })
    }));
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a" ? stateASamples : []
    );
    vi.mocked(sampleStore.deleteSample).mockImplementation(async (sampleId) => {
      stateASamples = stateASamples.filter((sample) => sample.id !== sampleId);
    });
    vi.mocked(sampleStore.saveSampleRecord).mockImplementation(async (sample) => {
      stateASamples = [...stateASamples, sample].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
      return sample;
    });

    render(
      <CaptureScreen sampleStore={sampleStore} projectId="project_1" onNext={vi.fn()} />
    );

    await screen.findByRole("button", { name: "状态 A 3 个样本" });
    fireEvent.click(screen.getByRole("button", { name: "删除 状态 A 样本 1" }));
    await screen.findByRole("button", { name: "状态 A 2 个样本" });
    fireEvent.click(screen.getByRole("button", { name: "删除 状态 A 样本 1" }));
    await screen.findByRole("button", { name: "状态 A 1 个样本" });

    fireEvent.click(screen.getByRole("button", { name: "撤销删除" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 2 个样本" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "撤销删除" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 3 个样本" })).toBeInTheDocument();
    });
    expect(sampleStore.saveSampleRecord).toHaveBeenCalledTimes(2);
  });

  it("deletes selected samples in a batch and can undo the batch", async () => {
    const sampleStore = createFakeSampleStore();
    let stateASamples: TrainingSampleRecord[] = Array.from({ length: 3 }, (_, index) => ({
      id: `sample_${index + 1}`,
      projectId: "project_1",
      stateId: "state_a",
      createdAt: `2026-06-10T00:0${index}:00.000Z`,
      blob: new Blob([`sample-${index + 1}`], { type: "image/jpeg" })
    }));
    vi.mocked(sampleStore.listByState).mockImplementation(async (stateId) =>
      stateId === "state_a" ? stateASamples : []
    );
    vi.mocked(sampleStore.deleteSample).mockImplementation(async (sampleId) => {
      stateASamples = stateASamples.filter((sample) => sample.id !== sampleId);
    });
    vi.mocked(sampleStore.saveSampleRecord).mockImplementation(async (sample) => {
      stateASamples = [...stateASamples, sample].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
      return sample;
    });

    render(
      <CaptureScreen sampleStore={sampleStore} projectId="project_1" onNext={vi.fn()} />
    );

    await screen.findByRole("button", { name: "状态 A 3 个样本" });
    fireEvent.click(screen.getByRole("button", { name: "批量选择" }));
    fireEvent.click(screen.getByLabelText("选择 状态 A 样本 1"));
    fireEvent.click(screen.getByLabelText("选择 状态 A 样本 2"));
    fireEvent.click(screen.getByRole("button", { name: "删除选中的 2 个样本" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 1 个样本" })).toBeInTheDocument();
    });
    expect(sampleStore.deleteSample).toHaveBeenCalledWith("sample_1");
    expect(sampleStore.deleteSample).toHaveBeenCalledWith("sample_2");

    fireEvent.click(screen.getByRole("button", { name: "撤销删除" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "状态 A 3 个样本" })).toBeInTheDocument();
    });
  });

  it("starts the camera and captures a sample for the selected state", async () => {
    const cameraService = createFakeCameraService();
    const sampleStore = createFakeSampleStore();
    const onSampleCaptured = vi.fn();

    render(
      <CaptureScreen
        cameraService={cameraService}
        sampleStore={sampleStore}
        projectId="project_1"
        onSampleCaptured={onSampleCaptured}
        onNext={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开启摄像头" }));

    await waitFor(() => {
      expect(screen.getByText("摄像头已开启，可以采集样本。")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "采集样本" }));

    await waitFor(() => {
      expect(screen.getByText("已为 状态 A 采集 1 个样本。")).toBeInTheDocument();
    });
    expect(sampleStore.saveSample).toHaveBeenCalledWith(
      "project_1",
      "state_a",
      expect.any(Blob)
    );
    expect(onSampleCaptured).toHaveBeenCalledWith("state_a", 1);
  });

  it("lets the user choose another state before capture", async () => {
    const cameraService = createFakeCameraService();
    const sampleStore = createFakeSampleStore();
    const onSampleCaptured = vi.fn();

    render(
      <CaptureScreen
        cameraService={cameraService}
        sampleStore={sampleStore}
        projectId="project_1"
        onSampleCaptured={onSampleCaptured}
        onNext={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "状态 B 0 个样本" }));
    fireEvent.click(screen.getByRole("button", { name: "开启摄像头" }));
    await waitFor(() => screen.getByText("摄像头已开启，可以采集样本。"));
    fireEvent.click(screen.getByRole("button", { name: "采集样本" }));

    await waitFor(() => {
      expect(screen.getByText("已为 状态 B 采集 1 个样本。")).toBeInTheDocument();
    });
    expect(sampleStore.saveSample).toHaveBeenCalledWith(
      "project_1",
      "state_b",
      expect.any(Blob)
    );
    expect(onSampleCaptured).toHaveBeenCalledWith("state_b", 1);
  });
});
