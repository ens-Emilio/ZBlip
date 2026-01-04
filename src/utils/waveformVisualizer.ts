export interface WaveformOptions {
  strokeColor: string;
  progressColor: string;
  backgroundColor: string;
  barWidth: number;
  padding: number;
}

export class WaveformVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: WaveformOptions;

  constructor(canvas: HTMLCanvasElement, options: WaveformOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;
    this.options = options;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  draw(waveformData: number[], progress: number = 0) {
    const { width, height } = this.canvas;
    const { strokeColor, progressColor, backgroundColor, barWidth, padding } = this.options;
    const ctx = this.ctx;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const barCount = waveformData.length;
    if (barCount === 0) return;
    const barSpacing = (width - padding * 2) / barCount;
    const maxHeight = height - padding * 2;

    waveformData.forEach((value, i) => {
      const barHeight = value * maxHeight;
      const x = padding + i * barSpacing;
      const y = (height - barHeight) / 2;
      ctx.fillStyle = i / barCount < progress ? progressColor : strokeColor;
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }
}
