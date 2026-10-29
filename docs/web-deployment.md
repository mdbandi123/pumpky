# Pumpky on iPhone Safari and Vercel

The primary delivery target is now a mobile website. Expo still supplies the UI and Router; its `.web.tsx` adapter uses MindAR 1.2.5 and Three.js 0.160.0 instead of native Viro. Native platform code is retained, not bundled into the web renderer. Web deployment requires no Apple signing or developer membership.

## Deployment

Vercel preset: **Other**. Root: repository root. Install: `npm ci`. Build: `npm run build:web`. Output: `dist`. No environment variables are required. These settings also live in `vercel.json`.

The build prepares a printable badge from the canonical source assets and runs `expo export --platform web`. `web.output` is `static`, so `dist` contains prerendered HTML, JavaScript, assets, and the copied `public` directory. Do not deploy the old `server` output or add an SPA catch-all rewrite: `/web-ar/index.html`, its JavaScript, and `/badge/print.html` must remain actual files.

Push the updated commit to `main` before redeploying. The failed deployment from October 29 used `87303cf`, which predates this pivot and does not have `build:web` or `vercel.json`. In the Vercel deployment details, confirm the commit is the new one, not a redeploy of that older snapshot.

The site's camera requires HTTPS (localhost is allowed for desktop development). Vercel provides HTTPS. Open the link directly in Safari on the iPhone; an ordinary HTTP LAN URL cannot access its camera. Same-origin iframe camera access is permitted; the Vercel header disables microphone and geolocation. No app code sends camera frames or captured photos to a server. Pinned AR libraries load from jsDelivr, so first use is not offline.

## Persistent npm install fix

The older lockfile omitted the root `@emnapi/core` and `@emnapi/runtime` peer providers required by the optional `@napi-rs/wasm-runtime` tooling dependency. npm 11.6.2 accepted this tree, while npm 11.21.1 reproduced Vercel's exact `Missing: ...@1.11.3 from lock file` errors.

Both providers are now explicit, exact **development dependencies** at 1.11.3. Keep these declarations, even though application source does not import them. This makes them required inputs to resolution rather than incidental lockfile entries that an older npm can omit on regeneration. Do not fix this by replacing `npm ci` with `npm install`, disabling peers, or hand-editing the lockfile.

Run `npm run test:install` after dependency changes. It tests both updating the existing lockfile and generating a fresh one from `package.json`, with npm 11.6.2 and 11.21.1, and validates every result with `npm 11.21.1 ci --dry-run`. Fixtures are isolated from the app's working tree. Use `npx expo install` for normal dependency changes and commit the resulting lockfile together with the manifest.

## iPhone checklist

1. Open the HTTPS URL directly in Safari. Confirm the header, camera card, styles, and shutter fit a portrait phone without horizontal page scrolling. Smaller phones can scroll the content while the shutter stays visible. Try Safari's address bar expanded/collapsed and rotate the phone.
2. Open Quick guide and use its printable badge link. Print the full target at 80 × 100 mm, at actual size, and mount it flat. It cannot track an unmarked cup or basket.
3. Tap Start camera. Grant permission; confirm the rear camera is selected and the video plays inline. The first startup loads libraries/models and compiles the target; allow time for that preparation.
4. Show the whole badge in even light. Confirm tracking, loss when covered, and reacquisition. Try all three creatures and Fit/reset on your actual prop.
5. Capture a photo. Confirm camera pixels and the 3D creature are both present, with no controls. Tap Save / share, save the image, cancel sharing, and return to the camera. Browsers without file sharing download a PNG instead.
6. Open/close the guide and capture preview; background/resume Safari. Confirm the camera restarts without duplicate sessions. Stop camera must turn the feed off.
7. Deny camera permission and retry. Use Safari's website camera settings to allow access again. Check the error/retry UI, and try the party lighting/network.

Local validation uses Chromium phone-size emulation, not Safari. A physical iPhone is required to establish actual Safari performance, camera behavior, safe-area rendering, target alignment, and the OS share sheet. Browser tracking does not provide ARKit world tracking, hand occlusion, or reliable recognition without the visible badge.

## Current basket fit

When the design stays attached but the sides/orientation look wrong, use live calibration rather than adding markers or enlarging every dimension together. In **Fit → Angle**, adjust **Turn** (Y/yaw), **Tilt** (X/pitch), and **Lean** (Z/roll) in 5° steps. In **Shape**, adjust width/height/depth independently in 5% steps. **Position** moves left/right, up/down, and back/forward in 5 mm steps, in the badge's local coordinate frame. Keep the badge flat and rigid; these offsets correct the fixed marker-to-basket relationship, not bending/moving targets.

