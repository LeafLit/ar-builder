import { createScreenAnchorPlacement } from "./screenAnchor";

describe("screenAnchor", () => {
  it("maps saved transforms to screen percentages and display scale", () => {
    expect(
      createScreenAnchorPlacement({
        position: [0.5, -0.5, 0],
        rotation: [0, 0, 0],
        scale: [1.35, 1.35, 1]
      })
    ).toEqual({
      xPercent: 75,
      yPercent: 25,
      scale: 1.35
    });
  });

  it("keeps anchors inside the camera preview", () => {
    expect(
      createScreenAnchorPlacement({
        position: [2, -2, 0],
        rotation: [0, 0, 0],
        scale: [0.1, 0.1, 1]
      })
    ).toEqual({
      xPercent: 100,
      yPercent: 0,
      scale: 0.5
    });
  });
});
