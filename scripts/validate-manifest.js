#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'rules', 'manifest.json');

function fail(msg) {
  console.error(`[validate-manifest] ERROR — ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[validate-manifest] ${msg}`);
}

function slugAnchor(heading) {
  // GitHub-style anchor: lowercase, kebab, strip non-alphanumerics+spaces+dashes
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractAnchorsFromMd(mdPath) {
  if (!fs.existsSync(mdPath)) return null;
  const content = fs.readFileSync(mdPath, 'utf-8');
  const anchors = new Set();
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^##\s+([a-z]-[a-z0-9-]+)/i);
    if (m) anchors.add(m[1]);
  }
  return anchors;
}

function loadImplementedPluginRules() {
  const distIndex = path.join(ROOT, 'eslint-plugin', 'dist', 'index.js');
  if (!fs.existsSync(distIndex)) {
    console.warn('[validate-manifest] eslint-plugin/dist/index.js not found — skipping implemented-rule check (run `npm --workspace eslint-plugin run build` first).');
    return null;
  }
  // CJS require — the plugin uses `export =`
  const plugin = require(distIndex);
  return new Set(Object.keys(plugin.rules || {}));
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  ok(`manifest version = ${manifest.version}, ${manifest.rules.length} rules registered`);

  const pluginRules = loadImplementedPluginRules();

  const seenIds = new Set();
  const mdCache = new Map();

  for (const rule of manifest.rules) {
    if (seenIds.has(rule.id)) fail(`duplicate rule id: ${rule.id}`);
    seenIds.add(rule.id);

    if (!/^ohc\/[chspax]-[a-z0-9-]+$/.test(rule.id)) {
      fail(`rule id format invalid: ${rule.id}`);
      continue;
    }

    const [mdRel, anchor] = (rule.doc || '').split('#');
    if (!mdRel || !anchor) {
      fail(`rule ${rule.id} doc field malformed: ${rule.doc}`);
      continue;
    }

    const mdPath = path.join(ROOT, mdRel);
    if (!mdCache.has(mdPath)) {
      const anchors = extractAnchorsFromMd(mdPath);
      if (anchors === null) {
        fail(`rule ${rule.id} doc file missing: ${mdRel}`);
        mdCache.set(mdPath, new Set());
        continue;
      }
      mdCache.set(mdPath, anchors);
    }
    const mdAnchors = mdCache.get(mdPath);
    if (!mdAnchors.has(anchor)) {
      fail(`rule ${rule.id} anchor ${anchor} not found in ${mdRel}`);
    }

    if (pluginRules && rule.implemented) {
      const ruleNameOnly = rule.id.replace(/^ohc\//, '');
      if (!pluginRules.has(ruleNameOnly)) {
        fail(`rule ${rule.id} marked implemented=true but missing from eslint plugin rule map`);
      }
    }
  }

  if (pluginRules) {
    const implementedInManifest = new Set(
      manifest.rules.filter((r) => r.implemented).map((r) => r.id.replace(/^ohc\//, '')),
    );
    for (const name of pluginRules) {
      if (!implementedInManifest.has(name)) {
        fail(`eslint plugin exports rule ${name} but manifest has no implemented=true entry for it`);
      }
    }
  }

  if (process.exitCode === 1) {
    console.error('[validate-manifest] FAIL — manifest <-> .md <-> plugin not consistent');
  } else {
    ok('PASS — manifest <-> .md <-> plugin consistent');
  }
}

main();
