import type {
  Asset,
  Project,
  ProjectSettings,
  StateBinding,
  StateOutputDraft,
  Transform
} from "../features/projects/projectTypes";
import type { RecognitionModel } from "../features/ml/classifierTypes";
import { restoreRecognitionModel } from "../features/ml/recognitionModelSnapshot";
import { normalizeProjectSettings } from "../features/projects/projectTypes";

export type AppScreen = "home" | "capture" | "train" | "author" | "test";

export type AppState = {
  screen: AppScreen;
  projectId?: string;
  sampleCounts: Record<string, number>;
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: RecognitionModel;
  settings: ProjectSettings;
};

export type AppAction =
  | { type: "goTo"; screen: AppScreen }
  | { type: "selectProject"; projectId: string }
  | { type: "recordSample"; stateId: string; count: number }
  | { type: "saveTextOutputs"; outputs: Record<string, string | StateOutputDraft> }
  | { type: "storeRecognitionModel"; model: RecognitionModel }
  | { type: "updateRecognitionSensitivity"; recognitionSensitivity: number }
  | { type: "loadProject"; project: Project };

const DEFAULT_TEXT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

export const initialAppState: AppState = {
  screen: "home",
  sampleCounts: {
    state_a: 0,
    state_b: 0
  },
  assets: [],
  bindings: [],
  settings: normalizeProjectSettings()
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "goTo":
      return { ...state, screen: action.screen };
    case "selectProject":
      return { ...state, projectId: action.projectId };
    case "loadProject":
      return {
        ...state,
        screen: "author",
        projectId: action.project.id,
        sampleCounts: {
          ...initialAppState.sampleCounts,
          ...Object.fromEntries(
            action.project.states.map((projectState) => [
              projectState.id,
              projectState.sampleIds.length
            ])
          )
        },
        assets: action.project.assets,
        bindings: action.project.bindings,
        recognitionModel: restoreRecognitionModel(action.project.recognitionModel),
        settings: normalizeProjectSettings(action.project.settings)
      };
    case "recordSample":
      return {
        ...state,
        sampleCounts: {
          ...state.sampleCounts,
          [action.stateId]: action.count
        }
      };
    case "storeRecognitionModel":
      return {
        ...state,
        recognitionModel: action.model
      };
    case "updateRecognitionSensitivity":
      return {
        ...state,
        settings: normalizeProjectSettings({
          ...state.settings,
          recognitionSensitivity: action.recognitionSensitivity
        })
      };
    case "saveTextOutputs": {
      const stateIds = Object.keys(action.outputs);
      const normalizedOutputs = Object.fromEntries(
        stateIds.map((stateId) => [stateId, normalizeStateOutput(action.outputs[stateId])])
      );
      const replaceAssetIds = new Set(
        stateIds.flatMap((stateId) => [
          `asset_text_${stateId}`,
          `asset_image_${stateId}`,
          `asset_model3d_${stateId}`
        ])
      );
      const outputAssets: Asset[] = stateIds.map((stateId) =>
        createOutputAsset(stateId, normalizedOutputs[stateId])
      );
      const outputBindings: StateBinding[] = stateIds.map((stateId) => ({
        id: `binding_${stateId}`,
        stateId,
        action: {
          type: "show",
          assetId: createOutputAssetId(stateId, normalizedOutputs[stateId]),
          transform: normalizedOutputs[stateId].transform,
          visible: true
        }
      }));
      const preservedAssets = state.assets.filter((asset) => !replaceAssetIds.has(asset.id));
      const preservedBindings = state.bindings.filter((binding) => !stateIds.includes(binding.stateId));

      return {
        ...state,
        assets: [...preservedAssets, ...outputAssets],
        bindings: [...preservedBindings, ...outputBindings]
      };
    }
    default:
      return state;
  }
}

function normalizeStateOutput(output: string | StateOutputDraft): StateOutputDraft {
  if (typeof output === "string") {
    return {
      assetType: "text",
      content: output,
      transform: cloneTransform(DEFAULT_TEXT_TRANSFORM)
    };
  }

  if (output.assetType === "image2d") {
    return {
      assetType: "image2d",
      name: output.name,
      url: output.url,
      transform: cloneTransform(output.transform)
    };
  }

  if (output.assetType === "model3d") {
    return {
      assetType: "model3d",
      modelId: output.modelId,
      name: output.name,
      transform: cloneTransform(output.transform)
    };
  }

  return {
    assetType: "text",
    content: output.content,
    transform: cloneTransform(output.transform)
  };
}

function createOutputAssetId(stateId: string, output: StateOutputDraft) {
  if (output.assetType === "image2d") {
    return `asset_image_${stateId}`;
  }

  if (output.assetType === "model3d") {
    return `asset_model3d_${stateId}`;
  }

  return `asset_text_${stateId}`;
}

function createOutputAsset(stateId: string, output: StateOutputDraft): Asset {
  if (output.assetType === "image2d") {
    return {
      id: createOutputAssetId(stateId, output),
      type: "image2d",
      name: output.name.trim() || `${stateId} 图片`,
      url: output.url
    };
  }

  if (output.assetType === "model3d") {
    return {
      id: createOutputAssetId(stateId, output),
      type: "model3d",
      name: output.name.trim() || `${stateId} 3D 模型`,
      modelId: output.modelId
    };
  }

  return {
    id: createOutputAssetId(stateId, output),
    type: "text",
    name: `${stateId} 文字`,
    content: output.content.trim()
  };
}

function cloneTransform(transform: Transform): Transform {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}
