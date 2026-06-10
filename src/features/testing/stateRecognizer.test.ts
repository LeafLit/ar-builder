import { createSequenceRecognizer } from "./stateRecognizer";

describe("stateRecognizer", () => {
  it("emits state predictions in sequence until stopped", async () => {
    vi.useFakeTimers();
    const onResult = vi.fn();
    const recognizer = createSequenceRecognizer(["state_a", "state_b"], 100);

    const session = await recognizer.start(onResult);

    expect(onResult).toHaveBeenLastCalledWith({
      stateId: "state_a",
      confidence: 1
    });

    vi.advanceTimersByTime(100);

    expect(onResult).toHaveBeenLastCalledWith({
      stateId: "state_b",
      confidence: 1
    });

    session.stop();
    vi.advanceTimersByTime(100);

    expect(onResult).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