The shared transform in `public/web-ar/basket-fit.js` rotates/scales the model about its centre, then positions it behind the badge. Depth adjustments also adjust the default centre offset so the front surface stays near the target plane. Native rendering uses metres; the browser converts those values into marker-width units. The browser stores calibration at `pumpky-basket-fit-v1`, shared by all three designs. Blocked storage falls back to session memory; native calibration is session-only. Tracking Reset preserves calibration; the panel's Reset fit clears it. No additional markers, pose fusion, or automatic basket scanning are implemented by these controls.

Automated tests check the transform math, controls, saved settings, reload, and reset. They do not establish the final real-basket alignment: that requires adjusting while viewing the actual prop from the front and both sides.

The physical basket is reported as roughly 5–6 inches high. The models use the midpoint, **5½ inches / 139.7 mm**, interpreted as the body only, excluding the real arch handle. Width is estimated at 160 mm and depth at 140 mm from the supplied photo. These are starting dimensions, not an exact scan. The shell is independently widened and deepened from the earlier cup prototype; all three designs and their thumbnails use the same body proportions. The real handle remains visible rather than adding a second virtual arch.

Fit 100% adds a **20% coverage allowance** in all dimensions and raises the shell **8 mm** relative to the marker. The resulting body envelope is approximately 19.2 cm wide × 16.8 cm tall × 16.8 cm deep, leaving the real handle above it. This is deliberate visual coverage, not a revised measurement of the basket; it reduces visible wicker edges and rim intersections seen in the real-prop test.

Edit `src/features/basket-dimensions.json` and regenerate models/previews if measurements change. Both renderers derive the marker-to-centre depth offset from half the coverage-adjusted basket depth. The badge must still be printed at 80 × 100 mm. Use Fit around 100% for final adjustment; stop/start the camera after model changes so its cached GLBs reload.

## Base-marker statue surprise (web)

The compiled target set now contains the original front badge at index 0 and `statue-badge.png` at index 1. `maxTrack: 1` deliberately keeps one target active at a time. The second marker has its own anchor and ignores basket fit calibration. It displays the user-provided statue as a generated transparent photo texture on a double-sided plane, with a small 3D plinth. This is an image-based standee, not a sculpted or reconstructed 360° statue. The normal front badge and all three basket designs remain unchanged in behavior.

Print `/badge/statue-print.html` at actual size (80 × 100 mm) and mount the full badge flat on the basket base. Show it to the camera to activate the statue and the audio controls. Source artwork and print HTML live in `assets/markers/`; `prepare-web.mjs` copies the canonical print assets for both badges before development/export.

The user subsequently provided `/HDD/Downloads/Rene Baterbonia Mama - Sound Effect.mp3`. The original 38,021-byte, roughly three-second file is bundled at `public/audio/rene-baterbonia-mama.mp3`, copied without transcoding. Every deployed browser receives the included soundtrack; no upload/file picker or IndexedDB dependency is required. The earlier local-audio chooser/storage code has been removed. Build/deployment only needs the checked-in asset, not access to `/HDD`.

Audio loops only while the statue target is active and the app is foregrounded with the camera active. It pauses for tracking loss, camera stop, guide, and photo preview. Browser autoplay rejection exposes a **Play sound** tap button; direct play in the tap handler accommodates Safari's user-activation requirement. Loading/decode failures are shown without blocking AR. Audio is not mixed into still PNG captures. Web Audio/Expo audio dependencies are not needed for this browser-only feature; native Viro remains basket-only.

The statue now uses tabletop orientation: the badge is the XY ground plane and the sculpture rises along +Z. The plinth bottom rests on Z=0, its approximately 7.2 cm footprint fits within the badge, and the figure's feet remain centred on the plinth. The photo plane turns about this upright axis toward the camera, never tilting or moving its feet. The figure is approximately 11 cm tall above the plinth. This is best viewed looking down at an angle; directly overhead a thin photo plane necessarily becomes edge-on. A genuine 360° or anatomically correct overhead view requires a real 3D statue mesh.

`npm run test:statue` first verifies badge-plane grounding, footprint, upright orientation, and camera-facing feet pivot. It then tests the real second-marker tracker with a synthetic video feed and the actual bundled MP3: playback without a file picker, PNG capture, pause/resume with photo/camera, and fresh-page reload. Actual iPhone Safari playback and physical badge placement still require a device check.

References: [Expo static rendering](https://docs.expo.dev/router/web/static-rendering/), [Expo publishing/Vercel](https://docs.expo.dev/guides/publishing-websites/), [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [camera secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
