import { describe, expect, it } from "vitest";
import {
  createPwaManifestPaths,
  getDeployBase,
  normalizeDeployBase
} from "./deploymentPaths";

describe("deployment paths", () => {
  it("uses the local root base when no GitHub Pages flag is set", () => {
    expect(getDeployBase({ githubPages: undefined })).toBe("/");
  });

  it("uses the repository subpath when GitHub Pages builds the app", () => {
    expect(getDeployBase({ githubPages: "true" })).toBe("/ar-builder/");
  });

  it("normalizes custom deployment bases", () => {
    expect(normalizeDeployBase("ar-builder")).toBe("/ar-builder/");
    expect(normalizeDeployBase("/ar-builder")).toBe("/ar-builder/");
    expect(normalizeDeployBase("/ar-builder/")).toBe("/ar-builder/");
  });

  it("keeps manifest paths relative so PWA assets work under subpaths", () => {
    expect(createPwaManifestPaths()).toEqual({
      icon192: "icons/icon-192.png",
      icon512: "icons/icon-512.png",
      maskable512: "icons/maskable-512.png",
      scope: ".",
      startUrl: "."
    });
  });
});
