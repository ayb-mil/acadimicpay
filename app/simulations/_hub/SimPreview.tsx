"use client";

import { useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   Aperçus animés des cartes de la vitrine. Ce ne sont pas les simulations
   complètes : des boucles légères en canvas 2D qui montrent le phénomène.
   Une seule boucle requestAnimationFrame partagée dessine uniquement les
   aperçus visibles à l'écran (8 contextes WebGL satureraient un téléphone).
   ══════════════════════════════════════════════════════════════════════════ */

export type PreviewKind =
  | "projectile"
  | "pendulum"
  | "rc"
  | "titration"
  | "rlc"
  | "decay"
  | "refraction"
  | "daniell"
  | "emwave";

const C = {
  bg: "#081124",
  grid: "rgba(140, 156, 192, 0.10)",
  axis: "rgba(140, 156, 192, 0.35)",
  muted: "#8C9CC0",
  teal: "#22E4D9",
  violet: "#9B7BFF",
  green: "#4ADE80",
  amber: "#FFB547",
  pink: "#FF5CC8",
};

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

/* ---------- Boucle partagée ---------- */

const active = new Set<() => void>();
let raf = 0;
function loop() {
  active.forEach((fn) => fn());
  raf = active.size ? requestAnimationFrame(loop) : 0;
}
function register(fn: () => void) {
  active.add(fn);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    active.delete(fn);
  };
}

/* ---------- Petits outils de dessin ---------- */

