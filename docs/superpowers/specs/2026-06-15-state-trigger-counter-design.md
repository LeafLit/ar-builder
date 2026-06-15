# State Trigger Counter Design

## Goal

Add a lightweight counting behavior to the test screen so AR Builder can count how many times each trained state is triggered. This moves the app closer to the paper's "Counting and Aggregation" output behavior without introducing a full behavior system yet.

## Scope

Included:

- Show a counter panel in the test screen.
- Count each state when the active detected state changes into that state.
- Do not count repeated frames while the same state remains active.
- Clear the previous active state when recognition output disappears, so the same state can count again after being lost and found again.
- Let users reset all counters during testing.
- Make manual simulated recognition buttons use the same counting rule.

Not included:

- Persisting counts in saved projects.
- Making counter an editable AR output type.
- Conditional logic such as "when count reaches 10".
- Graphs, timers, or scoring systems.
- Changes to recognition thresholds or classifier logic.

## User Experience

The test screen gains a small panel titled `状态计数`.

It shows one row per known state:

- `状态 A：0 次`
- `状态 B：0 次`

When users tap `模拟识别状态 A`, state A increments to 1. Tapping state A again while it is already active does not increment. Switching to state B increments state B. In automatic recognition, the same rule applies after stable recognition confirms a state.

The panel includes `重置计数`, which sets all counts back to 0 and clears the last counted state.

## Architecture

Counting logic lives in a small pure helper:

- `stateTriggerCounter.ts` owns the state shape and transition rule.
- `TestScreen.tsx` calls the helper whenever the confirmed active state changes.
- The UI only reads the counter state and renders the rows.

This keeps the counting behavior separate from machine learning and AR rendering.

## Counting Rule

The counter stores:

```ts
type StateTriggerCounterState = {
  counts: Record<string, number>;
  activeStateId?: string;
};
```

Update behavior:

- If `nextStateId` is undefined: keep counts, clear `activeStateId`.
- If `nextStateId` equals `activeStateId`: keep counts unchanged.
- If `nextStateId` differs from `activeStateId`: increment `counts[nextStateId]` and set `activeStateId`.

## Testing

Automated tests cover:

- Pure counter logic increments only on state entry.
- Pure counter logic clears active state on missing recognition.
- Pure counter reset returns all counts to zero.
- Test screen increments counts for manual state transitions.
- Test screen increments again when automatic recognition loses a state and later confirms it again.
- Reset button clears visible counts.

