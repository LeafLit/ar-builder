import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("shows the text output for a simulated detected state", () => {
    render(<TestScreen assets={assets} bindings={bindings} onBackHome={vi.fn()} />);

    expect(screen.getByText("等待识别状态。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 A" }));

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("当前识别：状态 A");
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
    });

    expect(screen.getByText("状态 B 的 AR 输出")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("当前识别：状态 B（82%）");

    fireEvent.click(screen.getByRole("button", { name: "停止自动识别" }));
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
