import type {
  ClassifierPredictor,
  RecognitionModel,
  SerializableClassifierPredictor,
  SerializedRecognitionModel
} from "./classifierTypes";
import { createEmbeddingClassifierFromSnapshot } from "./embeddingClassifier";
import { createLocalImageEmbedder } from "./localImageEmbedder";

export function serializeRecognitionModel(
  model: RecognitionModel | undefined
): SerializedRecognitionModel | undefined {
  if (!model || !isSerializableClassifier(model.classifier)) {
    return undefined;
  }

  return {
    version: 1,
    classifier: model.classifier.serialize()
  };
}

export function restoreRecognitionModel(
  snapshot: SerializedRecognitionModel | undefined
): RecognitionModel | undefined {
  if (!snapshot || snapshot.version !== 1) {
    return undefined;
  }

  return {
    classifier: createEmbeddingClassifierFromSnapshot(snapshot.classifier),
    embedder: createLocalImageEmbedder()
  };
}

function isSerializableClassifier(
  classifier: ClassifierPredictor
): classifier is SerializableClassifierPredictor {
  return typeof (classifier as SerializableClassifierPredictor).serialize === "function";
}
