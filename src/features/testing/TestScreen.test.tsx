import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RecognitionModel } from "../ml/classifierTypes";
import type { Asset, StateBinding } from "../projects/projectTypes";
import { TestScreen } from "./TestScreen";
import type { RecognitionListener, StateRecognizer } from "./stateRecognizer";

const assets: Asset[] = [
  {
    id: "asset_text_state_a",
    type: "text",
    name: "状态 A 文字",
    content: "状态 A 的 AR 输出"
  },
  {
    id: "asset_text_state_b",
    type: "text",
    name: "状态 B 文字",
    content: "状态 B 的 AR 输出"
  }
];

const bindings: StateBinding[] = [
  {
    id: "binding_state_a",
    stateId: "state_a",
    action: {
      type: "show",
      assetId: "asset_text_state_a",
      visible: true,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    }
  },
  {
    id: "binding_state_b",
    stateId: "state_b",
    action: {
      type: "show",
      assetId: "asset_text_state_b",
      visible: true,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    }
  }
];

describe("TestScreen", () => {
  it("does not render a virtual object before any state is detected", () => {
    const { container } = render(
      <TestScreen assets={assets} bindings={bindings} onBackHome={vi.fn()} />
    );

    expect(screen.getByRole("status")).toHaveTextContent("等待识别状态。");
    expect(container.querySelector(".ar-test-overlay")).toBeNull();
  });

  it("shows the text output for a simulated detected state", () => {
    render(<TestScreen assets={assets} bindings={bindings} onBackHome={vi.fn()} />);

    expect(screen.getByText("等待识别状态。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 A" }));

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("当前识别：状态 A");
  });

  it("places the AR output at the saved screen anchor", () => {
    const anchoredBindings: StateBinding[] = [
      {
        id: "binding_state_b",
        stateId: "state_b",
        action: {
          type: "show",
          assetId: "asset_text_state_b",
          visible: true,
          transform: {
            position: [0.5, -0.5, 0],
            rotation: [0, 0, 0],
            scale: [1.35, 1.35, 1]
          }
        }
      }
    ];

    render(<TestScreen assets={assets} bindings={anchoredBindings} onBackHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 B" }));

    const overlay = screen.getByText("状态 B 的 AR 输出").closest(".ar-test-overlay");
    expect(overlay).toHaveStyle({
      "--anchor-x": "75%",
      "--anchor-y": "25%",
      "--anchor-scale": "1.35"
    });
  });

  it("renders an image asset as a virtual object at the saved screen anchor", () => {
    const imageAssets: Asset[] = [
      {
        id: "asset_image_state_a",
        type: "image2d",
        name: "小树贴纸",
        url: "data:image/png;base64,tree"
      }
    ];
    const imageBindings: StateBinding[] = [
      {
        id: "binding_state_a",
        stateId: "state_a",
        action: {
          type: "show",
          assetId: "asset_image_state_a",
          visible: true,
          transform: {
            position: [0.4, -0.4, 0],
            rotation: [0, 0, 0],
            scale: [1.4, 1.4, 1]
          }
        }
      }
    ];

    render(<TestScreen assets={imageAssets} bindings={imageBindings} onBackHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 A" }));

    const image = screen.getByAltText("小树贴纸");
    expect(image).toHaveAttribute("src", "data:image/png;base64,tree");
    expect(image.closest(".ar-test-overlay")).toHaveStyle({
      "--anchor-x": "70%",
      "--anchor-y": "30%",
      "--anchor-scale": "1.4"
    });
  });

  it("renders a built-in 3D model asset as a virtual object", () => {
    const modelAssets: Asset[] = [
      {
        id: "asset_model3d_state_a",
        type: "model3d",
        name: "小树",
        modelId: "tree"
      }
    ];
    const modelBindings: StateBinding[] = [
      {
        id: "binding_state_a",
        stateId: "state_a",
        action: {
          type: "show",
          assetId: "asset_model3d_state_a",
          visible: true,
          transform: {
            position: [0.25, -0.2, 0],
            rotation: [0, 0, 0],
            scale: [1.2, 1.2, 1]
          }
        }
      }
    ];

    render(<TestScreen assets={modelAssets} bindings={modelBindings} onBackHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 A" }));

    expect(screen.getByLabelText("小树 3D 模型")).toBeInTheDocument();
    expect(screen.getByLabelText("小树 3D 模型").closest(".ar-test-overlay")).toHaveStyle({
      "--anchor-x": "62.5%",
      "--anchor-y": "40%",
      "--anchor-scale": "1.2"
    });
  });

  it("shows an empty-state message when a state has no binding", () => {
    render(<TestScreen assets={[]} bindings={[]} onBackHome={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 B" }));

    expect(screen.getByText("未找到状态 B 的输出绑定。")).toBeInTheDocument();
  });

  it("updates the AR output from an automatic recognizer result", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const stop = vi.fn();
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop };
      })
    };

    render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_b", confidence: 0.82 });
      emitResult({ stateId: "state_b", confidence: 0.82 });
    });

    expect(screen.getByText("状态 B 的 AR 输出")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("当前识别：状态 B（82%）");

    fireEvent.click(screen.getByRole("button", { name: "停止自动识别" }));
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("waits for two matching automatic recognition frames before showing AR output", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop: vi.fn() };
      })
    };
    const { container } = render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.9 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.88 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();
  });

  it("clears automatic AR output after two missed recognition frames", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop: vi.fn() };
      })
    };
    const { container } = render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.9 });
      emitResult({ stateId: "state_a", confidence: 0.9 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.05 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.04 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();
  });

  it("does not fall back to simulated automatic recognition without a trained model", async () => {
    const { container } = render(
      <TestScreen assets={assets} bindings={bindings} onBackHome={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "自动识别启动失败，请检查相机权限或模型是否已加载。"
      );
    });
    expect(container.querySelector(".ar-test-overlay")).toBeNull();
    expect(screen.queryByText("状态 A 的 AR 输出")).not.toBeInTheDocument();
  });

  it("shows the AR output for moderately confident automatic recognition results", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop: vi.fn() };
      })
    };
    const { container } = render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.05 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();
    expect(screen.queryByText("状态 A 的 AR 输出")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("自动识别中，未识别到已训练状态。");

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.2 });
      emitResult({ stateId: "state_a", confidence: 0.2 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("当前识别：状态 A（20%）");
  });

  it("lets users tune recognition sensitivity while automatic recognition is running", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop: vi.fn() };
      })
    };
    const { container } = render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.1 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();

    fireEvent.change(screen.getByLabelText("识别灵敏度"), {
      target: { value: "100" }
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.1 });
      emitResult({ stateId: "state_a", confidence: 0.1 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();
    expect(screen.getByText("识别灵敏度：100%")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("识别灵敏度"), {
      target: { value: "50" }
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.1 });
      emitResult({ stateId: "state_a", confidence: 0.1 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();
    expect(screen.getByText("识别灵敏度：50%")).toBeInTheDocument();
  });

  it("shows the recognition sensitivity passed by the app", () => {
    render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognitionSensitivity={95}
        onRecognitionSensitivityChange={vi.fn()}
      />
    );

    expect(screen.getByText("识别灵敏度：95%")).toBeInTheDocument();
  });

  it("notifies the app when recognition sensitivity changes", () => {
    const onRecognitionSensitivityChange = vi.fn();

    render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognitionSensitivity={85}
        onRecognitionSensitivityChange={onRecognitionSensitivityChange}
      />
    );

    fireEvent.change(screen.getByRole("slider", { name: "识别灵敏度" }), {
      target: { value: "100" }
    });

    expect(onRecognitionSensitivityChange).toHaveBeenCalledWith(100);
  });

  it("creates a camera recognizer when a trained model is available", async () => {
    const stop = vi.fn();
    const recognizer: StateRecognizer = {
      start: vi.fn(async () => ({ stop }))
    };
    const model: RecognitionModel = {
      classifier: {
        predict: vi.fn()
      },
      embedder: {
        embed: vi.fn()
      }
    };
    const createRecognizer = vi.fn(() => recognizer);

    render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        createCameraRecognizer={createRecognizer}
        onBackHome={vi.fn()}
        recognitionModel={model}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(createRecognizer).toHaveBeenCalledWith(expect.any(HTMLVideoElement), model);
    });
    expect(recognizer.start).toHaveBeenCalledTimes(1);
  });

  it("shows startup and failure states when automatic recognition cannot start", async () => {
    let rejectStart: (error: Error) => void = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(
        () =>
          new Promise<never>((_, reject) => {
            rejectStart = reject;
          })
      )
    };

    render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "正在启动相机识别，请确认浏览器权限。"
    );
    expect(screen.getByRole("button", { name: "启动自动识别" })).toBeDisabled();

    act(() => {
      rejectStart(new Error("permission denied"));
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "自动识别启动失败，请检查相机权限或模型是否已加载。"
      );
    });
    expect(screen.getByRole("button", { name: "启动自动识别" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "停止自动识别" })).toBeDisabled();
  });
});
