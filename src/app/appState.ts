export type AppScreen = "home" | "capture" | "train" | "author" | "test";

export type AppState = {
  screen: AppScreen;
  projectId?: string;
  sampleCounts: Record<string, number>;
};

export type AppAction =
  | { type: "goTo"; screen: AppScreen }
  | { type: "selectProject"; projectId: string }
  | { type: "recordSample"; stateId: string; count: number };

export const initialAppState: AppState = {
  screen: "home",
  sampleCounts: {
    state_a: 0,
    state_b: 0
  }
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "goTo":
      return { ...state, screen: action.screen };
    case "selectProject":
      return { ...state, projectId: action.projectId };
    case "recordSample":
      return {
        ...state,
        sampleCounts: {
          ...state.sampleCounts,
          [action.stateId]: action.count
        }
      };
    default:
      return state;
  }
}
