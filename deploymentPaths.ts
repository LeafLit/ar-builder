type DeployBaseInput = {
  githubPages?: string;
};

export function getDeployBase(input: DeployBaseInput = { githubPages: process.env.GITHUB_PAGES }) {
  if (input.githubPages === "true") {
    return "/ar-builder/";
  }

  return "/";
}

export function normalizeDeployBase(base: string) {
  const withoutSlashes = base.replace(/^\/+|\/+$/g, "");

  if (!withoutSlashes) {
    return "/";
  }

  return `/${withoutSlashes}/`;
}

export function createPwaManifestPaths() {
  return {
    icon192: "icons/icon-192.png",
    icon512: "icons/icon-512.png",
    maskable512: "icons/maskable-512.png",
    scope: ".",
    startUrl: "."
  };
}
