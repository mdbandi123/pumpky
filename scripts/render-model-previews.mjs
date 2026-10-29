import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

// Render the generated GLBs themselves; no separate illustration of the designs.
const viewer = String.raw`<!doctype html>
<html><head><meta charset="utf-8"><title>Pumpky model review</title>
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#282130}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const design = new URLSearchParams(location.search).get('design') || 'pumpkin';
const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(2);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xf4eeff,0x59465a,1.5));
const key=new THREE.DirectionalLight(0xffe4cd,3);key.position.set(-.2,.3,.4);scene.add(key);
const fill=new THREE.DirectionalLight(0xc4d7ff,1.4);fill.position.set(.2,.1,.2);scene.add(fill);
const back=new THREE.DirectionalLight(0xffa75b,1);back.position.set(0,.12,-.2);scene.add(back);
const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.001,10);camera.position.set(.09,.09,.25);camera.lookAt(0,.008,0);
if(design==='monster'){camera.position.multiplyScalar(1.12);camera.lookAt(0,.014,0);}
const gltf=await new GLTFLoader().loadAsync('/models/'+design+'.glb');
scene.add(gltf.scene);
const bounds=new THREE.Box3().setFromObject(gltf.scene);
const center=bounds.getCenter(new THREE.Vector3());
const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.08;
camera.position.copy(new THREE.Vector3(.09,.09,.25).normalize().multiplyScalar(distance).add(center));
camera.lookAt(center);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,6,64,64,64);
gradient.addColorStop(0,'rgba(0,0,0,.25)');gradient.addColorStop(1,'rgba(0,0,0,0)');
ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(.24,.24),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
floor.rotation.x=-Math.PI/2;floor.position.y=bounds.min.y-.001;scene.add(floor);
renderer.setAnimationLoop(()=>renderer.render(scene,camera));
document.body.dataset.ready='true';
</script></body></html>
`;
const profile = await mkdtemp(join(tmpdir(), 'pumpky-model-renders-'));
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.end(viewer);
    } else if (/^\/models\/(pumpkin|ghost|monster)\.glb$/.test(path)) {
      const id = path.split('/').pop();
      response.setHeader('Content-Type', 'model/gltf-binary');
      response.end(await readFile(new URL('../assets/models/' + id, import.meta.url)));
    } else { response.writeHead(404); response.end(); }
  } catch { response.writeHead(500); response.end('Could not load model'); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = 'http://127.0.0.1:' + server.address().port;
const browser = spawn(process.env.PUMPKY_CHROMIUM || 'chromium', [
  '--headless', '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--remote-debugging-port=0', '--no-first-run',
  '--user-data-dir=' + profile, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const debugAddress = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chromium did not start. Set PUMPKY_CHROMIUM to its binary path.')), 15000);
    browser.on('error', reject);
    browser.stderr.on('data', (chunk) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(new URL(match[1]).origin.replace('ws:', 'http:')); }
    });
  });
  const target = await (await fetch(debugAddress + '/json/new?about:blank', { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const entry = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
    else entry.resolve(message.result);
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false });
  for (const design of ['pumpkin', 'ghost', 'monster']) {
    await call('Page.navigate', { url: address + '/?design=' + design });
    let ready = false;
    for (let i = 0; i < 180; i++) {
      if (await evaluate('document.body?.dataset.ready === "true"')) { ready = true; break; }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Model render timed out: ' + design);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const image = await evaluate('document.querySelector("canvas").toDataURL("image/png")');
    await writeFile(new URL('../assets/creatures/' + design + '.png', import.meta.url), Buffer.from(image.split(',')[1], 'base64'));
    console.log('Rendered ' + design + ' preview from its GLB.');
  }
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await new Promise((resolve) => browser.once('exit', resolve));
  server.closeAllConnections();
  server.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
