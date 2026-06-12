import { createAppTrainer } from "./appTrainer";

describe("appTrainer", () => {
  it("does not create a real trainer before any samples are captured", () => {
    expect(createAppTrainer({ state_a: 0, state_b: 0 })).toBeUndefined();
  });

  it("creates a real sample trainer synchronously after samples are captured", () => {
    const trainer = createAppTrainer({ state_a: 2, state_b: 3 });

    expect(trainer).toEqual({
      train: expect.any(Function)
    });
  });
});