function glow(ctx: CanvasRenderingContext2D, color: string, blur = 12) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function noGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
}
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  glow(ctx, color, 16);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  noGlow(ctx);
}
function line(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}
function arrow(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string) {
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 2) return;
  const ang = Math.atan2(by - ay, bx - ax);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  glow(ctx, color, 8);
  line(ctx, ax, ay, bx, by);
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - 7 * Math.cos(ang - 0.45), by - 7 * Math.sin(ang - 0.45));
  ctx.lineTo(bx - 7 * Math.cos(ang + 0.45), by - 7 * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
  noGlow(ctx);
}
function gridBg(ctx: CanvasRenderingContext2D, w: number, h: number, step = 22) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.7);
  g.addColorStop(0, "rgba(34, 228, 217, 0.07)");
  g.addColorStop(1, "rgba(34, 228, 217, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let x = step; x < w; x += step) line(ctx, x, 0, x, h);
  for (let y = step; y < h; y += step) line(ctx, 0, y, w, y);
}
/** Trace y = f(u), u ∈ [0, uMax], dans le cadre (x0, y0, largeur, hauteur) ; f renvoie [0, 1]. */
function plot(
  ctx: CanvasRenderingContext2D,
  f: (u: number) => number,
  box: { x: number; y: number; w: number; h: number },
  uMax: number,
  color: string,
  width = 2.5
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  glow(ctx, color, 12);
  ctx.beginPath();
  const n = Math.max(2, Math.round(160 * uMax));
  for (let i = 0; i <= n; i++) {
    const u = (uMax * i) / n;
    const px = box.x + u * box.w;
    const py = box.y + box.h - f(u) * box.h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  noGlow(ctx);
}
function axes(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }) {
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  line(ctx, box.x, box.y, box.x, box.y + box.h);
  line(ctx, box.x, box.y + box.h, box.x + box.w, box.y + box.h);
}
function dashed(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string) {
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  line(ctx, ax, ay, bx, by);
  ctx.setLineDash([]);
}
function seeded(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ---------- Les aperçus ---------- */

const DRAW: Record<PreviewKind, Draw> = {
  emwave: drawEmWave,
  projectile(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const ground = h * 0.84;
    const x0 = w * 0.1;
    const span = w * 0.8;
    const H = h * 0.6;
    const u = (t % 3) / 3;
    const X = (s: number) => x0 + s * span;
    const Y = (s: number) => ground - 4 * H * s * (1 - s);

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    line(ctx, w * 0.05, ground, w * 0.95, ground);
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = "rgba(34, 228, 217, 0.25)";
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const s = i / 60;
      if (i === 0) ctx.moveTo(X(s), Y(s));
      else ctx.lineTo(X(s), Y(s));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 2.5;
    glow(ctx, C.teal, 14);
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const s = (u * i) / 80;
      if (i === 0) ctx.moveTo(X(s), Y(s));
      else ctx.lineTo(X(s), Y(s));
    }
    ctx.stroke();
    noGlow(ctx);

    const bx = X(u);
    const by = Y(u);
    const vScale = h * 0.22;
    arrow(ctx, bx, by, bx + vScale * 0.7, by, C.amber);
    arrow(ctx, bx, by, bx, by - vScale * (1 - 2 * u), C.violet);
    dot(ctx, bx, by, 6, "#E8EEFA");
  },

  pendulum(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const px = w / 2;
    const py = h * 0.1;
    const L = h * 0.66;
    const th0 = 0.62;
    const omega = (2 * Math.PI) / 2.4;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    line(ctx, px - w * 0.18, py, px + w * 0.18, py);
    dashed(ctx, px, py, px, py + L + 14, "rgba(140, 156, 192, 0.3)");
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = "rgba(155, 123, 255, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py, L, Math.PI / 2 - th0, Math.PI / 2 + th0);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let k = 6; k >= 1; k--) {
      const th = th0 * Math.cos(omega * (t - k * 0.045));
      ctx.globalAlpha = 0.07 * (7 - k);
      dot(ctx, px + L * Math.sin(th), py + L * Math.cos(th), 9, C.teal);
    }
    ctx.globalAlpha = 1;
    const th = th0 * Math.cos(omega * t);
    const bx = px + L * Math.sin(th);
    const by = py + L * Math.cos(th);
    ctx.strokeStyle = "#C8D6F5";
    ctx.lineWidth = 1.8;
    line(ctx, px, py, bx, by);
    dot(ctx, px, py, 3, C.muted);
    dot(ctx, bx, by, 10, C.teal);
  },

  rc(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const box = { x: w * 0.1, y: h * 0.16, w: w * 0.82, h: h * 0.66 };
    axes(ctx, box);
    dashed(ctx, box.x, box.y, box.x + box.w, box.y, "rgba(74, 222, 128, 0.45)");
    const P = 6;
    const progress = (t % P) / P;
    const f = (u: number) => (u < 0.5 ? 1 - Math.exp(-u * 10) : (1 - Math.exp(-5)) * Math.exp(-(u - 0.5) * 10));
    plot(ctx, f, box, progress, C.teal);
    dot(ctx, box.x + progress * box.w, box.y + box.h - f(progress) * box.h, 5, "#E8EEFA");
    ctx.fillStyle = C.green;
    ctx.font = "600 11px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText("E", box.x + box.w - 10, box.y - 6);
  },

  titration(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const box = { x: w * 0.1, y: h * 0.12, w: w * 0.62, h: h * 0.72 };
    axes(ctx, box);
    const ueq = 0.55;
    const f = (u: number) => 0.5 + 0.46 * Math.tanh((u - ueq) * 14);
    dashed(ctx, box.x + ueq * box.w, box.y, box.x + ueq * box.w, box.y + box.h, "rgba(155, 123, 255, 0.5)");
    const progress = Math.min(1, (t % 5.5) / 4.5);
    plot(ctx, f, box, progress, C.violet);
    const pH = 14 * f(progress);
    dot(ctx, box.x + progress * box.w, box.y + box.h - f(progress) * box.h, 5, "#E8EEFA");

    const bx = w * 0.8;
    const bw = w * 0.13;
    const top = h * 0.32;
    const bot = h * 0.82;
    const mix = Math.max(0, Math.min(1, (pH - 8) / 2));
    ctx.fillStyle = mix > 0 ? `rgba(255, 92, 200, ${0.25 + 0.5 * mix})` : "rgba(140, 156, 192, 0.18)";
    if (mix > 0.3) glow(ctx, C.pink, 18 * mix);
    ctx.fillRect(bx, top + (bot - top) * 0.35, bw, (bot - top) * 0.65);
    noGlow(ctx);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, top);
    ctx.lineTo(bx, bot);
    ctx.lineTo(bx + bw, bot);
    ctx.lineTo(bx + bw, top);
    ctx.stroke();
    const dropY = top - 6 + ((t * 1.6) % 1) * (bot - top) * 0.3;
    if (progress < 1) dot(ctx, bx + bw / 2, dropY, 2.5, C.teal);
  },

  rlc(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const box = { x: w * 0.08, y: h * 0.12, w: w * 0.86, h: h * 0.76 };
    const mid = box.y + box.h / 2;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.2;
    line(ctx, box.x, box.y, box.x, box.y + box.h);
    line(ctx, box.x, mid, box.x + box.w, mid);
    const a = 3.2;
    const wd = 2 * Math.PI * 5;
    const env = (u: number) => Math.exp(-a * u);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(155, 123, 255, 0.45)";
    ctx.lineWidth = 1.2;
    for (const sgn of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const py = mid - sgn * env(u) * (box.h / 2) * 0.92;
        if (i === 0) ctx.moveTo(box.x + u * box.w, py);
        else ctx.lineTo(box.x + u * box.w, py);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const progress = (t % 4.5) / 4;
    const p = Math.min(1, progress);
    const f = (u: number) => 0.5 + 0.46 * env(u) * Math.cos(wd * u);
    plot(ctx, f, box, p, C.teal, 2.2);
    dot(ctx, box.x + p * box.w, box.y + box.h - f(p) * box.h, 5, "#E8EEFA");
  },

  decay(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const cols = 14;
    const rows = 5;
    const T = t % 8;
    const zoneH = h * 0.52;
    const sx = (w * 0.86) / cols;
    const sy = zoneH / rows;
    let alive = 0;
    for (let i = 0; i < cols * rows; i++) {
      const life = -Math.log(1 - seeded(i) * 0.999) * 1.6;
      const x = w * 0.07 + sx * ((i % cols) + 0.5);
      const y = h * 0.08 + sy * (Math.floor(i / cols) + 0.5);
      if (T < life) {
        alive++;
        dot(ctx, x, y, 3.6, C.teal);
      } else {
        ctx.fillStyle = "rgba(46, 64, 104, 0.9)";
        ctx.beginPath();
        ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const box = { x: w * 0.08, y: h * 0.66, w: w * 0.84, h: h * 0.26 };
    axes(ctx, box);
    const lam = Math.log(2) / 1.1;
    plot(ctx, (u) => Math.exp(-lam * u * 8), box, Math.min(1, T / 8), C.green, 2);
    dot(ctx, box.x + Math.min(1, T / 8) * box.w, box.y + box.h - (alive / (cols * rows)) * box.h, 4, "#E8EEFA");
  },

  refraction(ctx, w, h, t) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const oy = h * 0.5;
    ctx.fillStyle = "rgba(34, 228, 217, 0.07)";
    ctx.fillRect(0, oy, w, h - oy);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    line(ctx, 0, oy, w, oy);
    const ox = w * 0.5;
    dashed(ctx, ox, h * 0.04, ox, h * 0.96, "rgba(140, 156, 192, 0.4)");
    const th1 = ((22 + 28 * (0.5 + 0.5 * Math.sin(t * 0.7))) * Math.PI) / 180;
    const th2 = Math.asin(Math.sin(th1) / 1.5);
    const R = Math.min(w, h) * 0.46;
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.teal;
    glow(ctx, C.teal, 14);
    line(ctx, ox - R * Math.sin(th1), oy - R * Math.cos(th1), ox, oy);
    ctx.strokeStyle = C.green;
    glow(ctx, C.green, 14);
    line(ctx, ox, oy, ox + R * Math.sin(th2), oy + R * Math.cos(th2));
    noGlow(ctx);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(155, 123, 255, 0.6)";
    line(ctx, ox, oy, ox + R * 0.8 * Math.sin(th1), oy - R * 0.8 * Math.cos(th1));
    dot(ctx, ox, oy, 3.5, "#E8EEFA");
    ctx.fillStyle = C.muted;
    ctx.font = "600 11px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText("n₁ = 1,00", 10, 18);
    ctx.fillText("n₂ = 1,50", 10, h - 10);
  },

  daniell(ctx, w, h, t) {
    gridBg(ctx, w, h);
    const bw = w * 0.28;
    const top = h * 0.5;
    const bot = h * 0.9;
    const lx = w * 0.1;
    const rx = w * 0.62;
    const beaker = (x: number, tint: string) => {
      ctx.fillStyle = tint;
      ctx.fillRect(x, top + (bot - top) * 0.25, bw, (bot - top) * 0.75);
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bot);
      ctx.lineTo(x + bw, bot);
      ctx.lineTo(x + bw, top);
      ctx.stroke();
    };
    beaker(lx, "rgba(155, 123, 255, 0.16)");
    beaker(rx, "rgba(34, 228, 217, 0.2)");
    const zx = lx + bw / 2;
    const cx = rx + bw / 2;
    const wireY = h * 0.16;
    ctx.lineCap = "round";
    ctx.lineWidth = 7;
    ctx.strokeStyle = C.muted;
    line(ctx, zx, h * 0.34, zx, bot - 10);
    ctx.strokeStyle = C.amber;
    line(ctx, cx, h * 0.34, cx, bot - 10);
    ctx.lineCap = "butt";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#C8D6F5";
    line(ctx, zx, h * 0.34, zx, wireY);
    line(ctx, zx, wireY, cx, wireY);
    line(ctx, cx, wireY, cx, h * 0.34);
    for (let k = 0; k < 4; k++) {
      const s = (t * 0.32 + k / 4) % 1;
      dot(ctx, zx + s * (cx - zx), wireY, 3.5, C.teal);
    }
    const vx = (zx + cx) / 2;
    ctx.fillStyle = C.bg;
    ctx.strokeStyle = C.green;
    glow(ctx, C.green, 10);
    ctx.fillRect(vx - 30, wireY - 12, 60, 24);
    ctx.strokeRect(vx - 30, wireY - 12, 60, 24);
    noGlow(ctx);
    ctx.fillStyle = C.green;
    ctx.font = "700 12px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.fillText("1.10 V", vx, wireY + 4);
    ctx.textAlign = "start";
  },
};

