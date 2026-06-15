import { appReducer, initialAppState } from "./appState";
import type { Project } from "../features/projects/projectTypes";

describe("appReducer", () => {
  it("moves through the main authoring steps", () => {
    const capture = appReducer(initialAppState, { type: "goTo", screen: "capture" });
    const train = appReducer(capture, { type: "goTo", screen: "train" });
    const author = appReducer(train, { type: "goTo", screen: "author" });
    const test = appReducer(author, { type: "goTo", screen: "test" });

    expect(test.screen).toBe("test");
  });

  it("stores selected project id", () => {
    const state = appReducer(initialAppState, {
      type: "selectProject",
      projectId: "project_1"
    });

    expect(state.projectId).toBe("project_1");
  });

  it("starts with the default recognition sensitivity setting", () => {
    expect(initialAppState.settings).toEqual({
      recognitionSensitivity: 85
    });
  });

  it("loads a saved project for editing", () => {
    const project: Project = {
      id: "project_saved",
      name: "保存的项目",
      createdAt: "2026-06-12T12:00:00.000Z",
      updatedAt: "2026-06-12T12:30:00.000Z",
      states: [
        {
          id: "state_a",
          name: "状态 A",
          order: 0,
          sampleIds: ["sample_1"]
        }
      ],
      assets: [
        {
          id: "asset_text_state_a",
          type: "text",
          name: "状态 A 文字",
          content: "继续编辑"
        }
      ],
      bindings: []
    };

    const state = appReducer(initialAppState, { type: "loadProject", project });

    expect(state.screen).toBe("author");
    expect(state.projectId).toBe("project_saved");
    expect(state.sampleCounts).toEqual({
      state_a: 1,
      state_b: 0
    });
    expect(state.assets).toEqual(project.assets);
  });

  it("restores recognition sensitivity settings when loading a project", () => {
    const project: Project = {
      id: "project_1",
      name: "sensitivity project",
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
      states: [],
      assets: [],
      bindings: [],
      settings: {
        recognitionSensitivity: 100
      }
    };

    const state = appReducer(initialAppState, { type: "loadProject", project });

    expect(state.settings.recognitionSensitivity).toBe(100);
  });

  it("falls back to the default recognition sensitivity when loading an old project", () => {
    const project: Project = {
      id: "project_1",
      name: "old project",
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
      states: [],
      assets: [],
      bindings: []
    };

    const state = appReducer(initialAppState, { type: "loadProject", project });

    expect(state.settings.recognitionSensitivity).toBe(85);
  });

  it("restores a saved recognition model when loading a project", () => {
    const project: Project = {
      id: "project_saved",
      name: "带模型的项目",
      createdAt: "2026-06-12T12:00:00.000Z",
      updatedAt: "2026-06-12T12:30:00.000Z",
      states: [
        {
          id: "state_a",
          name: "状态 A",
          order: 0,
          sampleIds: ["sample_1"]
        },
        {
          id: "state_b",
          name: "状态 B",
          order: 1,
          sampleIds: ["sample_2"]
        }
      ],
      assets: [],
      bindings: [],
      recognitionModel: {
        version: 1,
        classifier: {
          kind: "embedding-centroid-v1",
          centroids: [
            { stateId: "state_a", vector: [0, 0] },
            { stateId: "state_b", vector: [1, 1] }
          ]
        }
      }
    };

    const state = appReducer(initialAppState, { type: "loadProject", project });

    expect(state.recognitionModel?.classifier.predict([1, 1])?.stateId).toBe("state_b");
    expect(state.recognitionModel?.embedder).toBeDefined();
  });

  it("records captured sample counts by state", () => {
    const state = appReducer(initialAppState, {
      type: "recordSample",
      stateId: "state_a",
      count: 2
    });

    expect(state.sampleCounts.state_a).toBe(2);
    expect(state.sampleCounts.state_b).toBe(0);
  });

  it("stores a trained recognition model", () => {
    const model = {
      classifier: {
        predict: vi.fn()
      },
      embedder: {
        embed: vi.fn()
      }
    };

    const state = appReducer(initialAppState, {
      type: "storeRecognitionModel",
      model
    });

    expect(state.recognitionModel).toBe(model);
  });

  it("updates recognition sensitivity settings", () => {
    const state = appReducer(initialAppState, {
      type: "updateRecognitionSensitivity",
      recognitionSensitivity: 95
    });

    expect(state.settings.recognitionSensitivity).toBe(95);
  });

  it("stores text outputs as assets and state bindings", () => {
    const state = appReducer(initialAppState, {
      type: "saveTextOutputs",
      outputs: {
        state_a: {
          content: "左边出现提示",
          transform: {
            position: [-0.5, 0.25, 0],
            rotation: [0, 0, 0],
            scale: [1.25, 1.25, 1]
          }
        },
        state_b: {
          content: "右边出现提示",
          transform: {
            position: [0.5, -0.25, 0],
            rotation: [0, 0, 0],
            scale: [0.8, 0.8, 1]
          }
        }
      }
    });

    expect(state.assets).toEqual([
      expect.objectContaining({
        id: "asset_text_state_a",
        type: "text",
        content: "左边出现提示"
      }),
      expect.objectContaining({
        id: "asset_text_state_b",
        type: "text",
        content: "右边出现提示"
      })
    ]);
    expect(state.bindings).toEqual([
      expect.objectContaining({
        id: "binding_state_a",
        stateId: "state_a",
        action: expect.objectContaining({
          type: "show",
          assetId: "asset_text_state_a",
          visible: true,
          transform: {
            position: [-0.5, 0.25, 0],
            rotation: [0, 0, 0],
            scale: [1.25, 1.25, 1]
          }
        })
      }),
      expect.objectContaining({
        id: "binding_state_b",
        stateId: "state_b",
        action: expect.objectContaining({
          type: "show",
          assetId: "asset_text_state_b",
          visible: true,
          transform: {
            position: [0.5, -0.25, 0],
            rotation: [0, 0, 0],
            scale: [0.8, 0.8, 1]
          }
        })
      })
    ]);
  });

  it("stores image outputs as image assets and state bindings", () => {
    const state = appReducer(initialAppState, {
      type: "saveTextOutputs",
      outputs: {
        state_a: {
          assetType: "image2d",
          name: "小树贴纸",
          url: "data:image/png;base64,tree",
          transform: {
            position: [0.4, -0.4, 0],
            rotation: [0, 0, 0],
            scale: [1.4, 1.4, 1]
          }
        }
      }
    });

    expect(state.assets).toEqual([
      expect.objectContaining({
        id: "asset_image_state_a",
        type: "image2d",
        name: "小树贴纸",
        url: "data:image/png;base64,tree"
      })
    ]);
    expect(state.bindings).toEqual([
      expect.objectContaining({
        stateId: "state_a",
        action: expect.objectContaining({
          type: "show",
          assetId: "asset_image_state_a",
          transform: {
            position: [0.4, -0.4, 0],
            rotation: [0, 0, 0],
            scale: [1.4, 1.4, 1]
          }
        })
      })
    ]);
  });

  it("stores built-in 3D model outputs as model assets and state bindings", () => {
    const state = appReducer(initialAppState, {
      type: "saveTextOutputs",
      outputs: {
        state_a: {
          assetType: "model3d",
          modelId: "tree",
          name: "小树",
          transform: {
            position: [0.2, -0.1, 0],
            rotation: [0, 0, 0],
            scale: [1.3, 1.3, 1]
          }
        }
      }
    });

    expect(state.assets).toEqual([
      expect.objectContaining({
        id: "asset_model3d_state_a",
        type: "model3d",
        name: "小树",
        modelId: "tree"
      })
    ]);
    expect(state.bindings).toEqual([
      expect.objectContaining({
        id: "binding_state_a",
        stateId: "state_a",
        action: expect.objectContaining({
          type: "show",
          assetId: "asset_model3d_state_a",
          transform: {
            position: [0.2, -0.1, 0],
            rotation: [0, 0, 0],
            scale: [1.3, 1.3, 1]
          }
        })
      })
    ]);
  });

  it("preserves unrelated assets and bindings when saving text outputs", () => {
    const existingAsset = {
      id: "asset_image_1",
      type: "image2d" as const,
      name: "已有图片",
      url: "/image.png"
    };
    const existingBinding = {
      id: "binding_extra",
      stateId: "state_extra",
      action: {
        type: "show" as const,
        assetId: "asset_image_1",
        visible: true,
        transform: {
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number]
        }
      }
    };

    const state = appReducer(
      {
        ...initialAppState,
        assets: [existingAsset],
        bindings: [existingBinding]
      },
      {
        type: "saveTextOutputs",
        outputs: {
          state_a: "文字 A",
          state_b: "文字 B"
        }
      }
    );

    expect(state.assets).toEqual(expect.arrayContaining([existingAsset]));
    expect(state.bindings).toEqual(expect.arrayContaining([existingBinding]));
  });
});
