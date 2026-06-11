import { createLocalImageEmbedder } from "./localImageEmbedder";

function createSolidImageData(value: number) {
  const data = new Uint8ClampedArray(4 * 4 * 4);

  for (let index = 0; index < data.length; index += 4) {
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  return { data, height: 4, width: 4 } as ImageData;
}

describe("localImageEmbedder", () => {
  it("creates deterministic embeddings without loading a remote model", async () => {
    const embedder = createLocalImageEmbedder({ gridSize: 4 });
    const darkEmbedding = await embedder.embed(createSolidImageData(0));
    const brightEmbedding = await embedder.embed(createSolidImageData(255));

    expect(darkEmbedding.length).toBeGreaterThan(0);
    expect(brightEmbedding.length).toBe(darkEmbedding.length);
    expect(brightEmbedding).not.toEqual(darkEmbedding);
    expect(await embedder.embed(createSolidImageData(0))).toEqual(darkEmbedding);
  });
});
