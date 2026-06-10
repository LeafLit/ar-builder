import type { OutputAction, StateBinding } from "../projects/projectTypes";

export type ResolvedAction = {
  stateId: string;
  action: OutputAction;
};

export type RuleEngine = {
  resolve(stateId: string, bindings: StateBinding[]): ResolvedAction | undefined;
};
