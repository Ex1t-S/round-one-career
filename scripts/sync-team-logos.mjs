import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TEAMS_FILE = path.join(ROOT, 'src', 'data', 'teams.ts');
const ASSET_DIR = path.join(ROOT, 'assets', 'team-logos');
const MANIFEST_FILE = path.join(ASSET_DIR, 'manifest.json');
const CATALOG_FILE = path.join(ROOT, 'src', 'data', 'team-logo-assets.ts');
const API = 'https://liquipedia.net/commons/api.php';
const USER_AGENT = 'ROUND-ONE-Career/3.0 (https://github.com/Ex1t-S/round-one-career)';

const aliases = {
  Spirit: ['Team Spirit'],
  Falcons: ['Falcons Esports'],
  Vitality: ['Team Vitality'],
  Liquid: ['Team Liquid'],
  FUT: ['FUT Esports'],
  FaZe: ['FaZe Clan'],
  B8: ['B8 E-SPORTS'],
  M80: ['M80 2023'],
  NRG: ['NRG 2024'],
  MIBR: ['MIBR 2018'],
  Imperial: ['Imperial Esports'],
  FOKUS: ['FOKUS CLAN'],
  'NAVI Junior': ['Natus Vincere Junior'],
  'MOUZ NXT': ['MOUZ'],
  'Young Ninjas': ['Ninjas in Pyjamas'],
  'MIBR Academy': ['MIBR 2018'],
  'MIBR fe': ['MIBR 2018'],
  'Sashi Academy': ['Sashi'],
  'SAW Youngsters': ['SAW'],
  'Gaimin Gladiators': ['Gaimin Gladiators Esports'],
};

const parentMarks = {
  'g2-ares': 'g2',
  'young-ninjas': 'ninjas-in-pyjamas',
  'inner-circle-academy': 'inner-circle',
  'sashi-academy': 'sashi',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const canonical = (value) => value
  .replace(/^File:/i, '')
  .replace(/\.(png|webp)$/i, '')
  .replace(/\b(allmode|full|logo|20\d\d)\b/gi, '')
  .replace(/\b(team|esports|gaming|club)\b/gi, '')
  .replace(/[^a-z0-9]+/gi, '')
  .toLowerCase();

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[b.length];
}

async function api(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ action: 'query', format: 'json', ...params }).toString();
  const response = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Liquipedia API ${response.status}: ${await response.text()}`);
  return response.json();
}

function candidatesFor(name) {
  const bases = [name, ...(aliases[name] ?? []), `Team ${name}`, `${name} Esports`, `${name} Gaming`];
  const modes = ['allmode', 'darkmode', 'lightmode', 'std', 'full allmode', 'full darkmode', 'full lightmode'];
  return [...new Set(bases.flatMap((base) => modes.map((mode) => `File:${base} ${mode}.png`)))];
}

function imageFromPage(page) {
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl && !info?.url) return undefined;
  return {
    sourceTitle: page.title,
    sourcePage: info.descriptionurl,
    downloadUrl: info.thumburl ?? info.url,
    width: info.thumbwidth,
    height: info.thumbheight,
  };
}

async function resolveExact(teams) {
  const resolved = new Map();
  for (let offset = 0; offset < teams.length; offset += 1) {
    const chunk = teams.slice(offset, offset + 1);
    const candidates = chunk.flatMap((team) => candidatesFor(team.name));
    const data = await api({
      prop: 'imageinfo', iiprop: 'url', iiurlwidth: '256', redirects: '1', titles: candidates.join('|'),
    });
    const pages = Object.values(data.query?.pages ?? {});
    for (const team of chunk) {
      const ordered = candidatesFor(team.name);
      const page = ordered
        .map((title) => pages.find((candidate) => candidate.title.toLowerCase() === title.toLowerCase()))
        .find((candidate) => imageFromPage(candidate));
      const image = imageFromPage(page);
      if (image) resolved.set(team.id, image);
    }
    if ((offset + chunk.length) % 10 === 0) console.log(`Checked exact names ${offset + chunk.length}/${teams.length}`);
    await sleep(500);
  }
  return resolved;
}

async function resolveSearch(team) {
  if (team.name.startsWith('ex-') || team.name.length < 4 || ['Bulgaria', 'Poland', 'Just Players'].includes(team.name)) return undefined;
  const query = `intitle:\"${team.name.replaceAll('"', '')}\"`;
  const data = await api({
    generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '10',
    prop: 'imageinfo', iiprop: 'url', iiurlwidth: '256',
  });
  const target = canonical(team.name);
  const candidates = Object.values(data.query?.pages ?? {})
    .filter((page) => /\b(allmode|darkmode|lightmode|std)\b/i.test(page.title) && !/\b(wordmark|old)\b/i.test(page.title))
    .map((page) => ({
      page,
      distance: levenshtein(target, canonical(page.title)),
      mode: (/full/i.test(page.title) ? 4 : 0) + (/allmode/i.test(page.title) ? 0 : /darkmode/i.test(page.title) ? 1 : /lightmode/i.test(page.title) ? 2 : 3),
    }))
    .sort((a, b) => a.distance - b.distance || a.mode - b.mode);
  const best = candidates[0];
  if (!best || best.distance > Math.max(2, Math.floor(target.length * 0.32))) return undefined;
  return imageFromPage(best.page);
}

