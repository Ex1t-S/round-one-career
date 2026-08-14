import assert from 'node:assert/strict';
import { spawn, spawnSync, ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { getCareerEvent } from '../src/data/events';
import { TEAMS } from '../src/data/teams';
import { prepareMajorMatch } from '../src/engine/major';
import { advanceWeek, applyDecision, completeOffseason, createCareer, evaluateCareerEnding, resolvePendingMatch } from '../src/engine/season';
import { CareerState, PlayerIdentity } from '../src/types/game';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE_URL = 'http://127.0.0.1:8087';
const STORAGE_KEY = '@round-one/career-v4';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.join(ROOT, 'docs', 'qa-screenshots');
const identity: PlayerIdentity = { fullName: 'Beta QA', nickname: 'BETA', nationality: 'Argentina', region: 'Argentina', city: 'Buenos Aires', age: 17, primaryLanguage: 'Español', secondaryLanguages: ['Inglés'], handedness: 'Diestro', personality: 'Analítico', ambition: 84, riskTolerance: 58, priority: 'Títulos', role: 'Rifler', style: 'Mechanical' };
const routes = ['dashboard', 'calendar', 'tournament', 'match', 'performance', 'rankings', 'major-hub', 'team', 'roster', 'market', 'contract', 'training', 'health', 'legacy', 'finance', 'settings'];
const viewports = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const routeLabels: Record<string, string> = { dashboard: 'Inicio', calendar: 'Calendario', tournament: 'Torneos', match: 'Partidos', performance: 'Rendimiento', rankings: 'Ranking mundial', 'major-hub': 'Major', team: 'Equipo', roster: 'Roster', market: 'Mercado', contract: 'Contrato', training: 'Entrenamiento', health: 'Salud', legacy: 'Legado', finance: 'Finanzas', settings: 'Configuración' };

type Pending = { resolve: (value: unknown) => void; reject: (reason: unknown) => void };

class Cdp {
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private events = new Map<string, (() => void)[]>();

  constructor(private socket: WebSocket) {
    socket.onmessage = (message) => {
      const payload = JSON.parse(String(message.data));
      if (payload.id) {
        const pending = this.pending.get(payload.id);
        if (!pending) return;
        this.pending.delete(payload.id);
        if (payload.error) pending.reject(new Error(payload.error.message)); else pending.resolve(payload.result);
      } else if (payload.method) {
        const listeners = this.events.get(payload.method) ?? [];
        this.events.delete(payload.method);
        listeners.forEach((listener) => listener());
      }
    };
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}) {
    return new Promise<T>((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method: string) {
    return new Promise<void>((resolve) => this.events.set(method, [...(this.events.get(method) ?? []), resolve]));
  }
}

function wait(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForUrl(url: string, attempts = 120) {
  for (let index = 0; index < attempts; index += 1) {
    try { const response = await fetch(url); if (response.ok) return response; } catch { /* service still starting */ }
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function connect(url: string) {
  const socket = new WebSocket(url);
  await new Promise<void>((resolve, reject) => { socket.onopen = () => resolve(); socket.onerror = () => reject(new Error('CDP connection failed')); });
  return { socket, cdp: new Cdp(socket) };
}

function populatedCareer() {
  let state = createCareer(identity, TEAMS[70], 2026, 2026081301);
  state.settings.minigames = false;
  state.settings.minigameMode = 'auto';
  for (let guard = 0; guard < 500 && state.season < 3 && !state.finished; guard += 1) {
    if (state.pendingDecisionId) {
      const event = getCareerEvent(state.pendingDecisionId);
      assert.ok(event);
      state = applyDecision(state, event.choices[guard % event.choices.length]).state;
    } else if (state.pendingMatchId) state = resolvePendingMatch(state).state;
    else if (state.activeMajorId) state = prepareMajorMatch(state).state;
    else if (state.offseasonPending) { state.offseasonStep = 12; state = completeOffseason(state).state; }
    else state = advanceWeek(state).state;
  }
  return state;
}

async function main() {
  const smoke = process.argv.includes('--smoke');
  const checkedRoutes = smoke ? ['dashboard'] : routes;
  const checkedViewports = smoke ? [390, 1440] : viewports;
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'round-one-beta-qa-'));
  let server: Server | undefined;
  let edge: ChildProcess | undefined;
  let socket: WebSocket | undefined;
  try {
    const dist = path.join(ROOT, 'dist');
    server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(new URL(request.url ?? '/', BASE_URL).pathname);
        const requested = pathname === '/' ? 'index.html' : pathname.slice(1).includes('.') ? pathname.slice(1) : `${pathname.slice(1)}.html`;
        const file = path.resolve(dist, requested);
        if (!file.startsWith(dist)) throw new Error('Invalid path');
        const body = await readFile(file);
        const extension = path.extname(file);
        response.setHeader('Content-Type', extension === '.html' ? 'text/html; charset=utf-8' : extension === '.js' ? 'application/javascript' : extension === '.css' ? 'text/css' : extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'application/octet-stream');
        response.end(body);
      } catch { response.statusCode = 404; response.end('Not found'); }
    });
    await new Promise<void>((resolve) => server!.listen(8087, '127.0.0.1', resolve));
    edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9237', `--user-data-dir=${userDataDir}`, '--window-size=1440,1000', BASE_URL], { windowsHide: true, stdio: 'ignore' });
    const targets = await (await waitForUrl('http://127.0.0.1:9237/json/list')).json() as { type: string; webSocketDebuggerUrl: string }[];
    const target = targets.find((item) => item.type === 'page');
    assert.ok(target);
    const connection = await connect(target.webSocketDebuggerUrl);
    socket = connection.socket;
    const cdp = connection.cdp;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    async function evaluate<T>(expression: string) {
      const result = await cdp.send<{ result: { value: T } }>('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return result.result.value;
    }
    async function navigate(route: string, width: number, height = width < 769 ? 900 : 1000) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 769 });
      await cdp.send('Page.navigate', { url: `${BASE_URL}/game?view=dashboard` });
      await wait(700);
      if (route === 'dashboard') return;
      const mobile = width < 1024;
      const directLabel = routeLabels[route];
      const direct = await evaluate<boolean>(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.getAttribute('aria-label') === ${JSON.stringify(`Abrir ${directLabel}`)}); if (!button) return false; button.click(); return true; })()`);
      if (!direct && mobile) {
        const opened = await evaluate<boolean>(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.getAttribute('aria-label') === 'Abrir más secciones'); if (!button) return false; button.click(); return true; })()`);
        assert.ok(opened, `Mobile More must expose ${route}`);
        await wait(100);
        const selected = await evaluate<boolean>(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.getAttribute('aria-label') === ${JSON.stringify(`Abrir ${routeLabels[route]}`)}); if (!button) return false; button.click(); return true; })()`);
        assert.ok(selected, `Mobile route must be reachable: ${route}`);
      } else assert.ok(direct, `Route must be reachable: ${route}`);
      await wait(350);
    }
    async function setSave(state: CareerState) {
      await navigate('dashboard', 390);
      const serialized = JSON.stringify(state);
      await evaluate(`localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(serialized)}); true`);
      await navigate('dashboard', 390);
    }
    async function screenshot(name: string) {
      const capture = await cdp.send<{ data: string }>('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(path.join(SCREENSHOT_DIR, name), Buffer.from(capture.data, 'base64'));
    }
    async function pageHealth() {
      return evaluate<{ scrollWidth: number; innerWidth: number; badTokens: string[]; title: string }>(`(() => { const text = document.body?.innerText ?? ''; return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, badTokens: ['NaN','Infinity','undefined','La interfaz encontró un problema'].filter(token => text.includes(token)), title: document.title }; })()`);
    }

    const empty = createCareer(identity, TEAMS[120], 2026, 2026081301);
    await setSave(empty);
    const emptyStateFailures: string[] = [];
    for (const route of checkedRoutes) {
      await navigate(route, 390);
      const health = await pageHealth();
      if (health.badTokens.length) emptyStateFailures.push(`${route}: ${health.badTokens.join(',')}`);
    }

    const active = populatedCareer();
    await setSave(active);
    await cdp.send('Page.navigate', { url: `${BASE_URL}/statistics` });
    await wait(900);
    const legacyAlias = await evaluate<{ path: string; performance: boolean }>(`({ path: location.pathname + location.search, performance: document.body.innerText.includes('CENTRO DE RENDIMIENTO') })`);
    const overflow: string[] = [];
    const badValues: string[] = [];
    for (const width of checkedViewports) {
      for (const route of checkedRoutes) {
        await navigate(route, width);
        const health = await pageHealth();
        if (health.scrollWidth > health.innerWidth + 1) overflow.push(`${width}:${route}:${health.scrollWidth}>${health.innerWidth}`);
        if (health.badTokens.length) badValues.push(`${width}:${route}:${health.badTokens.join(',')}`);
      }
    }

    await navigate('dashboard', 1440); await screenshot('desktop-dashboard-1440.png');
    await navigate('performance', 1440); await screenshot('desktop-performance-1440.png');
    await navigate('rankings', 1440); await screenshot('desktop-ranking-1440.png');
    await navigate('dashboard', 390); await screenshot('mobile-dashboard-390.png');

    const mobileNav = await evaluate<{ labels: string[]; sidebarVisible: boolean }>(`(() => ({ labels: Array.from(document.querySelectorAll('[role="button"]')).map(el => el.getAttribute('aria-label')).filter(Boolean), sidebarVisible: document.body.innerText.includes('ORGANIZACIÓN ACTUAL') }))()`);
    const openedMore = await evaluate<boolean>(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.getAttribute('aria-label') === 'Abrir más secciones'); if (!button) return false; button.click(); return true; })()`);
    await wait(250);
    const moreVisible = await evaluate<boolean>(`document.body.innerText.includes('FINANZAS') && document.body.innerText.includes('ORGANIZACIÓN')`);
    await screenshot('mobile-more-390.png');
    const closedMore = await evaluate<boolean>(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.getAttribute('aria-label') === 'Cerrar navegación'); if (!button) return false; button.click(); return true; })()`);

    await navigate('calendar', 390);
    const calendarBefore = await evaluate<{ path: string; text: string }>(`({ path: location.pathname, text: (document.body?.innerText ?? '').slice(0, 180) })`);
    const openedCalendar = await evaluate<boolean>(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => (el.innerText || '').toLowerCase().includes('ver detalle')); if (!button) return false; button.click(); return true; })()`);
    await wait(150);
    const calendarDetailValid = await evaluate<boolean>(`document.body.innerText.toLowerCase().includes('detalle del evento') && document.body.innerText.toLowerCase().includes('elegibilidad')`);
    const calendarPath = await evaluate<string>('location.pathname + location.search');
    await evaluate(`(() => { const scrollable = Array.from(document.querySelectorAll('*')).filter(el => ['auto','scroll'].includes(getComputedStyle(el).overflowY)).sort((a,b) => b.scrollHeight - a.scrollHeight)[0]; if (scrollable) scrollable.scrollTop = scrollable.scrollHeight; return true; })()`);
    await wait(100);
    await screenshot('mobile-calendar-detail-390.png');

    await navigate('rankings', 1440);
    const topDetails: boolean[] = [];
    for (const index of [0, 49, 99]) {
      topDetails.push(await evaluate<boolean>(`(() => { const rows = Array.from(document.querySelectorAll('[aria-label^="Ver detalle de"]')); const row = rows[${index}]; if (!row) return false; row.click(); return true; })()`));
      await wait(120);
      topDetails.push(await evaluate<boolean>(`document.body.innerText.includes('DETALLE DEL JUGADOR') && !document.body.innerText.includes('undefined')`));
      await evaluate(`(() => { const button = Array.from(document.querySelectorAll('[role="button"]')).find(el => (el.innerText || '').trim() === 'Cerrar'); if (button) button.click(); return true; })()`);
      await wait(80);
    }

    const finished = structuredClone(active);
    finished.finished = true;
    finished.player.path = 'retired';
    finished.ending = evaluateCareerEnding(finished).ending;
    await setSave(finished);
    await navigate('dashboard', 390);
    const finishedSafe = await evaluate<boolean>(`document.body.innerText.includes('CARRERA FINALIZADA') && !document.body.innerText.includes('Continuar carrera')`);
    await navigate('legacy', 390);
    const finishedLegacySafe = (await pageHealth()).badTokens.length === 0;

    const report = { mode: smoke ? 'smoke' : 'full', viewports: checkedViewports, routes: checkedRoutes, checks: checkedViewports.length * checkedRoutes.length, overflow, badValues, emptyStateFailures, legacyAlias, mobileNavigation: { labels: mobileNav.labels, desktopSidebarOnMobile: mobileNav.sidebarVisible, openedMore, moreVisible, closedMore }, calendar: { before: calendarBefore, path: calendarPath, openedCalendar, detailValid: calendarDetailValid }, top100: { rank1: topDetails[0] && topDetails[1], rank50: topDetails[2] && topDetails[3], rank100: topDetails[4] && topDetails[5], userRanked: active.playerRankingHistory.at(-1)?.entries.some((entry) => entry.isUser) ?? false }, finishedCareer: { dashboardSafe: finishedSafe, legacySafe: finishedLegacySafe }, screenshots: ['desktop-dashboard-1440.png', 'desktop-performance-1440.png', 'desktop-ranking-1440.png', 'mobile-dashboard-390.png', 'mobile-more-390.png', 'mobile-calendar-detail-390.png'] };
    console.log(JSON.stringify(report, null, 2));
    assert.equal(overflow.length, 0, `Root overflow detected: ${overflow.join(', ')}`);
    assert.equal(badValues.length, 0, `Invalid UI values: ${badValues.join(', ')}`);
    assert.equal(emptyStateFailures.length, 0, `Invalid empty states: ${emptyStateFailures.join(', ')}`);
    assert.ok(legacyAlias.performance && (legacyAlias.path === '/statistics' || legacyAlias.path.includes('view=statistics')), 'Legacy statistics route must resolve to Performance Center');
    assert.ok(openedMore && moreVisible && closedMore, 'Mobile More navigation must open and close');
    assert.ok(openedCalendar && calendarDetailValid, 'Calendar detail must open with complete context');
    assert.ok(topDetails.every(Boolean), 'Top 1, 50 and 100 details must render');
    assert.ok(finishedSafe && finishedLegacySafe, 'Finished career must remain safely navigable');
  } finally {
    socket?.close();
    if (process.platform === 'win32') {
      if (edge?.pid) spawnSync('taskkill', ['/pid', String(edge.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
    } else edge?.kill();
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await wait(150);
    await rm(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
