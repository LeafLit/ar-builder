export type CameraService = {
  start(video: HTMLVideoElement): Promise<MediaStream>;
  stop(stream: MediaStream): void;
  captureFrame(video: HTMLVideoElement, size?: number): Promise<Blob>;
};

export function createCameraService(): CameraService {
  return {
    async start(video) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      return stream;
    },

    stop(stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },

    async captureFrame(video, size = 224) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("无法创建图像采集画布。");
      }

      context.drawImage(video, 0, 0, size, size);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("采集图像失败。"));
            }
          },
          "image/jpeg",
          0.86
        );
      });
    }
  };
}
