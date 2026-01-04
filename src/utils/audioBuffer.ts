export function mergeBuffers(context: AudioContext, buffers: AudioBuffer[]): AudioBuffer {
  if (!buffers.length) {
    return context.createBuffer(1, 1, context.sampleRate);
  }

  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = context.createBuffer(1, totalLength, context.sampleRate);
  const output = result.getChannelData(0);

  let offset = 0;
  buffers.forEach((buffer) => {
    output.set(buffer.getChannelData(0), offset);
    offset += buffer.length;
  });

  return result;
}
