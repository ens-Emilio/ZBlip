import { Howl } from 'howler';
import AudioExporter from './AudioExporter';

export default class PlayerController {
  private howl: Howl | null = null;
  private objectUrl: string | null = null;
  private playbackRate = 1.0;

  async load(buffer: AudioBuffer): Promise<void> {
    this.cleanup();
    const blob = AudioExporter.createWavBlob(buffer);
    this.objectUrl = URL.createObjectURL(blob);
    this.howl = new Howl({
      src: [this.objectUrl],
      format: ['wav'],
      html5: false,
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.howl) return reject(new Error('Howl not created'));
      this.howl.once('load', () => resolve());
      this.howl.once('loaderror', (_id: number, err: unknown) => reject(err));
    });

    this.howl.rate(this.playbackRate);
  }

  play() {
    this.howl?.play();
  }

  pause() {
    this.howl?.pause();
  }

  stop() {
    this.howl?.stop();
    this.seek(0);
  }

  seek(ms: number) {
    if (!this.howl) return;
    this.howl.seek(ms / 1000);
  }

  setRate(rate: number) {
    this.playbackRate = Math.min(2, Math.max(0.25, rate));
    if (this.howl) {
      this.howl.rate(this.playbackRate);
    }
  }

  getRate() {
    return this.playbackRate;
  }

  getPositionMs(): number {
    if (!this.howl) return 0;
    const pos = this.howl.seek();
    return typeof pos === 'number' ? pos * 1000 : 0;
  }

  isPlaying(): boolean {
    return this.howl?.playing() ?? false;
  }

  cleanup() {
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
