# Pumpky

A Halloween basket AR experiment for iPhone, built with Expo SDK 57 and ViroReact.

Point at the printed badge on your basket, choose Jack, Boo, or Goblin, adjust the fit, and capture a still photo. The screen includes a badge setup guide and a photo preview with save/share controls.

## Run

```sh
npm ci
npx expo start --dev-client
```

The iPhone AR experience requires a custom build on a physical device. `npm run web` also offers **Test with webcam**: a separate MindAR/Three.js browser experiment using the same badge, style picker, fit controls, and still capture. It tests the visual idea and marker, rather than Viro/ARKit compatibility.

For the webcam test, open the app on `localhost` in Chrome or Edge, click **Test with webcam**, allow camera access, and show the badge to the camera. The tracker loads pinned libraries from a CDN and compiles the badge on startup; internet access is required. Photos download as PNGs. Stop the camera with **Stop webcam**. Use localhost or HTTPS, since ordinary HTTP on a LAN address cannot access browser cameras.

See the [build guide](docs/feasibility-build.md) for signing, installation, known limitations, and the device test checklist.

## Tracking badge

Open [the printable badge](assets/markers/print.html) in a browser and print at actual size: **80 × 100 mm**. Mount it flat and rigidly on the basket’s front centre.

## Project layout

- `src/app/` — Expo Router screens and navigation.
- `components/` — reusable controls, creature previews, and AR views.
- `src/features/` — basket design data.
- `assets/creatures/` — rendered thumbnails of the actual 3D designs.
- `assets/models/` — shared GLB cup designs for web and iPhone.
- `assets/markers/` — printable image target and its source.
- `assets/branding/` — Pumpky app icon and splash assets.
- `public/web-ar/` — browser-only marker tracking adapter, loaded on demand.
- `scripts/` — reproducible model generation and thumbnail rendering.
- `docs/` — feasibility findings and build instructions.

## Checks

```sh
npm run lint
npm run typecheck
npx expo-doctor
npx expo export --platform ios --platform web
```

The models currently use a cup silhouette for testing. Regenerate them with `npm run models:build`; regenerate picker thumbnails with `npm run models:previews` (requires Chromium and internet access). Real prop alignment, native compilation, and iPhone rendering still require device tests.
