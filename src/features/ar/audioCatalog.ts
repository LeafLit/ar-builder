import type { BuiltInAudioId } from "../projects/projectTypes";

type BuiltInAudioTone = {
  frequency: number;
  startMs: number;
  durationMs: number;
};

export type BuiltInAudioOption = {
  id: BuiltInAudioId;
  label: string;
  tones: BuiltInAudioTone[];
};

export const BUILT_IN_AUDIO_OPTIONS: BuiltInAudioOption[] = [
  {
    id: "beep",
    label: "提示音",
    tones: [{ frequency: 660, startMs: 0, durationMs: 130 }]
  },
  {
    id: "success",
    label: "成功音",
    tones: [
      { frequency: 523, startMs: 0, durationMs: 110 },
      { frequency: 784, startMs: 110, durationMs: 150 }
    ]
  },
  {
    id: "alert",
    label: "警告音",
    tones: [
      { frequency: 330, startMs: 0, durationMs: 120 },
      { frequency: 247, startMs: 130, durationMs: 150 }
    ]
  }
];

export function getBuiltInAudioOption(audioId: string | undefined): BuiltInAudioOption {
  return (
    BUILT_IN_AUDIO_OPTIONS.find((option) => option.id === audioId) ??
    BUILT_IN_AUDIO_OPTIONS[0]
  );
}

export async function playBuiltInAudio(audioId: BuiltInAudioId): Promise<void> {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    throw new Error("Web Audio is not supported.");
  }

  const context = new AudioContextConstructor();

  if (context.state === "suspended") {
    await context.resume();
  }

  const option = getBuiltInAudioOption(audioId);

  option.tones.forEach((tone) => scheduleTone(context, tone));
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };

  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
}

function scheduleTone(context: AudioContext, tone: BuiltInAudioTone) {
  const startAt = context.currentTime + tone.startMs / 1000;
  const stopAt = startAt + tone.durationMs / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(tone.frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(stopAt);
}