/* Onde EM vue en perspective cavalière : E vertical, B projeté en oblique ;
   à droite de l’interface (indice 1,5) la longueur d’onde est divisée par 1,5. */
function drawEmWave(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  gridBg(ctx, w, h);
  const mid = h * 0.52;
  const ix = w * 0.52;
  const n = 1.5;
  const A = h * 0.26;
  const L0 = w * 0.24;
  const k0 = (2 * Math.PI) / L0;
  const omega = k0 * w * 0.11;
  ctx.fillStyle = "rgba(34, 228, 217, 0.07)";
  ctx.fillRect(ix, 0, w - ix, h);
  dashed(ctx, ix, h * 0.08, ix, h * 0.92, "rgba(34, 228, 217, 0.45)");
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  line(ctx, w * 0.04, mid, w * 0.96, mid);
  const field = (x: number) => {
    const fade = Math.min(1, (x - w * 0.04) / (w * 0.06), (w * 0.96 - x) / (w * 0.06));
    const ph = (x < ix ? k0 : n * k0) * (x - ix) - omega * t;
    return A * Math.max(0, fade) * Math.sin(ph);
  };
  const bx = (x: number, v: number) => x + 0.42 * v;
  const by = (v: number) => mid - 0.3 * v;
  for (let x = w * 0.05; x < w * 0.95; x += w / 46) {
    const v = field(x);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(155, 123, 255, 0.45)";
    line(ctx, x, mid, bx(x, v * 0.8), by(v * 0.8));
    ctx.strokeStyle = "rgba(34, 228, 217, 0.5)";
    line(ctx, x, mid, x, mid - v);
  }
  const curve = (color: string, px: (x: number, v: number) => number, py: (v: number) => number, k: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    glow(ctx, color, 12);
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = w * 0.04 + (w * 0.92 * i) / 200;
      const v = field(x) * k;
      if (i === 0) ctx.moveTo(px(x, v), py(v));
      else ctx.lineTo(px(x, v), py(v));
    }
    ctx.stroke();
    noGlow(ctx);
  };
  curve(C.violet, bx, by, 0.8);
  curve(C.teal, (x) => x, (v) => mid - v, 1);
  ctx.font = "700 12px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillStyle = C.teal;
  ctx.fillText("E", w * 0.05, mid - A - 4);
  ctx.fillStyle = C.violet;
  ctx.fillText("B", w * 0.05 + 0.42 * A * 0.8 + 6, mid - 0.3 * A * 0.8 + 4);
  ctx.fillStyle = C.muted;
  ctx.font = "600 10px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("vide", w * 0.06, h - 10);
  ctx.fillText("n = 1,5", ix + 8, h - 10);
}

export default function SimPreview({ kind, animate }: { kind: PreviewKind; animate: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const start = performance.now() - seeded(kind.length) * 3000;
    let w = 0;
    let h = 0;
    const render = (t: number) => {
      if (!w || !h) return;
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      DRAW[kind](ctx, w, h, t);
      ctx.restore();
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(2.2);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let unregister: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && animate && !unregister) {
          unregister = register(() => render((performance.now() - start) / 1000));
        } else if ((!entry.isIntersecting || !animate) && unregister) {
          unregister();
          unregister = null;
        }
      },
      { rootMargin: "80px" }
    );
    io.observe(canvas);

    return () => {
      ro.disconnect();
      io.disconnect();
      unregister?.();
    };
  }, [kind, animate]);

  return <canvas ref={ref} aria-hidden="true" className="block h-full w-full" />;
}
