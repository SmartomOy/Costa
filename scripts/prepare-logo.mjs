// Kertaluontoinen apuskripti: rajaa logon kuvakaappauksesta koiranpään,
// poistaa kermanvärisen taustan ja tekee OG-kuvan + ikonit.
// Käyttö: node scripts/prepare-logo.mjs <polku/logokuvaan.png>
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src) {
  console.error('Anna lähdekuva: node scripts/prepare-logo.mjs logo.png');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const CREAM = [246, 237, 228];

// Alueet alkuperäisessä 1320×2868-kuvakaappauksessa
const LOGO = { left: 0, top: 794, width: 1320, height: 1280 };
const DOG = { left: 354, top: 850, width: 734, height: 760 };

// Värin "irrotus" taustasta (GIMP:n color-to-alpha): palauttaa peittävyyden 0–1.
// darkOnly: huomioi vain taustaa tummemmat sävyt (vaalea JPEG-kohina ei jää haloksi)
function unmix(data, i, darkOnly = false) {
  let alpha = 0;
  for (let c = 0; c < 3; c++) {
    const p = data[i + c];
    const b = CREAM[c];
    const a = p > b ? (darkOnly ? 0 : (p - b) / (255 - b)) : (b - p) / b;
    if (a > alpha) alpha = a;
  }
  return alpha;
}

// Neliökernelinen dilataatio/eroosio binäärimaskille
function morph(mask, w, h, r, dilate) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1;
      for (let dy = -r; dy <= r && v === (dilate ? 0 : 1); dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          const m = yy < 0 || yy >= h || xx < 0 || xx >= w ? 0 : mask[yy * w + xx];
          if (dilate && m) { v = 1; break; }
          if (!dilate && !m) { v = 0; break; }
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

// Täyttää siluetin sisällä olevat aukot: kaikki mihin ei pääse reunoilta on sisällä
function fillHoles(mask, w, h) {
  const outside = new Uint8Array(mask.length);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (outside[i] || mask[i]) continue;
    outside[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < (h - 1) * w) stack.push(i + w);
  }
  return outside.map((o) => (o ? 0 : 1));
}

async function cutOut(region) {
  const { data, info } = await sharp(src)
    .extract(region)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;

  const solid = new Uint8Array(n);
  for (let k = 0; k < n; k++) solid[k] = unmix(data, k * 3, true) > 0.25 ? 1 : 0;
  const closed = morph(morph(solid, w, h, 2, true), w, h, 2, false);
  const silhouette = fillHoles(closed, w, h);
  const inner = morph(silhouette, w, h, 1, false);
  const band = morph(silhouette, w, h, 3, true);

  const out = Buffer.alloc(n * 4);
  for (let k = 0; k < n; k++) {
    const i = k * 3;
    const j = k * 4;
    if (inner[k]) {
      out[j] = data[i];
      out[j + 1] = data[i + 1];
      out[j + 2] = data[i + 2];
      out[j + 3] = 255;
    } else if (band[k]) {
      // reunat: pehmeä anti-aliasointi, kohina pois
      let alpha = unmix(data, i, true);
      alpha = alpha < 0.1 ? 0 : Math.min(1, (alpha - 0.1) / 0.9);
      for (let c = 0; c < 3; c++) {
        const p = data[i + c];
        const b = CREAM[c];
        out[j + c] = alpha > 0 ? Math.max(0, Math.min(255, Math.round((p - b) / alpha + b))) : 0;
      }
      out[j + 3] = Math.round(alpha * 255);
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } });
}

const dog = await cutOut(DOG);
const dogPng = await dog.png().toBuffer();
const trimmed = await sharp(dogPng).trim({ threshold: 1 }).png().toBuffer();
await sharp(trimmed).toFile(`${root}src/assets/logo-dog.png`);

const bg = { r: CREAM[0], g: CREAM[1], b: CREAM[2], alpha: 1 };

// OG-kuva 1200×630: koko logo kermapohjalla
const logo = await sharp(src).extract(LOGO).resize({ height: 600 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: bg } })
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(`${root}public/og-image.png`);

// Apple touch icon 180×180
const icon = await sharp(trimmed).resize({ width: 150, height: 150, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: bg } })
  .composite([{ input: icon, gravity: 'center' }])
  .png()
  .toFile(`${root}public/apple-touch-icon.png`);

console.log('Valmis: src/assets/logo-dog.png, public/og-image.png, public/apple-touch-icon.png');
