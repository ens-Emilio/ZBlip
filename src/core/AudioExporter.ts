import JSZip from 'jszip';

export default class AudioExporter {
  static audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];

    AudioExporter.writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    AudioExporter.writeString(view, 8, 'WAVE');
    AudioExporter.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 4, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    AudioExporter.writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = channels[channel] ?? channels[0];
        const value = channelData?.[i] ?? 0;
        const sample = Math.max(-1, Math.min(1, value));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  static createWavBlob(buffer: AudioBuffer): Blob {
    return new Blob([AudioExporter.audioBufferToWav(buffer)], { type: 'audio/wav' });
  }

  exportWAV(audioBuffer: AudioBuffer) {
    const blob = AudioExporter.createWavBlob(audioBuffer);
    this.downloadBlob(blob, 'blip-audio.wav');
  }

  exportSRT(srtContent: string) {
    const blob = new Blob([srtContent], { type: 'text/plain; charset=utf-8' });
    this.downloadBlob(blob, 'legendas.srt');
  }

  async exportZip(audioBuffer: AudioBuffer, srtContent: string) {
    const zip = new JSZip();

    const wavBlob = AudioExporter.createWavBlob(audioBuffer);
    const srtBlob = new Blob([srtContent], { type: 'text/plain; charset=utf-8' });

    zip.file('audio.wav', wavBlob);
    zip.file('legendas.srt', srtBlob);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(zipBlob, 'blip-complete.zip');
  }

  private static writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
