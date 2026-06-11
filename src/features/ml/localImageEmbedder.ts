import type { ImageEmbedder } from "./classifierTypes";

type LocalImageEmbedderOptions = {
  gridSize?: number;
};

type ImageDataLike = {
  data: Uint8ClampedArray;
  height: number;
  width: number;
};

export function createLocalImageEmbedder(
  options: LocalImageEmbedderOptions = {}
): ImageEmbedder {
  const gridSize = options.gridSize ?? 16;

  return {
    async embed(image) {
      const imageData = readImageData(image, gridSize);
      const grayGrid = createGrayGrid(imageData, gridSize);
      const edgeGrid = createEdgeGrid(grayGrid, gridSize);
      const rowProfile = createRowProfile(grayGrid, gridSize);
      const columnProfile = createColumnProfile(grayGrid, gridSize);

      return [...grayGrid, ...edgeGrid, ...rowProfile, ...columnProfile];
    }
  };
}

function readImageData(
  image: HTMLImageElement | HTMLCanvasElement | ImageData,
  gridSize: number
): ImageDataLike {
  if (isImageDataLike(image)) {
    return resampleImageData(image, gridSize);
  }

  const canvas = document.createElement("canvas");
  canvas.width = gridSize;
  canvas.height = gridSize;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("无法创建本地图像特征画布。");
  }

  context.drawImage(image, 0, 0, gridSize, gridSize);

  return context.getImageData(0, 0, gridSize, gridSize);
}

function isImageDataLike(value: unknown): value is ImageDataLike {
  return (
    Boolean(value) &&
    typeof (value as ImageDataLike).width === "number" &&
    typeof (value as ImageDataLike).height === "number" &&
    (value as ImageDataLike).data instanceof Uint8ClampedArray
  );
}

function resampleImageData(imageData: ImageDataLike, gridSize: number): ImageDataLike {
  if (imageData.width === gridSize && imageData.height === gridSize) {
    return imageData;
  }

  const data = new Uint8ClampedArray(gridSize * gridSize * 4);

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const sourceX = Math.min(
        imageData.width - 1,
        Math.floor((x / gridSize) * imageData.width)
      );
      const sourceY = Math.min(
        imageData.height - 1,
        Math.floor((y / gridSize) * imageData.height)
      );
      const sourceIndex = (sourceY * imageData.width + sourceX) * 4;
      const targetIndex = (y * gridSize + x) * 4;

      data[targetIndex] = imageData.data[sourceIndex];
      data[targetIndex + 1] = imageData.data[sourceIndex + 1];
      data[targetIndex + 2] = imageData.data[sourceIndex + 2];
      data[targetIndex + 3] = imageData.data[sourceIndex + 3];
    }
  }

  return {
    data,
    height: gridSize,
    width: gridSize
  };
}

function createGrayGrid(imageData: ImageDataLike, gridSize: number) {
  const values: number[] = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const index = (y * gridSize + x) * 4;
      const red = imageData.data[index] / 255;
      const green = imageData.data[index + 1] / 255;
      const blue = imageData.data[index + 2] / 255;

      values.push(red * 0.299 + green * 0.587 + blue * 0.114);
    }
  }

  return values;
}

function createEdgeGrid(grayGrid: number[], gridSize: number) {
  return grayGrid.map((value, index) => {
    const x = index % gridSize;
    const y = Math.floor(index / gridSize);
    const right = x + 1 < gridSize ? grayGrid[index + 1] : value;
    const bottom = y + 1 < gridSize ? grayGrid[index + gridSize] : value;

    return Math.abs(value - right) + Math.abs(value - bottom);
  });
}

function createRowProfile(grayGrid: number[], gridSize: number) {
  return Array.from({ length: gridSize }, (_, row) => {
    const start = row * gridSize;
    const values = grayGrid.slice(start, start + gridSize);

    return average(values);
  });
}

function createColumnProfile(grayGrid: number[], gridSize: number) {
  return Array.from({ length: gridSize }, (_, column) => {
    const values = Array.from({ length: gridSize }, (_, row) => grayGrid[row * gridSize + column]);

    return average(values);
  });
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
