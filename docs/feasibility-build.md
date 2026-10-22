# Pumpky feasibility build

## Scope

One iPhone, one known basket, and one flat badge fixed rigidly to its front centre. Select Jack (pumpkin), Boo (ghost), or Goblin (monster), adjust the shell size, reset tracking, and capture a still photo. The capture preview opens the system share sheet for saving/sharing. Photos are temporary until saved through that sheet. Photo capture uses Viro's rendered view, so controls are excluded; camera-background compositing must be verified on the phone.

The three designs are generated GLB models shared by the browser and native renderers. Since the current physical test prop is a cup, their nominal body is approximately 10 cm wide and 12 cm high, before horns/stem. They have continuous hollow walls, rounded lips, shaped surfaces, embedded PBR materials, and facial relief wrapped around the curved front. Jack has ribbing and warm emissive insets, Boo has draped folds and a scalloped hem, and Goblin has curved horns, raised eyes, pointed ears, and fangs. These are visual cup designs, not measured fits for a particular prop. The size control changes them uniformly from 50–200%. No basket measurements or iPhone device test have been supplied. This pass does not implement hand occlusion, an actual carved-through face, a fitted basket rim/handle, arbitrary basket recognition, or video recording.

Models are authored in `scripts/build-models.mjs` with Three.js (a development dependency) and exported to `assets/models/*.glb`. They use metres, +Y up and +Z forward. `src/features/models.ts` supplies both engines with the same assets and marker/front-offset constants; Metro registers GLB as an asset extension. The body’s front is offset 5 cm behind the marker centre before scaling. Geometry uses roughly 15–24k triangles per model and files are about 370–575 KB each, with no external textures. Native loading/material appearance still needs device validation.

Regenerate models with `npm run models:build`. `npm run models:previews` renders the actual GLBs into transparent picker thumbnails using Node 22+, a local Chromium executable, and the pinned CDN Three.js loader. Set `PUMPKY_CHROMIUM` if Chromium is not on PATH. The preview script runs a temporary localhost server/browser profile and cleans it up afterward; it does not access a webcam. Re-run both commands when changing model geometry so picker thumbnails continue to match AR.

## Platform and dependencies

- Expo 57.0.31, React Native 0.86.3, React 19.2.3, ViroReact 3.0.3.
- `expo-dev-client` for the native development build.
- `expo-camera` only for permission handling; Viro owns the camera feed and renderer.
- `expo-sharing` for the photo share sheet.
- Buttons, style cards, horizontal carousel, tracking status, capture preview, and platform-specific AR view live under root `components/`. Style data lives under `src/features/`. Routes remain under `src/app/`.
- A scoped npm override makes Viro use the app's exact React version. Its published dependency otherwise installs another React patch version and can cause invalid-hook errors. Keep the override and lockfile together; `npm ls react` should show one version.

The initial Expo 58 experiment failed normal npm resolution because Viro excludes Expo 58 / RN 0.88. The project was then moved to SDK 57 at the user's request. The final dependency tree installs normally, without `--force`, `--legacy-peer-deps`, or a project `.npmrc` exception.

## Print and attach the badge

Open `assets/markers/print.html` in a browser and print at **actual size / 100%** with fit-to-page disabled. Measure the full PNG: **80 mm wide × 100 mm tall**, including its cream border. Viro's `physicalWidth` is 0.08 metres and must match the print. The SVG is the editable source; `pumpky-badge.png` is the exact bundled tracking target.

Cut out the full image, mount it flat on matte rigid card, and fix it to the basket's front centre at about mid-height. Do not wrap it around the basket or let it swing. Start in even light with the badge large in the camera frame. This illustration is a candidate target, not a measured/validated image tracker.

To regenerate its PNG with ImageMagick:

```sh
magick -background none -density 254 assets/markers/pumpky-badge.svg -resize 800x1000 -strip assets/markers/pumpky-badge.png
```

## Run and build

```sh
npm ci
npx expo start --dev-client
```

`npm run web` previews the designs and includes **Test with webcam**, a browser-only MindAR/Three.js experiment. It detects the same badge, anchors rough 3D shells, switches styles, supports Fit/reset, and composites the camera plus design into a downloadable PNG. Viro's web image-marker component is a no-op, so this adapter does not prove native Viro/ARKit compatibility. Native AR still requires a physical iPhone and a custom build.

The browser adapter lives in `public/web-ar/` inside a same-origin iframe; its commands and replies validate the frame and origin. Its runtime dependencies are pinned MindAR 1.2.5 and Three.js 0.160.0 ESM builds loaded from jsDelivr only when started, so the TensorFlow/WebGL runtime is outside the native Metro bundle. Three.js is also a development dependency for reproducible asset authoring, not a native renderer. The badge and models are resolved with `expo-asset`; the badge is compiled in the browser per frame session. GLBs load once per session and are cached for immediate design switching. Internet access is needed to load the browser libraries; this path is not an offline party-build guarantee.

Use Chrome/Edge on `localhost` or HTTPS, click **Test with webcam**, and grant camera permission. Present a flat printed badge (or an image on another screen for a smoke test). Repeated patterns, low light, glare, and small/oblique targets may impair detection. The normal 80 × 100 mm print is needed to compare the intended basket scale. Pause/stop releases camera tracks; guide/capture previews pause the session, and returning reacquires the marker. **Stop webcam** destroys the browser frame. Webcam photos download rather than using native photo-library sharing.

Automated browser checks used a synthetic camera feed containing the actual Pumpky badge: target detection, style switching, camera+3D PNG capture, reacquisition after capture, and stop/removal passed. A real webcam, physical prop alignment, and lighting remain manual tests. Both engines now load the same generated GLBs; the browser experiment still does not validate the iPhone renderer.

`eas.json` includes a physical-device development profile and a standalone preview profile. The existing EAS project ID and owner are preserved. The iOS bundle identifier is `com.mdbandi123.pumpky`; adjust it if the Apple account already uses a different identifier.

When ready to create the signed iPhone build:

```sh
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

These commands need the owner's Expo/Apple credentials, Apple Developer membership, and registered iPhone. No cloud build was started from this environment. Install the resulting build, then connect it to the development server. Use the preview profile later to test without Metro or party Wi-Fi.

## Validation and phone checklist

Local checks: `npx expo install --check`, `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor`, `npx expo config --type introspect`, and `npx expo export --platform ios --platform web`.

On the iPhone:

1. Deny camera permission, then grant it in Settings and return; confirm the camera starts.
2. Detect the measured badge and check shell orientation, centre, and size. Switch all three designs while tracked.
3. Move/rotate the basket gently. Cover the badge, move it out of frame, and reacquire it. Confirm the status and shell visibility respond rather than showing a stale pose. Native tracking-loss callbacks must be checked on-device.
4. Capture a photo. Confirm both real camera background and virtual creature appear, the controls do not, and Save Image works in the share sheet. Cancel the sheet and return to AR.
5. Background/resume the app and reset tracking. Confirm no second camera/session remains active.
6. Repeat under the intended party lighting and on the final preview build.

Passing JavaScript export/config checks does not prove CocoaPods linking, native compilation, or on-device AR behavior. This Linux environment cannot run Xcode or an iPhone simulator.

References: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Viro Expo setup](https://viro-community.readme.io/docs/integrating-with-expo), [Viro image targets](https://viro-community.readme.io/docs/image-recognition), [Viro capture API](https://viro-community.readme.io/docs/viroarscenenavigator), [EAS internal distribution](https://docs.expo.dev/build/internal-distribution/).
