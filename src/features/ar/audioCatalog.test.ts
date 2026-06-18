import { BUILT_IN_AUDIO_OPTIONS, getBuiltInAudioOption } from "./audioCatalog";

describe("audioCatalog", () => {
  it("lists the built-in audio options", () => {
    expect(BUILT_IN_AUDIO_OPTIONS.map((option) => option.label)).toEqual([
      "提示音",
      "成功音",
      "警告音"
    ]);
  });

  it("falls back to the default audio option for an unknown id", () => {
    expect(getBuiltInAudioOption("missing").id).toBe("beep");
  });
});
