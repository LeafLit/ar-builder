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
    fireEvent.change(screen.getByLabelText("状态 A 的横向位置"), {
      target: { value: "-50" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的纵向位置"), {
      target: { value: "25" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的大小"), {
      target: { value: "125" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith({
      state_a: {
        content: "靠近左边时显示这句话",
        transform: {
          position: [-0.5, 0.25, 0],
          rotation: [0, 0, 0],
          scale: [1.25, 1.25, 1]
        }
      },
      state_b: {
        content: "靠近右边时显示这句话",
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      }
    });
    expect(screen.getByText("已保存 2 个输出。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("uploads an image output for a state and saves it with the screen anchor", async () => {
    const onSaveTextOutputs = vi.fn();
    const imageFile = new File(["image"], "tree.png", { type: "image/png" });

    render(
      <AuthoringScreen
        assets={[]}
        bindings={[]}
        imageReader={async () => "data:image/png;base64,tree"}
        onNext={vi.fn()}
        onSaveTextOutputs={onSaveTextOutputs}
      />
    );

    fireEvent.change(screen.getByLabelText("状态 A 的输出类型"), {
      target: { value: "image2d" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的 AR 图片"), {
      target: { files: [imageFile] }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "状态 B 仍然显示文字" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的横向位置"), {
      target: { value: "40" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的纵向位置"), {
      target: { value: "-40" }
    });

    await screen.findByAltText("状态 A 的图片预览");
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith(
      expect.objectContaining({
        state_a: {
          assetType: "image2d",
          name: "tree.png",
          url: "data:image/png;base64,tree",
          transform: {
            position: [0.4, -0.4, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        }
      })
    );
  });

  it("saves a built-in 3D model output for a state", () => {
    const onSaveTextOutputs = vi.fn();

    render(
      <AuthoringScreen
        assets={[]}
        bindings={[]}
        onNext={vi.fn()}
        onSaveTextOutputs={onSaveTextOutputs}
      />
    );

    fireEvent.change(screen.getByLabelText("状态 A 的输出类型"), {
      target: { value: "model3d" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的 3D 模型"), {
      target: { value: "tree" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的横向位置"), {
      target: { value: "30" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的大小"), {
      target: { value: "135" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "状态 B 仍然显示文字" }
    });

    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith(
      expect.objectContaining({
        state_a: {
          assetType: "model3d",
          modelId: "tree",
          name: "小树",
          transform: {
            position: [0.3, 0, 0],
            rotation: [0, 0, 0],
            scale: [1.35, 1.35, 1]
          }
        }
      })
    );
  });

  it("saves the 3D model rotation angle in radians", () => {
    const onSaveTextOutputs = vi.fn();

    render(
      <AuthoringScreen
        assets={[]}
        bindings={[]}
        onNext={vi.fn()}
        onSaveTextOutputs={onSaveTextOutputs}
      />
    );

    fireEvent.change(screen.getByLabelText("状态 A 的输出类型"), {
      target: { value: "model3d" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的旋转角度"), {
      target: { value: "90" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "状态 B 仍然显示文字" }
    });

    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith(
      expect.objectContaining({
        state_a: expect.objectContaining({
          assetType: "model3d",
          transform: expect.objectContaining({
            rotation: [0, Math.PI / 2, 0]
          })
        })
      })
    );
  });

  it("saves a built-in audio output for a state", () => {
    const onSaveTextOutputs = vi.fn();

    render(
      <AuthoringScreen
        assets={[]}
        bindings={[]}
        onNext={vi.fn()}
        onSaveTextOutputs={onSaveTextOutputs}
      />
    );

    fireEvent.change(screen.getByLabelText("状态 A 的输出类型"), {
      target: { value: "audio" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的音效"), {
      target: { value: "success" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "状态 B 仍然显示文字" }
    });

    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith(
      expect.objectContaining({
        state_a: {
          assetType: "audio",
          audioId: "success",
          name: "成功音",
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        }
      })
    );
  });

  it("saves a visual output with an attached built-in audio cue", () => {
    const onSaveTextOutputs = vi.fn();

    render(
      <AuthoringScreen
        assets={[]}
        bindings={[]}
        onNext={vi.fn()}
        onSaveTextOutputs={onSaveTextOutputs}
      />
    );

    fireEvent.change(screen.getByLabelText("状态 A 的 AR 文字"), {
      target: { value: "显示文字" }
    });
    fireEvent.change(screen.getByLabelText("状态 A 的附加音效"), {
      target: { value: "success" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "状态 B 仍然显示文字" }
    });

    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    expect(onSaveTextOutputs).toHaveBeenCalledWith(
      expect.objectContaining({
        state_a: {
          content: "显示文字",
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          audio: {
            audioId: "success",
            name: "成功音"
          }
        }
      })
    );
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
    expect(screen.getByLabelText("状态 A 的大小")).toHaveValue("100");
    expect(screen.getByRole("button", { name: "下一步：测试" })).toBeEnabled();
  });

  it("loads an existing image output for editing", () => {
    const assets: Asset[] = [
      {
        id: "asset_image_state_a",
        type: "image2d",
        name: "已有图片",
        url: "data:image/png;base64,old"
      }
    ];
    const bindings: StateBinding[] = [
      {
        id: "binding_state_a",
        stateId: "state_a",
        action: {
          type: "show",
          assetId: "asset_image_state_a",
          visible: true,
          transform: {
            position: [0.2, 0.1, 0],
            rotation: [0, 0, 0],
            scale: [1.5, 1.5, 1]
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

    expect(screen.getByLabelText("状态 A 的输出类型")).toHaveValue("image2d");
    expect(screen.getByAltText("状态 A 的图片预览")).toHaveAttribute(
      "src",
      "data:image/png;base64,old"
    );
    expect(screen.getByLabelText("状态 A 的大小")).toHaveValue("150");
  });

  it("loads an existing 3D model rotation for editing", () => {
    const assets: Asset[] = [
      {
        id: "asset_model3d_state_a",
        type: "model3d",
        name: "小树",
        modelId: "tree"
      }
    ];
    const bindings: StateBinding[] = [
      {
        id: "binding_state_a",
        stateId: "state_a",
        action: {
          type: "show",
          assetId: "asset_model3d_state_a",
          visible: true,
          transform: {
            position: [0, 0, 0],
            rotation: [0, Math.PI, 0],
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

    expect(screen.getByLabelText("状态 A 的输出类型")).toHaveValue("model3d");
    expect(screen.getByLabelText("状态 A 的 3D 模型")).toHaveValue("tree");
    expect(screen.getByLabelText("状态 A 的旋转角度")).toHaveValue("180");
  });

  it("loads an existing built-in audio output for editing", () => {
    const assets: Asset[] = [
      {
        id: "asset_audio_state_a",
        type: "audio",
        name: "警告音",
        audioId: "alert"
      }
    ];
    const bindings: StateBinding[] = [
      {
        id: "binding_state_a",
        stateId: "state_a",
        action: {
          type: "playAudio",
          assetId: "asset_audio_state_a"
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

    expect(screen.getByLabelText("状态 A 的输出类型")).toHaveValue("audio");
    expect(screen.getByLabelText("状态 A 的音效")).toHaveValue("alert");
  });

  it("loads an existing visual output with an attached built-in audio cue", () => {
    const assets: Asset[] = [
      {
        id: "asset_text_state_a",
        type: "text",
        name: "状态 A 文字",
        content: "已有文字"
      },
      {
        id: "asset_audio_state_a",
        type: "audio",
        name: "警告音",
        audioId: "alert"
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
        id: "binding_audio_state_a",
        stateId: "state_a",
        action: {
          type: "playAudio",
          assetId: "asset_audio_state_a"
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

    expect(screen.getByLabelText("状态 A 的输出类型")).toHaveValue("text");
    expect(screen.getByLabelText("状态 A 的 AR 文字")).toHaveValue("已有文字");
    expect(screen.getByLabelText("状态 A 的附加音效")).toHaveValue("alert");
  });
});
