export type AssetType = "model3d" | "image2d" | "text" | "audio";

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

export type StateOutputDraft = TextOutputDraft | ImageOutputDraft;

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
};
