import { useState } from "react";
import { BUILT_IN_MODEL_3D_OPTIONS, getBuiltInModel3DOption } from "../ar/model3dCatalog";
import type { Asset, StateBinding, StateOutputDraft, Transform } from "../projects/projectTypes";

type AuthoringState = {
  id: string;
  name: string;
};

const AUTHORING_STATES: AuthoringState[] = [
  { id: "state_a", name: "状态 A" },
  { id: "state_b", name: "状态 B" }
];

const DEFAULT_TEXT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

export function AuthoringScreen(props: {
  assets: Asset[];
  bindings: StateBinding[];
  imageReader?: (file: File) => Promise<string>;
  onSaveTextOutputs: (outputs: Record<string, StateOutputDraft>) => void;
  onNext: () => void;
}) {
  const [outputs, setOutputs] = useState<Record<string, StateOutputDraft>>(() =>
    Object.fromEntries(
      AUTHORING_STATES.map((state) => [
        state.id,
        getStateOutputDraft(state.id, props.assets, props.bindings)
      ])
    )
  );
  const [saved, setSaved] = useState(props.bindings.length > 0);
  const filledOutputCount = AUTHORING_STATES.filter((state) => isOutputReady(outputs[state.id]))
    .length;
  const canSave = filledOutputCount === AUTHORING_STATES.length;

  function saveBindings() {
    const trimmedOutputs = Object.fromEntries(
      AUTHORING_STATES.map((state) => [
        state.id,
        normalizeOutputForSave(outputs[state.id])
      ])
    );
    props.onSaveTextOutputs(trimmedOutputs);
    setSaved(true);
  }

  function updateTextOutput(stateId: string, content: string) {
    setOutputs((current) => ({
      ...current,
      [stateId]: {
        ...current[stateId],
        assetType: "text",
        content
      }
    }));
  }

  function updateOutputType(stateId: string, assetType: "text" | "image2d" | "model3d") {
    setOutputs((current) => {
      const currentOutput = current[stateId];
      const transform = cloneTransform(currentOutput.transform);

      if (assetType === "model3d") {
        const option = getBuiltInModel3DOption("cube");

        return {
          ...current,
          [stateId]: {
            assetType: "model3d",
            modelId: option.id,
            name: option.label,
            transform
          }
        };
      }

      return {
        ...current,
        [stateId]:
          assetType === "image2d"
            ? {
                assetType: "image2d",
                name: "",
                url: "",
                transform
              }
            : {
                assetType: "text",
                content: "",
                transform
              }
      };
    });
  }

  function updateModel3DOutput(stateId: string, modelId: string) {
    const option = getBuiltInModel3DOption(modelId);

    setOutputs((current) => {
      const currentOutput = current[stateId];

      return {
        ...current,
        [stateId]: {
          assetType: "model3d",
          modelId: option.id,
          name: option.label,
          transform: cloneTransform(currentOutput.transform)
        }
      };
    });
  }

  async function updateImageOutput(stateId: string, file: File) {
    const readImage = props.imageReader ?? readImageFile;
    const url = await readImage(file);

    setOutputs((current) => {
      const currentOutput = current[stateId];

      return {
        ...current,
        [stateId]: {
          assetType: "image2d",
          name: file.name,
          url,
          transform: cloneTransform(currentOutput.transform)
        }
      };
    });
  }

  function updateAnchor(stateId: string, field: "x" | "y" | "scale" | "rotationY", value: string) {
    const numericValue = Number(value);

    setOutputs((current) => {
      const currentOutput = current[stateId];
      const transform = currentOutput.transform;

      if (field === "x") {
        return {
          ...current,
          [stateId]: {
            ...currentOutput,
            transform: {
              ...transform,
              position: [numericValue / 100, transform.position[1], transform.position[2]]
            }
          }
        };
      }

      if (field === "y") {
        return {
          ...current,
          [stateId]: {
            ...currentOutput,
            transform: {
              ...transform,
              position: [transform.position[0], numericValue / 100, transform.position[2]]
            }
          }
        };
      }

      if (field === "rotationY") {
        return {
          ...current,
          [stateId]: {
            ...currentOutput,
            transform: {
              ...transform,
              rotation: [
                transform.rotation[0],
                degreesToRadians(numericValue),
                transform.rotation[2]
              ]
            }
          }
        };
      }

      const scale = numericValue / 100;
      return {
        ...current,
        [stateId]: {
          ...currentOutput,
          transform: {
            ...transform,
            scale: [scale, scale, transform.scale[2]]
          }
        }
      };
    });
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h1>编辑 AR 输出</h1>
        <p className="muted">
          为每个识别状态绑定一段文字。第一版先跑通文字输出，后续会扩展图片、3D 模型和音频。
        </p>
      </div>

      <div className="binding-list">
        {AUTHORING_STATES.map((state) => {
          const output = outputs[state.id];
          const anchorValues = createAnchorControlValues(output.transform);

          return (
            <div className="binding-card stack" key={state.id}>
              <label className="stack compact-stack">
                <span>{state.name} 的输出类型</span>
                <select
                  aria-label={`${state.name} 的输出类型`}
                  onChange={(event) =>
                    updateOutputType(
                      state.id,
                      event.target.value as "text" | "image2d" | "model3d"
                    )
                  }
                  value={output.assetType ?? "text"}
                >
                  <option value="text">文字</option>
                  <option value="image2d">图片</option>
                  <option value="model3d">3D 模型</option>
                </select>
              </label>

              {output.assetType === "image2d" ? (
                <div className="stack compact-stack">
                  <label className="stack compact-stack">
                    <span>{state.name} 的 AR 图片</span>
                    <input
                      accept="image/*"
                      aria-label={`${state.name} 的 AR 图片`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          void updateImageOutput(state.id, file);
                        }
                      }}
                      type="file"
                    />
                  </label>
                  {output.url && (
                    <img
                      alt={`${state.name} 的图片预览`}
                      className="asset-preview"
                      src={output.url}
                    />
                  )}
                </div>
              ) : output.assetType === "model3d" ? (
                <label className="stack compact-stack">
                  <span>{state.name} 的 3D 模型</span>
                  <select
                    aria-label={`${state.name} 的 3D 模型`}
                    onChange={(event) => updateModel3DOutput(state.id, event.target.value)}
                    value={output.modelId}
                  >
                    {BUILT_IN_MODEL_3D_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="stack compact-stack">
                  <span>{state.name} 的 AR 文字</span>
                  <textarea
                    aria-label={`${state.name} 的 AR 文字`}
                    onChange={(event) => updateTextOutput(state.id, event.target.value)}
                    placeholder={`识别到${state.name}时显示的内容`}
                    rows={4}
                    value={output.content}
                  />
                </label>
              )}

              <div className="anchor-controls" aria-label={`${state.name} 的屏幕锚点`}>
                <label className="range-field">
                  <span>横向位置：{anchorValues.x}%</span>
                  <input
                    aria-label={`${state.name} 的横向位置`}
                    max="100"
                    min="-100"
                    onChange={(event) => updateAnchor(state.id, "x", event.target.value)}
                    step="5"
                    type="range"
                    value={anchorValues.x}
                  />
                </label>
                <label className="range-field">
                  <span>纵向位置：{anchorValues.y}%</span>
                  <input
                    aria-label={`${state.name} 的纵向位置`}
                    max="100"
                    min="-100"
                    onChange={(event) => updateAnchor(state.id, "y", event.target.value)}
                    step="5"
                    type="range"
                    value={anchorValues.y}
                  />
                </label>
                <label className="range-field">
                  <span>大小：{anchorValues.scale}%</span>
                  <input
                    aria-label={`${state.name} 的大小`}
                    max="200"
                    min="50"
                    onChange={(event) => updateAnchor(state.id, "scale", event.target.value)}
                    step="5"
                    type="range"
                    value={anchorValues.scale}
                  />
                </label>
              </div>

              {output.assetType === "model3d" && (
                <label className="range-field">
                  <span>旋转角度：{anchorValues.rotationY}°</span>
                  <input
                    aria-label={`${state.name} 的旋转角度`}
                    max="360"
                    min="0"
                    onChange={(event) => updateAnchor(state.id, "rotationY", event.target.value)}
                    step="15"
                    type="range"
                    value={anchorValues.rotationY}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="action-row">
        <button className="secondary-button" disabled={!canSave} onClick={saveBindings} type="button">
          保存绑定
        </button>
        <button className="primary-button" disabled={!saved} onClick={props.onNext} type="button">
          下一步：测试
        </button>
      </div>

      <p className="muted" role="status">
        {saved ? `已保存 ${filledOutputCount} 个输出。` : "填写两个状态的输出后保存绑定。"}
      </p>
    </div>
  );
}

function getStateOutputDraft(
  stateId: string,
  assets: Asset[],
  bindings: StateBinding[]
): StateOutputDraft {
  const binding = bindings.find((item) => item.stateId === stateId);

  if (!binding || binding.action.type !== "show") {
    return {
      assetType: "text",
      content: "",
      transform: cloneTransform(DEFAULT_TEXT_TRANSFORM)
    };
  }

  const asset = assets.find((item) => item.id === binding.action.assetId);

  if (asset?.type === "image2d") {
    return {
      assetType: "image2d",
      name: asset.name,
      url: asset.url ?? "",
      transform: cloneTransform(binding.action.transform)
    };
  }

  if (asset?.type === "model3d") {
    const option = getBuiltInModel3DOption(asset.modelId);

    return {
      assetType: "model3d",
      modelId: option.id,
      name: asset.name || option.label,
      transform: cloneTransform(binding.action.transform)
    };
  }

  return {
    assetType: "text",
    content: asset?.content ?? "",
    transform: cloneTransform(binding.action.transform)
  };
}

function isOutputReady(output: StateOutputDraft) {
  if (output.assetType === "image2d") {
    return Boolean(output.url);
  }

  if (output.assetType === "model3d") {
    return Boolean(output.modelId);
  }

  return Boolean(output.content.trim());
}

function normalizeOutputForSave(output: StateOutputDraft): StateOutputDraft {
  if (output.assetType === "image2d") {
    return {
      ...output,
      name: output.name.trim() || "AR 图片"
    };
  }

  if (output.assetType === "model3d") {
    const option = getBuiltInModel3DOption(output.modelId);

    return {
      ...output,
      modelId: option.id,
      name: output.name.trim() || option.label,
      transform: cloneTransform(output.transform)
    };
  }

  return {
    content: output.content.trim(),
    transform: cloneTransform(output.transform)
  };
}

function createAnchorControlValues(transform: Transform) {
  return {
    x: Math.round(transform.position[0] * 100).toString(),
    y: Math.round(transform.position[1] * 100).toString(),
    scale: Math.round(transform.scale[0] * 100).toString(),
    rotationY: Math.round(radiansToDegrees(transform.rotation[1])).toString()
  };
}

function cloneTransform(transform: Transform): Transform {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("图片读取失败")));
    reader.readAsDataURL(file);
  });
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}
