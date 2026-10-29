import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import process from 'node:process';

// Run against the production export, not Metro. Requires Chromium, ffmpeg, and internet.
const root = resolve('dist');
await readFile(join(root, 'index.html'));
const profile = await mkdtemp(join(tmpdir(), 'pumpky-web-check-'));
const video = join(profile, 'badge.y4m');
execFileSync('ffmpeg', ['-loglevel', 'error', '-loop', '1', '-i', 'assets/markers/pumpky-badge.png',
  '-vf', 'scale=288:360,pad=640:480:(ow-iw)/2:(oh-ih)/2:color=white',
  '-r', '15', '-t', '2', '-pix_fmt', 'yuv420p', '-f', 'yuv4mpegpipe', video]);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(process.env.PUMPKY_CHROMIUM || 'chromium', [
  '--headless', '--no-sandbox', '--no-first-run', '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
  '--use-file-for-fake-video-capture=' + video, '--remote-debugging-port=0',
  '--user-data-dir=' + profile, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
const errors = [];
try {
  const debugAddress = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chromium startup timed out.')), 15000);
    browser.once('error', (error) => { clearTimeout(timer); reject(error); });
    browser.stderr.on('data', (chunk) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(new URL(match[1]).origin.replace('ws:', 'http:')); }
    });
  });
  const target = await (await fetch(debugAddress + '/json/new?about:blank', { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let next = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const result = JSON.parse(data);
    if (result.method === 'Runtime.exceptionThrown') errors.push(result.params.exceptionDetails.text);
    if (!result.id) return;
    const entry = pending.get(result.id);
    clearTimeout(entry.timer);
    pending.delete(result.id);
    if (result.error) entry.reject(new Error(JSON.stringify(result.error)));
    else entry.resolve(result.result);
  });
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 20000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor(expression, timeout = 15000) {
    const until = Date.now() + timeout;
    do {
      if (await evaluate('!!(' + expression + ')')) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < until);
    throw new Error('Timed out waiting for: ' + expression + '\n' + await evaluate('document.body.innerText'));
  }
  const button = (label) => `[...document.querySelectorAll('[role="button"],button')].find(e => e.textContent === ${JSON.stringify(label)})`;
  async function waitForStart() {
    // Static HTML is visible before React hydrates. Wait for its actual click handler.
    await waitFor(`(() => { const e = ${button('Start camera')};
      return e && Object.keys(e).some(k => k.startsWith('__reactProps') && typeof e[k].onClick === 'function');
    })()`);
  }
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.pumpkyTestEvents = [];
    window.addEventListener('message', e => { if (e.origin === location.origin) window.pumpkyTestEvents.push(e.data); });
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = constraints => {
      window.pumpkyTestFacingMode = constraints.video.facingMode;
      return original(constraints);
    };
  ` });
  for (const [width, height] of [[375, 667], [393, 852], [430, 932], [1440, 900]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await call('Page.navigate', { url: address });
    await waitForStart();
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal page overflow');
    assert(await evaluate(`document.querySelector('[name="viewport"]').content.includes('viewport-fit=cover')`));
    assert(await evaluate(`(() => {
      const r = document.querySelector('[aria-label="Capture basket photo"]').getBoundingClientRect();
      return r.bottom <= innerHeight && r.top >= 0;
    })()`), 'Shutter must remain visible');
    console.log(`PASS: production layout ${width} × ${height}`);
  }
  assert.equal((await fetch(address + '/badge/print.html')).status, 200);
  assert.equal((await fetch(address + '/badge/pumpky-badge.png')).status, 200);
  console.log('PASS: printable badge and image are deployed');
  await call('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 1, mobile: true });
  await call('Page.navigate', { url: address });
  await waitForStart();
  await evaluate(button('Start camera') + '.click()');
  await waitFor(`window.pumpkyTestEvents.some(e => e.type === 'status' && e.state === 'tracking')`, 120000);
  assert.equal(await evaluate(`document.querySelector('iframe').contentWindow.pumpkyTestFacingMode`), 'environment');
  console.log('PASS: real badge detection with a synthetic rear-camera feed');
  await evaluate(`document.querySelectorAll('[role="radio"]')[1].click()`);
  await waitFor(`document.querySelectorAll('[role="radio"]')[1].getAttribute('aria-checked') === 'true'`);
  await waitFor(`document.querySelector('[aria-label="Capture basket photo"]').getAttribute('aria-disabled') !== 'true'`);
  await evaluate(`document.querySelector('[aria-label="Capture basket photo"]').click()`);
  await waitFor(button('Save / share'));
  const photo = await evaluate(`window.pumpkyTestEvents.find(e => e.type === 'capture' && e.uri)?.uri`);
  assert(photo?.startsWith('data:image/png;base64,'));
  assert(Buffer.from(photo.split(',')[1], 'base64').length > 10000, 'Photo should contain camera and model pixels');
  await evaluate(`Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async ({files}) => {
      window.pumpkySharedFile = {type: files[0].type, size: files[0].size};
    } });`);
  await evaluate(button('Save / share') + '.click()');
  await waitFor('window.pumpkySharedFile?.size > 10000');
  assert.equal(await evaluate('window.pumpkySharedFile.type'), 'image/png');
  console.log('PASS: style selection, PNG capture, and file-share payload (share sheet mocked)');
  await evaluate('window.pumpkyTestEvents = []');
  await evaluate(button('Back to basket') + '.click()');
  await waitFor(`window.pumpkyTestEvents.some(e => e.type === 'status' && e.state === 'tracking')`, 30000);
  await evaluate(button('Stop camera') + '.click()');
  await waitFor('!document.querySelector("iframe")');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: camera reacquisition after capture and camera shutdown');
} catch (error) {
  console.error('Browser check failed:', error);
  throw error;
} finally {
  socket?.close();
  const stopped = new Promise((resolve) => browser.once('exit', resolve));
  browser.kill('SIGTERM');
  await stopped;
  server.closeAllConnections();
  server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
