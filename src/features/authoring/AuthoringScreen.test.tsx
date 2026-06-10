import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset, StateBinding } from "../projects/projectTypes";
import { AuthoringScreen } from "./AuthoringScreen";

describe("AuthoringScreen", () => {
  it("saves text outputs for both states and unlocks testing", () => {
    const onSaveTextOutputs = vi.fn();
    const onNext = vi.fn();

    render(
      <AuthoringScreen
        assets={[]}
        bindings={[]}
        onNext={onNext}
        onSaveTextOutputs={onSaveTextOutputs}
      />
    );

    expect(screen.getByRole("button", { name: "下一步：测试" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("状态 A 的 AR 文字"), {
      target: { value: "靠近左边时显示这句话" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "靠近右边时显示这句话" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith({
      state_a: "靠近左边时显示这句话",
      state_b: "靠近右边时显示这句话"
    });
    expect(screen.getByText("已保存 2 个文字输出。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("loads existing text outputs for editing", () => {
    const assets: Asset[] = [
      {
        id: "asset_text_state_a",
        type: "text",
        name: "状态 A 文字",
        content: "已经保存的 A"
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
      }
    ];

    render(
      <AuthoringScreen
        assets={assets}
        bindings={bindings}
        onNext={vi.fn()}
        onSaveTextOutputs={vi.fn()}
      />
    );

    expect(screen.getByLabelText("状态 A 的 AR 文字")).toHaveValue("已经保存的 A");
    expect(screen.getByRole("button", { name: "下一步：测试" })).toBeEnabled();
  });
});
