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
});
