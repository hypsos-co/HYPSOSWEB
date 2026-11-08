#!/usr/bin/env node
/**
 * HYPSOS colour audit — fails if any UI colour other than the three official ones appears in source.
 * Allowed: #090303, #B8DEF5, #E20A21 (any case, also as 0x… in three.js), rgb(var(--rgb-*) / a), transparent, currentColor, inherit.
 * Usage: npm run audit:colors
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname;
const ALLOWED_HEX = new Set(['090303', 'b8def5', 'e20a21']);
const EXT = new Set(['.css', '.astro', '.ts', '.mjs', '.js']);
const NAMED = /(?<![-\w])(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|fill|stroke|outline-color|box-shadow|text-shadow)\s*:\s*[^;{}]*\b(white|black|gray|grey|red|blue|green|yellow|orange|purple|pink|silver)\b/gi;
const HEX = /(?:#|0x)([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
const FUNC = /\b(rgba?|hsla?|oklch|lab|lch)\(\s*(?!var\(--rgb-)[0-9]/gi;
const IGNORE_LINE = /audit-ignore|data:image|url\(|&#|feColorMatrix|values='|\bnumOctaves\b/;

const findings = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'generated') walk(p); continue; }
    if (!EXT.has(extname(f))) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (IGNORE_LINE.test(line)) return;
      for (const m of line.matchAll(HEX)) {
        const v = m[1].toLowerCase();
        if (m[0].startsWith('0x') && v.length !== 6) continue;
        if (!ALLOWED_HEX.has(v) && !(v.length === 8 && ALLOWED_HEX.has(v.slice(0, 6)))) findings.push(`${p.replace(ROOT, 'src/')}:${i + 1}  ${m[0]}`);
      }
      for (const m of line.matchAll(FUNC)) findings.push(`${p.replace(ROOT, 'src/')}:${i + 1}  ${m[0]}…`);
      if (/\.(css|astro)$/.test(p)) for (const m of line.matchAll(NAMED)) findings.push(`${p.replace(ROOT, 'src/')}:${i + 1}  ${m[1]}`);
    });
  }
};
walk(ROOT);
if (findings.length) {
  console.error(`✗ ${findings.length} non-brand colour(s):\n` + findings.join('\n'));
  process.exit(1);
}
console.log('✓ Only #090303 · #B8DEF5 · #E20A21 (and their alphas) found in src/.');
