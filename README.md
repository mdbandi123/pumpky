# Pumpky

A mobile-first Halloween AR website for iPhone Safari, built with Expo SDK 57, MindAR, and Three.js. No Apple Developer membership, app signing, or installation is needed for the web experience.

Point at the printed badge on your basket, choose Jack, Boo, or Goblin, adjust the fit, and capture a still photo. The screen includes a badge setup guide and a photo preview with save/share controls.

## Run

```sh
npm ci
npm run web
```

Tap **Start camera**, grant camera access, and show the badge to the rear camera. Choose a creature, adjust Fit, and take a photo. **Save / share** opens file sharing where supported (including compatible iPhone Safari versions), or downloads a PNG. Photos are processed locally; this app does not upload camera frames or photos.

On a computer, use Chrome/Edge at `localhost`. On iPhone, use the **HTTPS deployment URL directly in Safari**, not the computer's HTTP LAN address or an in-app browser. The UI is capped at 480 px on desktop and uses the phone viewport and safe areas on mobile. Runtime libraries load from a CDN and the badge is compiled on startup, so internet access and an initial loading period are required.

The earlier native Viro implementation remains available as an optional experiment, but is not used by the website. See the [original build guide](docs/feasibility-build.md) for native signing and limitations.

## Deploy to Vercel

Import this repository and choose **Other** as the framework. Settings are checked in as `vercel.json`:

- Install: `npm ci`
- Build: `npm run build:web`
- Output: `dist`
- Root: repository root
- Environment variables: none required

Use the `main` branch and deploy a commit containing these settings. The site is a static export; no Expo server, EAS Hosting, Apple account, or catch-all rewrite is needed. Keep `/web-ar/index.html` reachable as a real HTML file. Vercel supplies HTTPS; camera access is restricted to this origin and microphone access is disabled.

See the [web deployment guide](docs/web-deployment.md) for the phone test checklist and the npm lockfile regression fix.

## Tracking badge

Open **Quick guide → Open printable badge** on the website, or [the source printable badge](assets/markers/print.html) locally. Print at actual size: **80 × 100 mm**. Mount it flat and rigidly on the basket’s front centre.

## Project layout

- `src/app/` — Expo Router screens and navigation.
- `components/` — reusable controls, creature previews, and AR views.
- `src/features/` — basket design data.
- `assets/creatures/` — rendered thumbnails of the actual 3D designs.
- `assets/models/` — shared GLB cup designs for web and iPhone.
- `assets/markers/` — printable image target and its source.
- `assets/branding/` — Pumpky app icon and splash assets.
- `public/web-ar/` — browser marker tracking renderer, loaded on demand.
- `public/badge/` — ignored, generated copies of the printable badge (prepared before web start/export).
- `scripts/` — reproducible model generation and thumbnail rendering.
- `docs/` — feasibility findings and build instructions.

## Checks

```sh
npm run lint
npm run typecheck
npm run test:install
npm run build:web
npm run test:web
npx expo-doctor
```

`test:install` regenerates lockfiles in temporary directories with npm 11.6.2 and 11.21.1, then checks each with the stricter npm CI validator. It requires registry access. `test:web` checks the production export at phone/desktop sizes and uses Chromium plus ffmpeg with a synthetic badge camera to test tracking, capture, and the sharing payload. Set `PUMPKY_CHROMIUM` if needed. This is not a real Safari/device test.

The models currently use a cup silhouette for testing. Regenerate them with `npm run models:build`; regenerate picker thumbnails with `npm run models:previews` (requires Chromium and internet access). Real prop alignment and iPhone Safari rendering still require device tests. Web AR is badge-based, not arbitrary basket detection or ARKit world tracking.
