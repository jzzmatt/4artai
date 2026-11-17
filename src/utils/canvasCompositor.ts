import type { FrameFinish, QuadreExportInput } from "../types";

const CANVAS_WIDTH = 3600;
const MARGIN_X = 180;
const MARGIN_Y = 150;

const GAPS = {
  tight: 40,
  gallery: 88,
  wide: 180,
} as const;

const FRAME_COLORS: Record<FrameFinish, string | null> = {
  "gallery-white": "#ffffff",
  "matte-black": "#18181B",
  "natural-oak": "#C19A6B",
  frameless: null,
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load an image for export."));
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawWall(ctx: CanvasRenderingContext2D, width: number, height: number, livingRoom: boolean) {
  ctx.fillStyle = "#F5F4F0";
  ctx.fillRect(0, 0, width, height);
  if (!livingRoom) return;

  ctx.fillStyle = "#f7f1e4";
  ctx.fillRect(width * 0.72, height * 0.08, width * 0.16, height * 0.16);
  ctx.strokeStyle = "#d9d0c2";
  ctx.lineWidth = 8;
  ctx.strokeRect(width * 0.72, height * 0.08, width * 0.16, height * 0.16);

  const light = ctx.createRadialGradient(width * 0.8, height * 0.1, 20, width * 0.8, height * 0.12, width * 0.28);
  light.addColorStop(0, "rgba(255, 248, 234, 0.9)");
  light.addColorStop(1, "rgba(255, 248, 234, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  const floorTop = height * 0.88;
  ctx.fillStyle = "#6a5140";
  roundedRect(ctx, width * 0.06, floorTop - 90, width * 0.28, 96, 24);
  ctx.fill();
  ctx.fillStyle = "#574333";
  roundedRect(ctx, width * 0.08, floorTop - 130, width * 0.24, 58, 18);
  ctx.fill();

  ctx.fillStyle = "#f7f4ee";
  ctx.fillRect(0, floorTop - 16, width, 16);
  const floor = ctx.createLinearGradient(0, floorTop, 0, height);
  floor.addColorStop(0, "#e4c49a");
  floor.addColorStop(1, "#8a5e38");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorTop, width, height - floorTop);
}

function drawEmptyArt(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = "#f5f4f0";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(196, 199, 199, 0.7)";
  ctx.lineWidth = 4;
  const mark = 28;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 24 + mark);
  ctx.lineTo(x + 24, y + 24);
  ctx.lineTo(x + 24 + mark, y + 24);
  ctx.moveTo(x + width - 24 - mark, y + 24);
  ctx.lineTo(x + width - 24, y + 24);
  ctx.lineTo(x + width - 24, y + 24 + mark);
  ctx.moveTo(x + 24, y + height - 24 - mark);
  ctx.lineTo(x + 24, y + height - 24);
  ctx.lineTo(x + 24 + mark, y + height - 24);
  ctx.moveTo(x + width - 24 - mark, y + height - 24);
  ctx.lineTo(x + width - 24, y + height - 24);
  ctx.lineTo(x + width - 24, y + height - 24 - mark);
  ctx.stroke();
  ctx.fillStyle = "#1b1c1a";
  ctx.font = "600 42px 'Plus Jakarta Sans', Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Awaiting Subject", x + width / 2, y + height / 2);
}

export async function renderQuadre(input: QuadreExportInput) {
  const gap = GAPS[input.spacing];
  const frame = input.frameFinish === "frameless" ? 0 : 64;
  const mat = input.museumMat ? 72 : 0;
  const outer = (CANVAS_WIDTH - MARGIN_X * 2 - gap * 2) / 3;
  const artW = outer - frame * 2 - mat * 2;
  const artH = artW * (4 / 3);
  const outerH = artH + frame * 2 + mat * 2;
  const height = Math.round(MARGIN_Y + outerH + 110 + MARGIN_Y);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  drawWall(ctx, CANVAS_WIDTH, height, input.wallPreview);

  const sources = [input.originalUrl, input.fusionUrl, input.styleUrl];
  const images = await Promise.all(
    sources.map(async (src) => {
      if (!src) return null;
      try {
        return await loadImage(src);
      } catch {
        return null;
      }
    }),
  );

  const frameColor = FRAME_COLORS[input.frameFinish];
  images.forEach((image, index) => {
    const x = MARGIN_X + index * (outer + gap);
    const y = MARGIN_Y;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = input.frameFinish === "frameless" ? 28 : 46;
    ctx.shadowOffsetY = 22;
    roundedRect(ctx, x, y, outer, outerH, input.frameFinish === "frameless" ? 8 : 18);
    ctx.fillStyle = frameColor ?? "rgba(0,0,0,0)";
    ctx.fill();
    ctx.restore();

    const artX = x + frame + mat;
    const artY = y + frame + mat;
    if (input.museumMat) {
      ctx.fillStyle = "#f5f4f0";
      ctx.fillRect(x + frame, y + frame, outer - frame * 2, outerH - frame * 2);
    }

    ctx.save();
    roundedRect(ctx, artX, artY, artW, artH, 8);
    ctx.clip();
    if (image) drawCover(ctx, image, artX, artY, artW, artH);
    else drawEmptyArt(ctx, artX, artY, artW, artH);
    ctx.restore();

    ctx.fillStyle = "#1b1c1a";
    ctx.font = "500 28px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(input.captions[index].toUpperCase(), x + outer / 2, y + outerH + 58);
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the PNG.");
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
