export type StateTriggerCounterState = {
  counts: Record<string, number>;
  activeStateId?: string;
};

export function createInitialStateTriggerCounter(
  stateIds: string[]
): StateTriggerCounterState {
  return {
    counts: Object.fromEntries(stateIds.map((stateId) => [stateId, 0]))
  };
}

export function updateStateTriggerCounter(
  current: StateTriggerCounterState,
  nextStateId: string | undefined
): StateTriggerCounterState {
  if (!nextStateId) {
    return current.activeStateId === undefined
      ? current
      : { ...current, activeStateId: undefined };
  }

  if (current.activeStateId === nextStateId) {
    return current;
  }

  return {
    counts: {
      ...current.counts,
      [nextStateId]: (current.counts[nextStateId] ?? 0) + 1
    },
    activeStateId: nextStateId
  };
}

export function resetStateTriggerCounter(
  current: StateTriggerCounterState
): StateTriggerCounterState {
  return {
    counts: Object.fromEntries(Object.keys(current.counts).map((stateId) => [stateId, 0]))
  };
}
