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

References: [Expo static rendering](https://docs.expo.dev/router/web/static-rendering/), [Expo publishing/Vercel](https://docs.expo.dev/guides/publishing-websites/), [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [camera secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
