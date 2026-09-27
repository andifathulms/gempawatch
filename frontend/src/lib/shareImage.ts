/**
 * The portrait share image (1080×1350, 4:5) — sized for WhatsApp Status and
 * Instagram, which is how most people meet a result: as a picture forwarded
 * in a group, not a link.
 *
 * Drawn in the browser rather than prebuilt: a point result exists only
 * client-side on the static build, so there is no server to render it. Same
 * rules as the OG card and the on-page share card — the finding first, every
 * figure labelled, and the "historical pattern, not a prediction" line plus
 * the sources inside the image, where a forward cannot drop them.
 *
 * Always Kertas (light): it is viewed inside other apps whose theme we cannot
 * know, and light paper survives recompression best. Canvas cannot read CSS
 * variables, so the palette is hex, mirroring tokens.css.
 */
import { DEPTH_HEX, depthBand, riskTierHex, riskTierLabel } from "./seismic";
import { magnitudeToUnitHeight, type SeismogramEvent } from "./seismogram";
import type { RiskTier } from "./types";

export interface ShareImageData {
  place: string;
  /** Line under the place: region type and province, or the coordinates. */
  kicker: string;
  score: number;
  tier: RiskTier | null;
  /** e.g. "Lebih aktif dari 98% dari 52 wilayah terskor." */
  percentile?: string;
  stats: Array<{ value: string; label: string }>;
  /** The record drawn across the card; omitted if it could not be loaded. */
  timeline?: { name: string; events: SeismogramEvent[] };
  coverage?: string;
}

const W = 1080;
const H = 1350;
const PAD = 80;
const C = {
  paper: "#F5F6F3",
  grid: "#E3E7E1",
  rule: "#D5DAD3",
  ink: "#15181B",
  ink2: "#474F57",
  ink3: "#626B73",
  epicentre: "#C23A2E",
};
const TIER_BG: Record<string, string> = { HIGH: "#FBE9E6", MODERATE: "#FBF1DC", LOW: "#E3F2EA" };

