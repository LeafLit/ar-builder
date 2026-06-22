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
    getSampleBlob: vi.fn(async () => undefined),
    deleteSample: vi.fn(async () => undefined)
  };
}

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
