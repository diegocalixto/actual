#!/usr/bin/env node
// Renders the brand's raster icons from public/logo-df.svg (the DF monogram)
// with the Chromium that Playwright already installs for the e2e suite:
// favicon (PNG 16/32 and the .ico with 16/32/48), apple-touch-icon (180, opaque
// ink ground), android-chrome 192/512 (symbol on transparent), maskable 192/512
// (ink ground, symbol inside the safe circle) and mstile-150x150. Every output
// goes to public/ under the names index.html, site.webmanifest and
// browserconfig.xml already reference.
//
//   node packages/desktop-client/bin/brand-icons.mjs
//
// Nothing else is touched; run it again whenever logo-df.svg changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(here, '../public');
const SOURCE = path.join(PUBLIC, 'logo-df.svg');
/** The dark ground the mark was drawn on (same as BRAND_INK in the app). */
const INK = '#080C14';
const RATIO = 433 / 573;

const source = fs.readFileSync(SOURCE, 'utf8');
const inner = source
  .replace(/<\?xml[^>]*>/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')
  .trim();

/**
 * A square canvas with the symbol centered at `symbolWidth`, over `background`
 * or transparent.
 */
function compose({ size, symbolWidth, background }) {
  const w = symbolWidth;
  const h = w * RATIO;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const ground = background
    ? `<rect width="${size}" height="${size}" fill="${background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${ground}<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 573 433">${inner}</svg></svg>`;
}

/** ICO container holding PNG images (every current browser reads it). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, buffer } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buffer.length;
  }
  return Buffer.concat([header, ...entries, ...images.map(i => i.buffer)]);
}

const OUTPUTS = [
  // Favicons: the symbol fills the width; no ground, the tab provides one.
  { file: 'favicon-16x16.png', size: 16, symbolWidth: 16 },
  { file: 'favicon-32x32.png', size: 32, symbolWidth: 32 },
  // iPhone home screen: iOS rounds the corners itself and paints transparency
  // black, so the ground is opaque and the symbol keeps a 15% margin.
  {
    file: 'apple-touch-icon.png',
    size: 180,
    symbolWidth: 126,
    background: INK,
  },
  // "any" icons: the symbol alone, on whatever the launcher puts behind it.
  { file: 'android-chrome-192x192.png', size: 192, symbolWidth: 168 },
  { file: 'android-chrome-512x512.png', size: 512, symbolWidth: 448 },
  // Maskable: full-bleed ground; the symbol stays inside the safe circle
  // (80% of the side), which a 1.32:1 shape does at 62% of the width.
  {
    file: 'maskable-192x192.png',
    size: 192,
    symbolWidth: 119,
    background: INK,
  },
  {
    file: 'maskable-512x512.png',
    size: 512,
    symbolWidth: 317,
    background: INK,
  },
  // Windows tile: the tile color behind it comes from browserconfig.xml.
  { file: 'mstile-150x150.png', size: 150, symbolWidth: 90 },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  async function renderPng(spec) {
    await page.setViewportSize({ width: spec.size, height: spec.size });
    await page.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${compose(spec)}</body></html>`,
    );
    return page.screenshot({
      type: 'png',
      omitBackground: true,
      clip: { x: 0, y: 0, width: spec.size, height: spec.size },
    });
  }

  for (const spec of OUTPUTS) {
    const buffer = await renderPng(spec);
    fs.writeFileSync(path.join(PUBLIC, spec.file), buffer);
    process.stdout.write(
      `${spec.file}: ${spec.size}px, ${buffer.length} bytes\n`,
    );
  }
  const icoImages = [];
  for (const size of [16, 32, 48]) {
    icoImages.push({
      size,
      buffer: await renderPng({ size, symbolWidth: size }),
    });
  }
  const icoBuffer = ico(icoImages);
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), icoBuffer);
  process.stdout.write(`favicon.ico: 16/32/48, ${icoBuffer.length} bytes\n`);
} finally {
  await browser.close();
}
