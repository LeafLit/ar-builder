import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import type { ImageEmbedder } from "./classifierTypes";

export async function createMobileNetEmbedder(): Promise<ImageEmbedder> {
  await tf.ready();
  const model = await mobilenet.load({ version: 2, alpha: 0.5 });

  return {
    async embed(image) {
      const activation = model.infer(image, true);
      const values = await activation.data();
      activation.dispose();
      return Array.from(values);
    }
  };
}
