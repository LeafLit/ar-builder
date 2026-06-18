import type { InputState } from "./projectTypes";

export type EditableProjectState = Pick<InputState, "id" | "name" | "order">;

export const DEFAULT_PROJECT_STATES: EditableProjectState[] = [
  { id: "state_a", name: "状态 A", order: 0 },
  { id: "state_b", name: "状态 B", order: 1 }
];

export function normalizeEditableProjectStates(
  states: Partial<InputState>[] | undefined = []
): EditableProjectState[] {
  return DEFAULT_PROJECT_STATES.map((defaultState) => {
    const state = states.find((item) => item.id === defaultState.id);
    const name = typeof state?.name === "string" ? state.name.trim() : "";

    return {
      ...defaultState,
      name: name || defaultState.name
    };
  });
}

export function createDefaultSampleCounts(
  states: Array<Pick<EditableProjectState, "id">> = DEFAULT_PROJECT_STATES
) {
  return Object.fromEntries(states.map((state) => [state.id, 0]));
}

export function getProjectStateName(states: EditableProjectState[], stateId: string) {
  return states.find((state) => state.id === stateId)?.name ?? stateId;
}
