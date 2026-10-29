/* eslint-disable import/no-unresolved -- Browser imports resolve through index.html's import map and pinned CDN URLs. */
// Web AR renderer. Pinned ESM builds load on demand, outside Metro/native bundles.
const channel = 'pumpky-web-ar';
const stage = document.getElementById('stage');
let engine, anchor, creature, THREE, compiledTarget;
let running = false, tracked = false, wanted = false;
let sequence = Promise.resolve();
let settings = { design: 'pumpkin', scale: 1 };
let modelUrls = {};
let modelWidth = 0.08, frontOffset = 0.05;
const models = new Map();

function notify(type, data = {}) {
  window.parent.postMessage({ channel, type, ...data }, window.location.origin);
}
function status(state, message = null) { notify('status', { state, message }); }

async function prepare(markerUrl) {
  if (engine) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access needs HTTPS. On iPhone, open the deployed Pumpky link directly in Safari.');
  }
  status('starting', 'Loading the browser tracker… Internet access is needed.');
  const [three, { MindARThree }, { Compiler }, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js'),
    import('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js'),
    import('three/addons/loaders/GLTFLoader.js'),
  ]);
  THREE = three;
  status('starting', 'Loading your Halloween creatures…');
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(modelUrls).map(async ([id, url]) => {
    models.set(id, (await loader.loadAsync(url)).scene);
  }));
  const image = new Image();
  image.src = markerUrl;
  await image.decode();
  const compiler = new Compiler();
  status('starting', 'Preparing your Pumpky badge…');
  await compiler.compileImageTargets([image], (progress) => {
    status('starting', `Preparing your Pumpky badge… ${Math.round(progress)}%`);
  });
  compiledTarget = URL.createObjectURL(new Blob([compiler.exportData()]));
  engine = new MindARThree({
    container: stage, imageTargetSrc: compiledTarget, maxTrack: 1,
    uiLoading: 'no', uiScanning: 'no', uiError: 'no', warmupTolerance: 3, missTolerance: 5,
  });
  // MindAR defaults to the environment (rear) camera and sets playsinline for iPhone Safari.
  engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  engine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  engine.renderer.toneMappingExposure = 1.05;
  engine.scene.add(new THREE.HemisphereLight(0xf4eeff, 0x59465a, 1.5));
  const light = new THREE.DirectionalLight(0xffe4cd, 3);
  light.position.set(-2, 3, 4);
  engine.scene.add(light);
  const fill = new THREE.DirectionalLight(0xc4d7ff, 1.4);
  fill.position.set(2, 1, 2);
  engine.scene.add(fill);
  anchor = engine.addAnchor(0);
  anchor.onTargetFound = () => { tracked = true; status('tracking'); };
  anchor.onTargetLost = () => { tracked = false; status('lost'); };
  updateCreature();
}

function updateCreature() {
  if (!engine || !models.has(settings.design)) return;
  if (creature) anchor.group.remove(creature);
  // The cached GLBs share geometry/materials. Keep those GPU resources until the frame is destroyed.
  creature = models.get(settings.design).clone(true);
  applyFit();
  anchor.group.add(creature);
}

function applyFit() {
  if (!creature) return;
  creature.scale.setScalar(settings.scale / modelWidth);
  creature.position.z = -frontOffset * settings.scale / modelWidth;
}

function stop() {
  running = false; tracked = false;
  if (anchor) {
    anchor.group.visible = false;
    // MindAR retains this detection edge flag across start/stop. Reset it too,
    // otherwise an immediately visible badge never emits onTargetFound again.
    anchor.visible = false;
  }
  engine?.renderer.setAnimationLoop(null);
  // Startup may reject before a controller exists; still release the camera stream.
  try { engine?.controller?.stopProcessVideo(); } catch { /* already stopped */ }
  engine?.video?.srcObject?.getTracks().forEach((track) => track.stop());
  engine?.video?.remove();
}

async function start(markerUrl) {
  if (running) return;
  await prepare(markerUrl);
  if (!wanted) return;
  status('permission', 'Allow camera access when your browser asks. On iPhone, use the rear camera.');
  await engine.start();
  if (!wanted) { stop(); return; }
  running = true; tracked = false;
  status('searching');
  engine.renderer.setAnimationLoop(() => engine.renderer.render(engine.scene, engine.camera));
}

function capture(id) {
  try {
    if (!running || !tracked) throw new Error('Keep the badge visible before taking a photo.');
    const rect = stage.getBoundingClientRect();
    const videoRect = engine.video.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ratio = Math.min(2, 1600 / Math.max(rect.width, rect.height));
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext('2d');
    context.drawImage(engine.video, (videoRect.left - rect.left) * ratio, (videoRect.top - rect.top) * ratio,
      videoRect.width * ratio, videoRect.height * ratio);
    engine.renderer.render(engine.scene, engine.camera);
    context.drawImage(engine.renderer.domElement, 0, 0, canvas.width, canvas.height);
    notify('capture', { id, uri: canvas.toDataURL('image/png') });
  } catch (error) { notify('capture', { id, error: error.message }); }
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.channel !== channel) return;
  const data = event.data;
  if (data.type === 'settings' && ['pumpkin', 'ghost', 'monster'].includes(data.design)) {
    if (data.modelUrls) modelUrls = data.modelUrls;
    if (Number.isFinite(data.markerWidth)) modelWidth = data.markerWidth;
    if (Number.isFinite(data.cupFrontOffset)) frontOffset = data.cupFrontOffset;
    const changed = settings.design !== data.design;
    settings = { design: data.design, scale: Math.min(2, Math.max(0.5, Number(data.scale) || 1)) };
    if (changed) updateCreature(); else applyFit();
  }
  if (data.type === 'capture') capture(data.id);
  if (data.type === 'stop') { wanted = false; stop(); }
  if (data.type === 'reset') { stop(); if (wanted) data.type = 'start'; }
  if (data.type === 'start') {
    wanted = true;
    sequence = sequence.then(() => start(data.markerUrl)).catch((error) => {
      stop();
      notify('error', { message: error?.message || 'Camera access failed. Open Pumpky in Safari, allow camera access in the website settings, close other camera apps, and try again.' });
    });
  }
});
window.addEventListener('pagehide', (event) => {
  wanted = false; stop();
  if (compiledTarget && !event.persisted) URL.revokeObjectURL(compiledTarget);
});
notify('ready');
