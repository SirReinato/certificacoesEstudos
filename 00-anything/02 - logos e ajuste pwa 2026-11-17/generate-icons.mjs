import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve('public');
const baseSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

// Versão full-bleed (sem cantos transparentes) para Apple Touch Icon e Maskable
const maskableSvg = baseSvg
  .replace(
    '<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#sz-bg)"/>',
    '<rect x="0" y="0" width="512" height="512" fill="url(#sz-bg)"/>'
  )
  .replace(
    '<rect x="20" y="20" width="472" height="472" rx="108" stroke="#334d66" stroke-width="4" stroke-opacity="0.65"/>',
    ''
  )
  .replace(
    '<!-- SafeZone Shield -->',
    '<g transform="translate(256, 256) scale(0.74) translate(-256, -256)"><!-- SafeZone Shield -->'
  )
  .replace('</svg>', '</g></svg>');

const appleSvg = baseSvg
  .replace(
    '<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#sz-bg)"/>',
    '<rect x="0" y="0" width="512" height="512" fill="url(#sz-bg)"/>'
  )
  .replace(
    '<rect x="20" y="20" width="472" height="472" rx="108" stroke="#334d66" stroke-width="4" stroke-opacity="0.65"/>',
    ''
  );

const targets = [
  { name: 'favicon-32x32.png', size: 32, svg: baseSvg, omitBackground: true },
  { name: 'pwa-192x192.png', size: 192, svg: baseSvg, omitBackground: true },
  { name: 'pwa-512x512.png', size: 512, svg: baseSvg, omitBackground: true },
  { name: 'pwa-maskable-512x512.png', size: 512, svg: maskableSvg, omitBackground: false },
  { name: 'apple-touch-icon.png', size: 180, svg: appleSvg, omitBackground: false },
];

const browser = await chromium.launch();
try {
  for (const target of targets) {
    const page = await browser.newPage({
      viewport: { width: target.size, height: target.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(`
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;overflow:hidden;background:transparent;">
          <div style="width:${target.size}px;height:${target.size}px;">
            ${target.svg.replace('<svg ', `<svg width="${target.size}" height="${target.size}" `)}
          </div>
        </body>
      </html>
    `);
    await page.screenshot({
      path: path.join(publicDir, target.name),
      omitBackground: target.omitBackground,
    });
    await page.close();
    console.log(`Generated ${target.name} (${target.size}x${target.size})`);
  }
} finally {
  await browser.close();
}