async function downloadLogo(team, image) {
  const file = `${team.id}.png`;
  const response = await fetch(image.downloadUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.startsWith('image/')) throw new Error(`Asset ${response.status} ${contentType}: ${team.name}`);
  await writeFile(path.join(ASSET_DIR, file), Buffer.from(await response.arrayBuffer()));
  return file;
}

const source = await readFile(TEAMS_FILE, 'utf8');
const rows = [...source.matchAll(/^(\d+)\|(\d+)\|([^|\r\n]+)\|/gm)];
const teams = [...new Map(rows.map((match) => [match[3], { id: slugify(match[3]), name: match[3] }])).values()];
await mkdir(ASSET_DIR, { recursive: true });

let previous = { teams: [] };
try { previous = JSON.parse(await readFile(MANIFEST_FILE, 'utf8')); } catch {}
const previousById = new Map(previous.teams.filter((entry) => entry.file).map((entry) => [entry.id, entry]));
for (const [childId, parentId] of Object.entries(parentMarks)) {
  const parent = previousById.get(parentId);
  if (parent && !previousById.has(childId)) previousById.set(childId, { ...parent, id: childId, inheritedFrom: parentId });
}
const unresolvedInitial = teams.filter((team) => !previousById.has(team.id));
const resolved = new Map(previousById);
const exact = await resolveExact(unresolvedInitial);
for (const [id, image] of exact) resolved.set(id, image);
const unresolved = teams.filter((team) => !resolved.has(team.id));
for (const [index, team] of unresolved.entries()) {
  try {
    const image = await resolveSearch(team);
    if (image) resolved.set(team.id, image);
  } catch (error) {
    console.warn(`Search failed for ${team.name}: ${error.message}`);
  }
  if ((index + 1) % 10 === 0) console.log(`Searched ${index + 1}/${unresolved.length} unresolved teams`);
  await sleep(1100);
}

const manifest = [];
for (const team of teams) {
  const image = resolved.get(team.id);
  if (!image) {
    manifest.push({ id: team.id, name: team.name, status: team.name.startsWith('ex-') ? 'former-roster' : 'unverified' });
    continue;
  }
  try {
    const file = image.file ?? await downloadLogo(team, image);
    manifest.push({ ...image, id: team.id, name: team.name, status: image.inheritedFrom ? 'official-parent-mark' : 'official-mark', file });
  } catch (error) {
    console.warn(error.message);
    manifest.push({ id: team.id, name: team.name, status: 'download-failed', ...image });
  }
}

await writeFile(MANIFEST_FILE, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'Liquipedia Commons team logo repository',
  sourceGuide: 'https://liquipedia.net/commons/File_Standards_Guide',
  trademarkNotice: 'Team names and marks remain the property of their respective organizations.',
  teams: manifest,
}, null, 2)}\n`);

const imports = manifest
  .filter((entry) => entry.file)
  .map((entry) => `  '${entry.id}': require('../../assets/team-logos/${entry.file}'),`)
  .join('\n');
await writeFile(CATALOG_FILE, `import type { ImageSource } from 'expo-image';\n\n` +
  `/** Generated by scripts/sync-team-logos.mjs. Keep paths static for Metro bundling. */\n` +
  `export const TEAM_LOGO_ASSETS: Readonly<Record<string, ImageSource>> = {\n${imports}\n};\n`);

console.log(`Downloaded ${manifest.filter((entry) => entry.file).length}/${teams.length} verified team marks.`);
console.log(`Fallback required for ${manifest.filter((entry) => !entry.file).length} teams.`);
