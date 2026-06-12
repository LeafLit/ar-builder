import type { Transform } from "../projects/projectTypes";

export type ScreenAnchorPlacement = {
  xPercent: number;
  yPercent: number;
  scale: number;
};

export function createScreenAnchorPlacement(transform: Transform): ScreenAnchorPlacement {
  const x = clampFinite(transform.position[0], -1, 1, 0);
  const y = clampFinite(transform.position[1], -1, 1, 0);
  const scale = clampFinite(transform.scale[0], 0.5, 2, 1);

  return {
    xPercent: round((x + 1) * 50),
    yPercent: round((y + 1) * 50),
    scale: round(scale)
  };
}

function clampFinite(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
