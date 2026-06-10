import type { StateBinding } from "../projects/projectTypes";
import type { RuleEngine } from "./authoringTypes";

export function createRuleEngine(): RuleEngine {
  return {
    resolve(stateId: string, bindings: StateBinding[]) {
      const binding = bindings.find((item) => item.stateId === stateId);

      if (!binding) {
        return undefined;
      }

      return {
        stateId,
        action: binding.action
      };
    }
  };
}
