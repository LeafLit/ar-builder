import type { SerializedRecognitionModel } from "../ml/classifierTypes";

export type AssetType = "model3d" | "image2d" | "text" | "audio";
export type BuiltInModel3DId = "cube" | "sphere" | "cone" | "tree";
export type BuiltInAudioId = "beep" | "success" | "alert";

export const DEFAULT_RECOGNITION_SENSITIVITY = 85;
export const MIN_RECOGNITION_SENSITIVITY = 50;
export const MAX_RECOGNITION_SENSITIVITY = 100;

export type ProjectSettings = {
  recognitionSensitivity: number;
};

export function normalizeProjectSettings(settings?: Partial<ProjectSettings>): ProjectSettings {
  const recognitionSensitivity = settings?.recognitionSensitivity;

  return {
    recognitionSensitivity:
      typeof recognitionSensitivity === "number" &&
      Number.isFinite(recognitionSensitivity) &&
      recognitionSensitivity >= MIN_RECOGNITION_SENSITIVITY &&
      recognitionSensitivity <= MAX_RECOGNITION_SENSITIVITY
        ? recognitionSensitivity
        : DEFAULT_RECOGNITION_SENSITIVITY
  };
}

export type Transform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export type TextOutputDraft = {
  assetType?: "text";
  content: string;
  transform: Transform;
};

export type ImageOutputDraft = {
  assetType: "image2d";
  name: string;
  url: string;
  transform: Transform;
};

export type Model3DOutputDraft = {
  assetType: "model3d";
  modelId: BuiltInModel3DId;
  name: string;
  transform: Transform;
};

export type AudioOutputDraft = {
  assetType: "audio";
  audioId: BuiltInAudioId;
  name: string;
  transform: Transform;
};

export type StateOutputDraft =
  | TextOutputDraft
  | ImageOutputDraft
  | Model3DOutputDraft
  | AudioOutputDraft;

export type InputState = {
  id: string;
  name: string;
  sampleIds: string[];
  order: number;
};

export type Asset = {
  id: string;
  type: AssetType;
  name: string;
  content?: string;
  localBlobKey?: string;
  url?: string;
  modelId?: BuiltInModel3DId;
  audioId?: BuiltInAudioId;
};

export type OutputAction =
  | {
      type: "show";
      assetId: string;
      transform: Transform;
      visible: boolean;
    }
  | {
      type: "transform";
      assetId: string;
      transform: Transform;
    }
  | {
      type: "playAudio";
      assetId: string;
    };

export type StateBinding = {
  id: string;
  stateId: string;
  action: OutputAction;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  states: InputState[];
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: SerializedRecognitionModel;
  settings?: ProjectSettings;
};

export type ProjectSummary = {
  id: string;
  name: string;
  updatedAt: string;
  assets: number;
  bindings: number;
};
