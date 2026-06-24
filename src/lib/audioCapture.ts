export interface PCMRecorder {
  stop: () => Promise<Blob>;
}

export async function startPCMRecording(): Promise<PCMRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);

  const bufferSize = 4096;
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
  const pcmChunks: Float32Array[] = [];

  processor.onaudioprocess = (e) => {
    const data = e.inputBuffer.getChannelData(0);
    pcmChunks.push(new Float32Array(data));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    stop: async (): Promise<Blob> => {
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      await audioContext.close();
      return float32ToS16LEBlob(pcmChunks);
    },
  };
}

// Convert Float32 samples (-1.0 to 1.0) → Int16 PCM. Output: raw s16le bytes, no WAV header.
function float32ToS16LEBlob(chunks: Float32Array[]): Blob {
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Float32Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const int16 = new Int16Array(merged.length);
  for (let i = 0; i < merged.length; i++) {
    const s = Math.max(-1, Math.min(1, merged[i]));
    int16[i] = s < 0 ? s * 32768 : s * 32767;
  }

  return new Blob([int16.buffer], { type: "audio/pcm" });
}
