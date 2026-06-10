import type { StateBinding } from "../projects/projectTypes";
import { createRuleEngine } from "./ruleEngine";

describe("ruleEngine", () => {
  it("returns the action for the detected state", () => {
    const bindings: StateBinding[] = [
      {
        id: "binding_1",
        stateId: "state_left",
        action: {
          type: "show",
          assetId: "asset_tree",
          visible: true,
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        }
      }
    ];

    const result = createRuleEngine().resolve("state_left", bindings);

    expect(result?.action.type).toBe("show");
    expect(result?.action.assetId).toBe("asset_tree");
  });

  it("returns undefined when no binding matches", () => {
    const result = createRuleEngine().resolve("missing", []);

    expect(result).toBeUndefined();
  });
});