function siteLabel(): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${origin}${base}`.replace(/^https?:\/\//, "");
}

/** Wrap text to a width; returns the lines (at most maxLines, last one ellipsised). */
function wrap(g: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width <= width || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (g.measureText(`${last}…`).width > width && last.length > 1) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function drawMark(g: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size / 98;
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = C.ink;
  g.lineWidth = 4;
  g.globalAlpha = 0.22;
  g.beginPath();
  g.arc(49, 49, 44, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 0.42;
  g.beginPath();
  g.arc(49, 49, 30, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 1;
  g.lineWidth = 6;
  g.beginPath();
  [8, 49, 24, 49, 30, 32, 38, 66, 46, 20, 54, 78, 62, 49, 90, 49].forEach((v, i, a) => {
    if (i % 2) return;
    if (i === 0) g.moveTo(v, a[i + 1]);
    else g.lineTo(v, a[i + 1]);
  });
  g.stroke();
  g.fillStyle = C.epicentre;
  g.beginPath();
  g.arc(49, 49, 8, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export async function renderShareImage(d: ShareImageData): Promise<Blob> {
  // The page's own faces (next/font gives them hashed family names).
  const sans = getComputedStyle(document.body).fontFamily;
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
  await Promise.all([
    document.fonts.load(`800 80px ${sans}`),
    document.fonts.load(`600 30px ${sans}`),
    document.fonts.load(`400 30px ${sans}`),
    document.fonts.load(`400 22px ${mono}`),
  ]).catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("Canvas tidak tersedia di peramban ini.");
  const font = (weight: number, size: number, family = sans) => `${weight} ${size}px ${family}`;
  const spacing = (px: number) => {
    // letterSpacing is recent (Chrome 99, Safari 17); older engines just skip it.
    (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`;
  };

  // Paper with the seismograph grid.
  g.fillStyle = C.paper;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = C.grid;
  g.lineWidth = 1;
  for (let x = 0; x <= W; x += 36) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, H);
    g.stroke();
  }
  for (let y = 0; y <= H; y += 36) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(W, y + 0.5);
    g.stroke();
  }

  let y = PAD;
  drawMark(g, PAD, y, 56);
  g.fillStyle = C.ink3;
  g.font = font(700, 26);
  spacing(4);
  g.textBaseline = "middle";
  g.fillText("GEMPAWATCH · CEK RISIKO", PAD + 76, y + 29);
  spacing(0);
  g.textBaseline = "alphabetic";

  // Place.
  y += 150;
  g.fillStyle = C.ink;
  g.font = font(800, 84);
  spacing(-2);
  const placeLines = wrap(g, d.place, W - PAD * 2, 2);
  for (const line of placeLines) {
    g.fillText(line, PAD, y);
    y += 88;
  }
  spacing(0);
  g.fillStyle = C.ink3;
  g.font = font(400, 30);
  g.fillText(d.kicker, PAD, y - 30);

  // Score + tier.
  y += 250;
  const tierColor = riskTierHex(d.tier);
  g.fillStyle = tierColor;
  g.font = font(800, 300);
  spacing(-14);
  const scoreText = String(Math.round(d.score));
  g.fillText(scoreText, PAD - 8, y);
  const scoreW = g.measureText(scoreText).width;
  spacing(0);
  g.fillStyle = C.ink3;
  g.font = font(600, 56);
  g.fillText("/100", PAD + scoreW + 8, y);

  const pillText = `Aktivitas ${riskTierLabel(d.tier).toLowerCase()}`;
  g.font = font(700, 32);
  const pw = g.measureText(pillText).width + 76;
  const px = Math.min(W - PAD - pw, PAD + scoreW + 190);
  const py = y - 150;
  g.fillStyle = TIER_BG[d.tier ?? ""] ?? "#ECEEEA";
  roundRect(g, px, py, pw, 64, 32);
  g.fill();
  g.fillStyle = tierColor;
  g.beginPath();
  g.arc(px + 34, py + 32, 8, 0, Math.PI * 2);
  g.fill();
  g.textBaseline = "middle";
  g.fillText(pillText, px + 54, py + 33);
  g.textBaseline = "alphabetic";

  if (d.percentile) {
    y += 70;
    g.fillStyle = C.ink2;
    g.font = font(400, 34);
    for (const line of wrap(g, d.percentile, W - PAD * 2, 2)) {
      g.fillText(line, PAD, y);
      y += 44;
    }
  } else {
    y += 40;
  }

  // The record.
  if (d.timeline && d.timeline.events.length) {
    const top = y + 30;
    // A two-line place name costs the record its height, not the footer.
    const plotH = placeLines.length > 1 ? 110 : 190;
    const base = top + 40 + plotH;
    g.fillStyle = C.ink3;
    g.font = font(700, 24);
    spacing(3);
    g.fillText(`REKAMAN 1970–KINI · ${d.timeline.name.toUpperCase()}`, PAD, top + 20);
    spacing(0);
    const t0 = Date.UTC(1970, 0, 1);
    const t1 = Date.now();
    const plotW = W - PAD * 2;
    const events = [...d.timeline.events].sort((a, b) => a.magnitude - b.magnitude);
    g.lineCap = "round";
    for (const e of events) {
      const t = new Date(e.event_time).getTime();
      if (t < t0) continue;
      const x = PAD + ((t - t0) / (t1 - t0)) * plotW;
      g.strokeStyle = DEPTH_HEX[depthBand(e.depth_km)];
      g.lineWidth = e.magnitude >= 6 ? 4 : 2.5;
      g.globalAlpha = e.magnitude >= 5 ? 1 : 0.6;
      g.beginPath();
      g.moveTo(x, base);
      g.lineTo(x, base - Math.max(3, magnitudeToUnitHeight(e.magnitude) * plotH));
      g.stroke();
    }
    g.globalAlpha = 1;
    g.strokeStyle = C.rule;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(PAD, base + 1);
    g.lineTo(W - PAD, base + 1);
    g.stroke();
    g.fillStyle = C.ink3;
    g.font = font(400, 22, mono);
    g.fillText("1970", PAD, base + 34);
    g.textAlign = "right";
    g.fillText("kini", W - PAD, base + 34);
    g.textAlign = "left";
    y = base + 60;
  }

  // Two figures.
  y += 40;
  const colW = (W - PAD * 2) / 2;
  d.stats.slice(0, 2).forEach((s, i) => {
    const x = PAD + i * colW;
    g.fillStyle = C.ink;
    g.font = font(800, 64);
    g.fillText(s.value, x, y + 56);
    g.fillStyle = C.ink2;
    g.font = font(400, 28);
    g.fillText(s.label, x, y + 100);
  });

  // Footer: the framing and the sources travel with the picture.
  const fy = H - PAD - 96;
  g.strokeStyle = C.rule;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(PAD, fy);
  g.lineTo(W - PAD, fy);
  g.stroke();
  g.fillStyle = C.ink2;
  g.font = font(400, 26);
  g.fillText("Pola historis, bukan prediksi. Peringatan resmi: BMKG.", PAD, fy + 44);
  g.fillStyle = C.ink3;
  g.fillText(`Sumber: BMKG · USGS${d.coverage ? ` · ${d.coverage}` : ""}`, PAD, fy + 84);
  g.fillStyle = C.ink;
  g.font = font(700, 26);
  g.textAlign = "right";
  g.fillText(siteLabel(), W - PAD, fy + 84);
  g.textAlign = "left";

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar."))), "image/png"),
  );
}
