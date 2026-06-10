import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset, StateBinding } from "../projects/projectTypes";
import { TestScreen } from "./TestScreen";

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
});
