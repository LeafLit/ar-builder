import {
  createInitialStateTriggerCounter,
  resetStateTriggerCounter,
  updateStateTriggerCounter
} from "./stateTriggerCounter";

describe("stateTriggerCounter", () => {
  it("increments only when entering a state", () => {
    let counter = createInitialStateTriggerCounter(["state_a", "state_b"]);

    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, "state_b");

    expect(counter.counts).toEqual({ state_a: 1, state_b: 1 });
    expect(counter.activeStateId).toBe("state_b");
  });

  it("clears the active state when recognition disappears", () => {
    let counter = createInitialStateTriggerCounter(["state_a"]);

    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, undefined);
    counter = updateStateTriggerCounter(counter, "state_a");

    expect(counter.counts.state_a).toBe(2);
    expect(counter.activeStateId).toBe("state_a");
  });

  it("resets all known counts to zero", () => {
    let counter = createInitialStateTriggerCounter(["state_a", "state_b"]);

    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, "state_b");

    const resetCounter = resetStateTriggerCounter(counter);

    expect(resetCounter.counts).toEqual({ state_a: 0, state_b: 0 });
    expect(resetCounter.activeStateId).toBeUndefined();
  });
});
