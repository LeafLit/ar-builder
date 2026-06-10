import { appReducer, initialAppState } from "./appState";

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

  it("records captured sample counts by state", () => {
    const state = appReducer(initialAppState, {
      type: "recordSample",
      stateId: "state_a",
      count: 2
    });

    expect(state.sampleCounts.state_a).toBe(2);
    expect(state.sampleCounts.state_b).toBe(0);
  });

  it("stores text outputs as assets and state bindings", () => {
    const state = appReducer(initialAppState, {
      type: "saveTextOutputs",
      outputs: {
        state_a: "左边出现提示",
        state_b: "右边出现提示"
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
          visible: true
        })
      }),
      expect.objectContaining({
        id: "binding_state_b",
        stateId: "state_b",
        action: expect.objectContaining({
          type: "show",
          assetId: "asset_text_state_b",
          visible: true
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
