import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const basketDimensions = JSON.parse(await readFile(
  new URL('../src/features/basket-dimensions.json', import.meta.url), 'utf8'));

// GLTFExporter only needs this browser API for its final Blob, not a DOM or canvas.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); });
  }
};

const output = new URL('../assets/models/', import.meta.url);
await mkdir(output, { recursive: true });

function paint(name, color, roughness = 0.42, extra = {}) {
  const material = new T.MeshStandardMaterial({ color, roughness, ...extra });
  material.name = name;
  return material;
}

function createBasket(design) {
  const root = new T.Group();
  root.name = `Pumpky_${design}_basket`;
  root.userData = { units: 'metres', nominalWidth: basketDimensions.bodyWidth,
    nominalHeight: basketDimensions.bodyHeight, nominalDepth: basketDimensions.bodyDepth,
    coverageScale: basketDimensions.coverageScale, centerLift: basketDimensions.centerLift,
    front: '+Z', handle: 'Use the physical basket handle; body height excludes it.' };
  // Author the reliefs in their original coordinates, then fit the whole design
  // to a 5½-inch basket body. Widen independently instead of making a taller cup.
  const coverage = basketDimensions.coverageScale;
  root.scale.set(basketDimensions.bodyWidth * coverage / 0.1,
    basketDimensions.bodyHeight * coverage / 0.121, basketDimensions.bodyDepth * coverage / 0.1);
  // A slightly oversized, raised envelope hides wicker edges instead of intersecting them.
  root.position.y = basketDimensions.centerLift;
  const isJack = design === 'pumpkin', isBoo = design === 'ghost';
  const color = isJack ? '#ed792f' : isBoo ? '#ebe5f4' : '#91b967';
  const body = paint('Glazed outer shell', color, isBoo ? 0.3 : 0.4, { vertexColors: true });
  const rim = paint('Rolled lip', isJack ? '#ffb65b' : isBoo ? '#f9f3ff' : '#b8d88b', 0.28);
  const dark = paint('Recessed face', '#261f30', 0.8);
  const bone = paint('Warm ivory', '#fff1ca', 0.38);
  const moss = paint('Vine green', '#56753c', 0.62);

  function mesh(name, geometry, material, position = [0, 0, 0]) {
    const object = new T.Mesh(geometry, material);
    object.name = name;
    object.position.set(...position);
    root.add(object);
    return object;
  }

  function orb(name, mat, position, scale) {
    const object = mesh(name, new T.SphereGeometry(1, 24, 16), mat, position);
    object.scale.set(...scale);
    return object;
  }

  function tube(name, points, radius, mat) {
    return mesh(name, new T.TubeGeometry(new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))), 24, radius, 8, false), mat);
  }

  // Outer wall, rounded lip, inner wall and floor form one continuous hollow shell.
  const profile = [
    [0, -0.06], [0.027, -0.06], [0.034, -0.057], [0.037, -0.05],
    [0.04, -0.035], [0.045, -0.012], [0.049, 0.012], [0.05, 0.035],
    [0.049, 0.052], [0.048, 0.059], [0.046, 0.061], [0.043, 0.06],
    [0.042, 0.056], [0.043, 0.035], [0.042, 0.01], [0.038, -0.012],
    [0.032, -0.037], [0.029, -0.049], [0, -0.049],
  ];
  const wall = new T.LatheGeometry(profile.map((p) => new T.Vector2(...p)), 128);
  const positions = wall.getAttribute('position');
  const colors = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const theta = Math.atan2(x, z), row = i % profile.length;
    const outer = row > 0 && row < 11;
    const rib = isJack ? 0.065 * Math.cos(theta * 12) : isBoo ? 0.035 * Math.cos(theta * 14 + y * 16) : 0.008 * Math.cos(theta * 9);
    const amount = outer ? rib * (0.3 + 0.7 * Math.sin((y + 0.06) / 0.121 * Math.PI)) : 0;
    positions.setX(i, x * (1 + amount));
    positions.setZ(i, z * (1 + amount));
    if (isBoo && outer && y < -0.025) {
      positions.setY(i, y + (Math.cos(theta * 8) * 0.004 + Math.sin(theta * 5) * 0.002) * Math.max(0, (-y - 0.025) / 0.035));
    }
    const shade = new T.Color('#ffffff');
    if (row >= 12) shade.set(isJack ? '#86512f' : isBoo ? '#a09ab5' : '#4c6544');
    else shade.multiplyScalar(0.83 + 0.17 * (y + 0.06) / 0.12);
    colors.push(shade.r, shade.g, shade.b);
  }
  wall.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  wall.computeVertexNormals();
  mesh('Hollow sculpted basket', wall, body);
  const lip = mesh('Rounded opening', new T.TorusGeometry(0.0462, 0.00225, 12, 128), rim, [0, 0.0595, 0]);
  lip.rotation.x = Math.PI / 2;
  if (!isBoo) {
    const foot = mesh('Foot ring', new T.TorusGeometry(0.032, 0.0016, 8, 96), rim, [0, -0.0575, 0]);
    foot.rotation.x = Math.PI / 2;
  }

  // Project relief geometry onto the curved front so faces wrap with the basket.
  const surface = (x, y) => {
    let base = 0.049;
    for (let i = 2; i < 10; i++) {
      if (y >= profile[i - 1][1] && y <= profile[i][1]) {
        const t = (y - profile[i - 1][1]) / (profile[i][1] - profile[i - 1][1]);
        base = T.MathUtils.lerp(profile[i - 1][0], profile[i][0], t);
        break;
      }
    }
    let r = base;
    for (let i = 0; i < 4; i++) {
      const theta = Math.asin(T.MathUtils.clamp(x / r, -0.98, 0.98));
      const rib = isJack ? 0.065 * Math.cos(theta * 12) : isBoo ? 0.035 * Math.cos(theta * 14 + y * 16) : 0.008 * Math.cos(theta * 9);
      r = base * (1 + rib * (0.3 + 0.7 * Math.sin((y + 0.06) / 0.121 * Math.PI)));
    }
    return Math.sqrt(Math.max(0.0001, r * r - x * x)) + 0.00025;
  };
  function relief(name, shape, mat, offset = 0.0007, depth = 0.0007) {
    const source = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.00035,
      bevelSize: 0.0004, bevelSegments: 2, steps: 1, curveSegments: 16 });
    // Large flat triangles otherwise cut through the convex shell. Subdivide before wrapping.
    const vertices = [];
    const input = source.getAttribute('position');
    function split(a, b, c, level = 0) {
      const distance = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
      const ab = distance(a, b), bc = distance(b, c), ca = distance(c, a);
      if (level < 10 && Math.max(ab, bc, ca) > 0.0035) {
        if (ab >= bc && ab >= ca) {
          const mid = a.clone().lerp(b, 0.5); split(a, mid, c, level + 1); split(mid, b, c, level + 1);
        } else if (bc >= ca) {
          const mid = b.clone().lerp(c, 0.5); split(b, mid, a, level + 1); split(mid, c, a, level + 1);
        } else {
          const mid = c.clone().lerp(a, 0.5); split(c, mid, b, level + 1); split(mid, a, b, level + 1);
        }
      } else for (const p of [a, b, c]) vertices.push(p.x, p.y, p.z);
    }
    for (let i = 0; i < input.count; i += 3) split(
      new T.Vector3().fromBufferAttribute(input, i), new T.Vector3().fromBufferAttribute(input, i + 1),
      new T.Vector3().fromBufferAttribute(input, i + 2));
    let geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    source.dispose();
    const attribute = geometry.getAttribute('position');
    for (let i = 0; i < attribute.count; i++) {
      const x = attribute.getX(i), y = attribute.getY(i);
      attribute.setZ(i, attribute.getZ(i) + surface(x, y) + offset);
    }
    const merged = mergeVertices(geometry, 0.00000005);
    geometry.dispose();
    geometry = merged;
    geometry.computeVertexNormals();
    return mesh(name, geometry, mat);
  }
  function polygon(points) {
    const shape = new T.Shape();
    points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    return shape;
  }
  function oval(x, y, rx, ry) {
    const shape = new T.Shape();
    shape.absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0);
    return shape;
  }

  if (isJack) {
    const glow = paint('Amber cutout glow', '#ffd578', 0.6, { emissive: '#ff941e', emissiveIntensity: 0.8 });
    const cutouts = [
      [[-0.032, 0.013], [-0.015, 0.03], [-0.009, 0.009]],
      [[0.009, 0.009], [0.015, 0.03], [0.032, 0.013]],
      [[-0.029, -0.012], [-0.021, -0.019], [-0.016, -0.011], [-0.008, -0.024],
        [0, -0.018], [0.008, -0.024], [0.016, -0.011], [0.022, -0.018], [0.029, -0.01],
        [0.023, -0.032], [0.011, -0.039], [-0.011, -0.039], [-0.023, -0.032]],
    ];
    cutouts.forEach((points, index) => {
      relief(`Carved recess ${index}`, polygon(points), dark, 0.0012);
      const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
      const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
      relief(`Warm carved inset ${index}`, polygon(points.map(([x, y]) => [cx + (x - cx) * 0.81, cy + (y - cy) * 0.78])), glow, 0.0023, 0.0002);
    });
    tube('Curled stem', [[0.018, 0.058, -0.035], [0.016, 0.073, -0.039], [0.024, 0.082, -0.032], [0.031, 0.077, -0.027]], 0.0036, moss);
    const leaf = polygon([[0, 0], [0.012, 0.003], [0.018, 0.016], [0.006, 0.018], [-0.003, 0.01]]);
    const leafMesh = mesh('Stem leaf', new T.ExtrudeGeometry(leaf, { depth: 0.001, bevelEnabled: false }), moss, [0.014, 0.062, -0.027]);
    leafMesh.rotation.set(-0.6, 0.3, -0.5);
    // Slim carved grooves accent the lobes without inflating the silhouette into a ball.
    const groove = paint('Deep pumpkin grooves', '#ae481b', 0.75);
    for (let i = 0; i < 12; i++) {
      const theta = i / 12 * Math.PI * 2 + Math.PI / 12;
      const points = [[0.034, -0.052], [0.041, -0.027], [0.047, 0.009], [0.048, 0.038], [0.047, 0.055]];
      tube(`Pumpkin groove ${i}`, points.map(([r, y]) => [Math.sin(theta) * r, y, Math.cos(theta) * r]), 0.0005, groove);
    }
  } else if (isBoo) {
    const inset = paint('Violet eye rims', '#756486', 0.6);
    const cheek = paint('Blush glaze', '#eaa6b5', 0.5);
    for (const x of [-0.019, 0.019]) {
      relief('Soft eye rim', oval(x, 0.013, 0.009, 0.014), inset);
      relief('Deep oval eye', oval(x, 0.013, 0.0075, 0.0125), dark, 0.002);
      orb('Eye catchlight', bone, [x - 0.002, 0.019, surface(x, 0.019) + 0.0034], [0.0017, 0.0022, 0.0007]);
      relief('Soft blush', oval(x * 1.55, -0.009, 0.0055, 0.0025), cheek, 0.0005, 0.0001);
    }
    relief('Little ghost gasp', oval(0, -0.023, 0.006, 0.009), inset);
    relief('Hollow mouth', oval(0, -0.023, 0.0048, 0.0077), dark, 0.0019);
    // Asymmetric folds curl down from the rolled rim like a small sheet.
    for (const [x, direction] of [[-0.036, -1], [0.034, 1]]) {
      tube('Draped side fold', [[x, 0.05, 0.03], [x * 1.15, 0.015, 0.024],
        [x * 1.12, -0.025, 0.017], [x + direction * 0.005, -0.052, 0.008]], 0.0014, rim);
    }
  } else {
    const eye = paint('Porcelain eyeballs', '#f7f0d9', 0.28);
    const iris = paint('Golden irises', '#dd9f44', 0.32);
    const brow = paint('Deep moss', '#47613e', 0.55);
    const pink = paint('Mouth lining', '#634158', 0.55);
    for (const sign of [-1, 1]) {
      const x = sign * 0.020;
      const z = surface(x, 0.016);
      orb('Raised eyeball', eye, [x, 0.016, z + 0.002], [0.011, 0.012, 0.006]);
      orb('Amber iris', iris, [x - sign * 0.001, 0.015, z + 0.007], [0.0058, 0.0065, 0.0016]);
      orb('Slit pupil', dark, [x - sign * 0.001, 0.015, z + 0.0085], [0.002, 0.005, 0.0008]);
      orb('Eye reflection', eye, [x - 0.0025, 0.018, z + 0.009], [0.0015, 0.0015, 0.0005]);
      tube('Sculpted eyebrow', [[x - sign * 0.011, 0.027, z], [x, 0.034, z + 0.003], [x + sign * 0.012, 0.028, z - 0.002]], 0.0032, brow);
      const hornCurve = new T.CatmullRomCurve3([
        new T.Vector3(sign * 0.043, 0.037, 0), new T.Vector3(sign * 0.056, 0.054, -0.001),
        new T.Vector3(sign * 0.057, 0.075, -0.006), new T.Vector3(sign * 0.045, 0.089, -0.004),
      ]);
      const horn = new T.TubeGeometry(hornCurve, 24, 0.006, 12, false);
      const hp = horn.getAttribute('position');
      for (let i = 0; i < hp.count; i++) {
        const t = Math.floor(i / 13) / 24;
        const center = hornCurve.getPointAt(t);
        const point = new T.Vector3().fromBufferAttribute(hp, i).sub(center).multiplyScalar(Math.pow(1 - t, 0.7) + 0.025).add(center);
        hp.setXYZ(i, point.x, point.y, point.z);
      }
      horn.computeVertexNormals();
      mesh('Curved ivory horn', horn, bone);
      const ear = polygon([[0, 0], [sign * 0.024, 0.012], [sign * 0.017, -0.005], [0, -0.012]]);
      mesh('Pointed ear', new T.ExtrudeGeometry(ear, { depth: 0.004, bevelEnabled: true,
        bevelSize: 0.001, bevelThickness: 0.001, bevelSegments: 2 }), body.clone(), [sign * 0.045, 0.015, 0]);
    }
    const smile = polygon([[-0.029, -0.013], [-0.016, -0.019], [0, -0.021], [0.016, -0.018],
      [0.029, -0.01], [0.02, -0.033], [0, -0.04], [-0.02, -0.034]]);
    relief('Sculpted grin border', smile, pink, 0.0006);
    relief('Mischievous grin', polygon([[-0.026, -0.015], [0, -0.024], [0.026, -0.013],
      [0.017, -0.032], [0, -0.037], [-0.018, -0.031]]), dark, 0.0018);
    for (const sign of [-1, 1]) {
      const x = sign * 0.015;
      relief('Pointed fang', polygon([[x - 0.003, -0.019], [x + 0.003, -0.019], [x + sign * 0.001, -0.03]]), bone, 0.0031, 0.001);
    }
    relief('Small goblin nose', polygon([[-0.004, -0.002], [0, 0.004], [0.005, -0.003], [0, -0.005]]), rim, 0.001, 0.002);
  }
  return root;
}

for (const design of ['pumpkin', 'ghost', 'monster']) {
  const object = createBasket(design);
  const scene = new T.Scene();
  scene.add(object);
  const bytes = await new GLTFExporter().parseAsync(scene, { binary: true });
  await writeFile(new URL(`${design}.glb`, output), Buffer.from(bytes));
  let triangles = 0, meshes = 0;
  object.traverse((node) => {
    if (node.isMesh) { meshes++; triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3; }
  });
  console.log(`${design}: ${meshes} meshes, ${triangles} triangles, ${(bytes.byteLength / 1024).toFixed(0)} KB`);
}
