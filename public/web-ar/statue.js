// A photo-textured standee with a real 3D plinth, not a reconstructed human mesh.
export async function createStatue(THREE, imageUrl) {
  const texture = await new THREE.TextureLoader().loadAsync(imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Badge-width units: about 11 cm tall, with a footprint inside the 8 cm badge.
  const height = 1.35;
  const width = height * texture.image.width / texture.image.height;
  const group = new THREE.Group();
  group.name = 'Rene image-based AR standee';
  // MindAR's badge lies in XY, with +Z pointing out of its printed surface.
  // Rotate model +Y onto +Z so the plinth rests on a horizontal badge.
  group.rotation.x = Math.PI / 2;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true,
    alphaTest: 0.08, side: THREE.DoubleSide, depthWrite: true });
  const figure = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  figure.position.y = height / 2;
  const facing = new THREE.Group();
  facing.name = 'statue-facing';
  facing.position.y = 0.1;
  facing.add(figure);
  group.add(facing);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.1, 48),
    new THREE.MeshStandardMaterial({ color: '#273858', roughness: 0.6 }));
  plinth.name = 'statue-plinth';
  plinth.position.y = 0.05;
  group.add(plinth);
  const cameraPoint = new THREE.Vector3();
  return {
    group,
    faceCamera(camera) {
      group.worldToLocal(camera.getWorldPosition(cameraPoint));
      // Turn only around the badge normal. Feet stay on the plinth; avoid
      // arbitrary spinning when the camera is directly overhead.
      if (Math.hypot(cameraPoint.x, cameraPoint.z) > 0.05) {
        facing.rotation.y = Math.atan2(cameraPoint.x, cameraPoint.z);
      }
    },
  };
}
