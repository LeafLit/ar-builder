import { describe, expect, it } from "vitest";
import {
  createDefaultSampleCounts,
  DEFAULT_PROJECT_STATES,
  getProjectStateName,
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

  it("looks up display names with an id fallback", () => {
    const states = normalizeEditableProjectStates([
      { id: "state_a", name: "拳头", order: 0, sampleIds: [] }
    ]);

    expect(getProjectStateName(states, "state_a")).toBe("拳头");
    expect(getProjectStateName(states, "unknown")).toBe("unknown");
  });
});
