import { money } from "./calc";

/** Draws a 1080x1350 progress picture (hero photo, total saved, rank) and returns it as a PNG. */
export async function makeShareCard(opts: { photo: string; saved: number; rank: string; line: string }): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("no canvas");
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("photo failed"));
    i.src = opts.photo;
  });
  // cover-fit the photo
  const s = Math.max(W / img.width, H / img.height);
  g.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
  const grad = g.createLinearGradient(0, H * 0.35, 0, H);
  grad.addColorStop(0, "rgba(6,10,18,0)");
  grad.addColorStop(1, "rgba(6,10,18,0.92)");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  if (document.fonts?.ready) await document.fonts.ready;
  g.fillStyle = "#8ddef2";
  g.font = '500 34px "JetBrains Mono", monospace';
  g.fillText("SUMMIT MONEY · WHITEFISH, MONTANA", 72, 1020);
  g.fillStyle = "#9fe870";
  g.font = '700 230px "Barlow Condensed", sans-serif';
  g.fillText(money(opts.saved), 66, 1210);
  g.fillStyle = "#f1f6fb";
  g.font = '600 52px "Barlow Condensed", sans-serif';
  g.fillText(`${opts.rank.toUpperCase()}  ·  ${opts.line}`, 72, 1280);
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("png failed"))), "image/png"));
}

/** Share with the phone's share sheet when it can take a file, otherwise save the PNG. */
export async function shareProgress(blob: Blob, name: string) {
  const file = new File([blob], name, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: "My savings" });
    return "shared";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  return "saved";
}
