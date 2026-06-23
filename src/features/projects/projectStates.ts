import type { InputState } from "./projectTypes";

export type EditableProjectState = Pick<InputState, "id" | "name" | "order">;

export const DEFAULT_PROJECT_STATES: EditableProjectState[] = [
  { id: "state_a", name: "状态 A", order: 0 },
  { id: "state_b", name: "状态 B", order: 1 }
];

export const MAX_PROJECT_STATES = 4;

export function normalizeEditableProjectStates(
  states: Partial<InputState>[] | undefined = []
): EditableProjectState[] {
  const normalizedDefaultStates = DEFAULT_PROJECT_STATES.map((defaultState) => {
    const state = states.find((item) => item.id === defaultState.id);
    const name = typeof state?.name === "string" ? state.name.trim() : "";

    return {
      ...defaultState,
      name: name || defaultState.name
    };
  });
  const defaultStateIds = new Set(DEFAULT_PROJECT_STATES.map((state) => state.id));
  const normalizedExtraStates = states
    .filter((state) => typeof state.id === "string" && !defaultStateIds.has(state.id))
    .map((state, index) => ({
      id: state.id!,
      name: typeof state.name === "string" && state.name.trim() ? state.name.trim() : state.id!,
      order: typeof state.order === "number" ? state.order : DEFAULT_PROJECT_STATES.length + index
    }))
    .sort((a, b) => a.order - b.order)
    .filter(
      (state, index, allStates) =>
        allStates.findIndex((item) => item.id === state.id) === index
    );

  return [...normalizedDefaultStates, ...normalizedExtraStates]
    .slice(0, MAX_PROJECT_STATES)
    .map((state, order) => ({ ...state, order }));
}

export function createDefaultSampleCounts(
  states: Array<Pick<EditableProjectState, "id">> = DEFAULT_PROJECT_STATES
) {
  return Object.fromEntries(states.map((state) => [state.id, 0]));
}

export function getProjectStateName(states: EditableProjectState[], stateId: string) {
  return states.find((state) => state.id === stateId)?.name ?? stateId;
}

export function createNextProjectState(
  states: Array<Pick<EditableProjectState, "id">>
): EditableProjectState | undefined {
  const normalizedStates = normalizeEditableProjectStates(states);

  if (normalizedStates.length >= MAX_PROJECT_STATES) {
    return undefined;
  }

  const usedStateIds = new Set(normalizedStates.map((state) => state.id));
  const nextOrder = normalizedStates.length;

  for (let stateNumber = 3; stateNumber <= MAX_PROJECT_STATES; stateNumber += 1) {
    const stateId = `state_${stateNumber}`;

    if (!usedStateIds.has(stateId)) {
      return {
        id: stateId,
        name: `状态 ${stateNumber}`,
        order: nextOrder
      };
    }
  }

  return undefined;
}

export function canDeleteProjectState(stateId: string) {
  return !DEFAULT_PROJECT_STATES.some((state) => state.id === stateId);
}
