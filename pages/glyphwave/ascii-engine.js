// GLYPHWAVE — ASCII 文字影像引擎
// Three.js 3D 場景 → 亮度取樣 → 字元矩陣即時渲染（Canvas 2D，無後處理庫）
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

export const RAMPS = {
  digitanks: " .\\'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$".split('').join(''),
  blocks:    ' ░▒▓█',
  minimal:   ' .:-=+*#%@',
  katakana:  ' ･' + '｡｢｣ｼｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ',
};

const NEON = { cyan: [0, 229, 255], magenta: [255, 45, 149], lime: [140, 255, 120] };

const SHAPES = {
  knot: () => new THREE.TorusKnotGeometry(1.05, 0.34, 180, 28, 2, 3),
  sphere: () => new THREE.IcosahedronGeometry(1.45, 2),
  torus: () => new THREE.TorusGeometry(1.15, 0.5, 24, 64),
  diamond: () => new THREE.OctahedronGeometry(1.5, 0),
};

export class AsciiEngine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opt = Object.assign({
      cell: 9,            // 每個字元格子的 CSS 像素
      ramp: 'digitanks',
      shape: 'knot',
      invert: false,
      glitch: 0.35,       // 0..1 glitch 強度
      color: 'neon',      // neon | duo | mono
      parallax: true,
      fps: 30,
      tilt: 0.55,         // 3D 物件初始傾角
    }, opts);

    // --- Three.js 場景（渲染尺寸只有字元格大小，成本極低） ---
    this.glRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.glRenderer.setPixelRatio(1);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
    this.camera.position.z = 4.1;
    this.mesh = new THREE.Mesh(
      SHAPES[this.opt.shape](),
      new THREE.MeshNormalMaterial({ flatShading: true }),
    );
    this.mesh.rotation.x = this.opt.tilt;
    this.scene.add(this.mesh);
    // 一層淡出暈影：讓物件邊緣融入黑底
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });

    this.mouse = { x: 0, y: 0 };
    this.targetRot = { x: this.opt.tilt, y: 0 };
    this._bindPointer();
    this._resizeObs = new ResizeObserver(() => this.resize());
    this._resizeObs.observe(this.canvas.parentElement || this.canvas);
    this.resize();

    this._frame = 0;
    this._last = 0;
    this._raf = null;
    this.running = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop(); else if (this._wantRun) this.start();
    });
  }

  setOption(key, value) {
    this.opt[key] = value;
    if (key === 'cell' || key === 'ramp') this.resize();
    if (key === 'shape') this.setShape(value);
  }

  setShape(kind) {
    if (!SHAPES[kind]) return;
    this.mesh.geometry.dispose();
    this.mesh.geometry = SHAPES[kind]();
  }

  resize() {
    const host = this.canvas.parentElement || document.body;
    const w = host.clientWidth, h = host.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.dpr = dpr;
    const cell = this.opt.cell * dpr;
    this.cell = cell;
    // 等寬字元：寬高比約 0.6
    this.cellW = cell * 0.602;
    this.cellH = cell;
    this.cols = Math.floor(w * dpr / this.cellW);
    this.rows = Math.floor(h * dpr / this.cellH);
    this.glRenderer.setSize(this.cols, this.rows, false);
    this.sampleCanvas.width = this.cols;
    this.sampleCanvas.height = this.rows;
    this.camera.aspect = this.cols / Math.max(this.rows, 1) || 1;
    // 字數少（格數）時物件要縮小，否則字元稀疏會「糊」掉細節
    this.camera.position.z = 4.1 * Math.max(1, 10 / this.opt.cell) * 0.92;
    this.camera.updateProjectionMatrix();
    this._font = `${Math.round(cell)}px "Courier New", "Noto Sans TC", monospace`;
  }

  start() {
    this._wantRun = true;
    if (this.running) return;
    this.running = true;
    this._last = 0;
    this._raf = requestAnimationFrame(this._frameFn = (t) => {
      if (!this.running) return;
      const min = 1000 / this.opt.fps;
      if (t - this._last >= min - 1) { this._last = t; this._tick(t); }
      this._raf = requestAnimationFrame(this._frameFn);
    });
  }

  stop() {
    this._wantRun = false;
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _bindPointer() {
    const host = this.canvas.parentElement || this.canvas;
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width - 0.5;
      this.mouse.y = (e.clientY - r.top) / r.height - 0.5;
    });
  }

  _tick(t) {
    const time = t * 0.001;
    // 自轉 + 游標視差
    const px = this.opt.parallax ? this.mouse.x * 0.9 : 0;
    const py = this.opt.parallax ? this.mouse.y * 0.6 : 0;
    this.targetRot.y = time * 0.55 + px;
    this.targetRot.x = this.opt.tilt + py;
    this.mesh.rotation.y += (this.targetRot.y - this.mesh.rotation.y) * 0.08;
    this.mesh.rotation.x += (this.targetRot.x - this.mesh.rotation.x) * 0.08;

    // 3D 場景只渲染成 cols×rows 的小圖
    this.glRenderer.render(this.scene, this.camera);
    this.sampleCtx.drawImage(this.glRenderer.domElement, 0, 0, this.cols, this.rows);
    const data = this.sampleCtx.getImageData(0, 0, this.cols, this.rows).data;

    this._drawFrame(data, time);
  }

  _drawFrame(data, time) {
    const ctx = this.ctx, cols = this.cols, rows = this.rows;
    const ramp = RAMPS[this.opt.ramp] || RAMPS.digitanks;
    const gl = this.opt.glitch;
    this._frame++;

    // glitch：本幀選幾個橫帶做水平位移 + 字元雜訊
    let bands = [];
    if (gl > 0 && Math.random() < 0.10 * gl) {
      const n = 1 + Math.floor(Math.random() * 3 * gl);
      for (let i = 0; i < n; i++) {
        bands.push({
          y0: Math.floor(Math.random() * rows),
          h: 1 + Math.floor(Math.random() * 6 * gl),
          dx: Math.round((Math.random() - 0.5) * 24 * gl),
        });
      }
    }
    const bandAt = (y) => {
      for (const b of bands) if (y >= b.y0 && y < b.y0 + b.h) return b;
      return null;
    };

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = this._font;
    ctx.textBaseline = 'alphabetic';
    const cw = this.cellW, chh = this.cellH;
    const lastIdx = ramp.length - 1;
    const colorMode = this.opt.color;
    let prevColor = '';

    for (let y = 0; y < rows; y++) {
      const band = bandAt(y);
      const dx = band ? band.dx : 0;
      const ypx = (y + 0.86) * chh;
      for (let x = 0; x < cols; x++) {
        let sx = x + dx;
        if (sx < 0 || sx >= cols) continue;
        const i = (y * cols + sx) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum < 0.045) continue; // 黑底跳過
        if (this.opt.invert) lum = 1 - lum;
        // glitch 字元雜訊
        if (band && Math.random() < 0.25 * gl) lum = Math.random();
        const ch = ramp[Math.min(lastIdx, Math.floor(lum * lastIdx))];
        if (ch === ' ') continue;

        let cr, cg, cb;
        if (colorMode === 'mono') {
          cr = NEON.cyan[0] * lum * 0.6; cg = NEON.cyan[1] * lum; cb = NEON.cyan[2] * lum;
        } else if (colorMode === 'duo') {
          cr = NEON.magenta[0] + (NEON.cyan[0] - NEON.magenta[0]) * lum;
          cg = NEON.magenta[1] + (NEON.cyan[1] - NEON.magenta[1]) * lum;
          cb = 255;
        } else { // neon：取 3D 法線顏色並提亮，保留霓虹感
          cr = Math.min(255, r * 1.15 + 20); cg = Math.min(255, g * 1.15 + 20); cb = Math.min(255, b * 1.15 + 40);
        }
        const fs = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
        if (fs !== prevColor) { ctx.fillStyle = fs; prevColor = fs; }
        ctx.fillText(ch, (x + dx) * cw, ypx);
      }
    }
  }
}
