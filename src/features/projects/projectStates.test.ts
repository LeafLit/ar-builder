import { describe, expect, it } from "vitest";
import {
  canDeleteProjectState,
  createNextProjectState,
  createDefaultSampleCounts,
  DEFAULT_PROJECT_STATES,
  getProjectStateName,
  MAX_PROJECT_STATES,
  normalizeEditableProjectStates
} from "./projectStates";

describe("projectStates", () => {
  it("provides the two default MVP states", () => {
    expect(DEFAULT_PROJECT_STATES).toEqual([
      { id: "state_a", name: "状态 A", order: 0 },
      { id: "state_b", name: "状态 B", order: 1 }
    ]);
  });

  it("normalizes custom names while preserving fixed state ids", () => {
    expect(
      normalizeEditableProjectStates([
        { id: "state_b", name: "巴掌", order: 1, sampleIds: [] },
        { id: "state_a", name: "拳头", order: 0, sampleIds: [] }
      ])
    ).toEqual([
      { id: "state_a", name: "拳头", order: 0 },
      { id: "state_b", name: "巴掌", order: 1 }
    ]);
  });

  it("preserves extra project states up to the project state limit", () => {
    const states = normalizeEditableProjectStates([
      { id: "state_4", name: "Fourth", order: 3, sampleIds: [] },
      { id: "state_3", name: "Third", order: 2, sampleIds: [] },
      { id: "state_5", name: "Fifth", order: 4, sampleIds: [] }
    ]);

    expect(states).toHaveLength(MAX_PROJECT_STATES);
    expect(states.map((state) => state.id)).toEqual([
      "state_a",
      "state_b",
      "state_3",
      "state_4"
    ]);
    expect(states[2]).toEqual({ id: "state_3", name: "Third", order: 2 });
  });

  it("falls back to default names for blank or missing states", () => {
    expect(
      normalizeEditableProjectStates([
        { id: "state_a", name: "   ", order: 0, sampleIds: [] }
      ])
    ).toEqual(DEFAULT_PROJECT_STATES);
  });

  it("creates sample count records for known states", () => {
    expect(createDefaultSampleCounts()).toEqual({ state_a: 0, state_b: 0 });
  });

  it("creates the next available extra state until the limit is reached", () => {
    const thirdState = createNextProjectState(DEFAULT_PROJECT_STATES);
    const fourthState = createNextProjectState([...DEFAULT_PROJECT_STATES, thirdState!]);
    const missingState = createNextProjectState([
      ...DEFAULT_PROJECT_STATES,
      thirdState!,
      fourthState!
    ]);

    expect(thirdState).toEqual({ id: "state_3", name: "状态 3", order: 2 });
    expect(fourthState).toEqual({ id: "state_4", name: "状态 4", order: 3 });
    expect(missingState).toBeUndefined();
  });

  it("only allows deleting extra states", () => {
    expect(canDeleteProjectState("state_a")).toBe(false);
    expect(canDeleteProjectState("state_b")).toBe(false);
    expect(canDeleteProjectState("state_3")).toBe(true);
  });

  it("looks up display names with an id fallback", () => {
    const states = normalizeEditableProjectStates([
      { id: "state_a", name: "拳头", order: 0, sampleIds: [] }
    ]);

    expect(getProjectStateName(states, "state_a")).toBe("拳头");
    expect(getProjectStateName(states, "unknown")).toBe("unknown");
  });
});
