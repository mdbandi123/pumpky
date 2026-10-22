# Pumpky AR feasibility

Implementation update: the project has since moved to Expo 57 / RN 0.86 after the SDK 58 dependency experiment failed. See [the current build guide](./feasibility-build.md). Version observations below describe the initial research snapshot.

Researched 2026-10-22. This is a feasibility recommendation, not a verified device prototype. No application dependencies or configuration were changed.

## Recommendation

Build the illusion around **one known basket, a flat image marker fixed rigidly to it, and a matching virtual shell**. Track the marker's pose, place the shell at a calibrated offset, and switch the shell's Halloween materials or attachments. This is an engineering recommendation inferred from the tracking capabilities below. The effect appears on the phone screen; changing the physical basket's appearance for unaided viewers would require projection or another physical display.

The difficult part is keeping the design registered to the basket. Selecting designs is straightforward after that works. A blank, curved basket is a poor starting point for feature-based tracking. A dangling tag is also unsuitable: its pose changes independently of the basket. Prefer a decorative flat badge mounted rigidly to the front, initially with a limited viewing range. A marker on the table only works while the basket remains in its calibrated location.

## Current project compatibility

Local `package.json` declares Expo `~58.0.17`, React Native `0.88.0`, and React `19.3.0`; the repository has `package-lock.json`, not `bun.lock`. The matching [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/) and [Expo documentation index](https://docs.expo.dev/llms.txt) were consulted.

The maintained package is `@reactvision/react-viro`. At research time the npm `latest` endpoint reports **3.0.3**, with peer ranges `expo >=57.0.0 <58.0.0` and `react-native >=0.86.0 <0.87.0`. Those ranges exclude this project's versions. The same ranges appear in the [maintainer's package manifest](https://github.com/ReactVision/viro/blob/main/package.json); the [published registry metadata](https://registry.npmjs.org/@reactvision%2Freact-viro/latest) was checked directly. Do not interpret “supports Expo” as verified SDK 58 compatibility.

Viro provides an Expo config plugin, requires a custom native build, and does not run in Expo Go. Its integration guide claims testing through Expo 57 / RN 0.86. Cloud/geospatial credentials concern those optional services; they are not a reason to introduce a backend into this local marker experience. [Viro Expo integration](https://viro-community.readme.io/docs/integrating-with-expo).

Before implementation, either prove compatibility in an isolated SDK 58 build or deliberately use a supported SDK 57 / RN 0.86 baseline. The latter changes the project's platform baseline and should be an explicit implementation decision. Neither was attempted during this research.

## Tracking choices

| Approach | Suitability for Pumpky | Evidence and limits |
| --- | --- | --- |
| Viro image target + calibrated basket model | Best native candidate for a controlled party prop | Viro exposes image targets and marker children; both phone platforms support image tracking. The exact native build and moving-marker behavior still need device validation. [Image recognition](https://viro-community.readme.io/docs/image-recognition), [platform overview](https://viro-community.readme.io/docs/overview). |
| Recognize the plain basket directly | High risk for a one-off | Apple's reference-object scanning prefers rigid, detailed, textured objects over plain or reflective ones; it needs stable lighting. [Apple object scanning](https://developer.apple.com/documentation/ARKit/scanning-and-detecting-3d-objects). |
| Viro scanned-object marker | Possible iOS experiment, not a cross-platform solution | `ViroARObjectMarker` explicitly excludes Android and uses `.arobject` assets. Detection of a reference object is not proof of reliable continuous tracking of a carried basket. [Object marker reference](https://viro-community.readme.io/docs/viroarobjectmarker). |
| ML basket detector or color mask | Useful recognition/effect aid, insufficient by itself | Viro's object detector produces boxes and labels; optional world-position projection is currently iOS-only. A box or position does not supply the full basket rotation, mesh, or surface coordinates required for a fitted 3D design. [Detector reference](https://viro-community.readme.io/docs/viroobjectdetector). The pose limitation is an engineering inference from that output. |
| Fixed basket + manual placement | Useful fallback | ARCore supplies world tracking, planes, and anchors. A manually aligned model can remain in a known location, but it will not follow a basket being moved. [ARCore fundamentals](https://developers.google.com/ar/develop/fundamentals). |
| MindAR + Three.js in a browser | Worth a separate spike if guests must open a link | MindAR provides browser image tracking, face tracking, and Three.js integration. This avoids a native Viro integration but does not solve arbitrary basket geometry/tracking. Actual target phones, browser permissions, performance, and rendering must be tested. [MindAR documentation](https://hiukim.github.io/mind-ar-js-doc/). |

ARCore's image targets must be flat, clearly visible, and initially occupy at least 25% of the frame. Wrapping the target around the basket violates the documented flatness requirement. Providing the printed physical size improves detection. Images can move, but tracking assumes a static pose once an image leaves view. Therefore a party prototype should fade the effect when current tracking is lost rather than leave a convincing-looking stale pose. [ARCore Augmented Images](https://developers.google.com/ar/develop/augmented-images).

For moving targets, ARCore distinguishes full tracking from the last known pose. Device validation should explicitly cover marker concealment and reacquisition. [ARCore tracking-state guidance](https://developers.google.com/ar/develop/java/augmented-images/guide).

Apple also documents a newer reference-object workflow using Create ML and `trackingObjects`; it distinguishes that format from older `.arobject` detection files. Do not assume Viro's existing object-marker API exposes this newer native capability. It is a possible native iOS research branch, with OS/device/model tooling requirements still to establish. [Apple reference-object tracking](https://developer.apple.com/documentation/visionos/using-a-reference-object-with-arkit-in-ios).

## Visual and party constraints

The following are design implications, not capabilities established by a library demo:

- Use a measured basket and a fitted mesh. A large virtual pumpkin placed near a marker is much easier than a convincing replacement of the real surface.
- A virtual shell can cover the basket in the camera feed, but edges, the handle, holes, and the rim require deliberate modeling. Fingers in front of the basket need masking or depth occlusion to remain in front of the effect; leave that outside the first proof unless essential.
- Choose a rigid, matte prop and a well-lit viewing spot. Colored party lights, glare, blur, fingers covering the marker, and steep viewing angles are likely failure cases. Test at the intended venue rather than infer success from a bright desk demo.
- A mostly plain rotationally symmetric basket gives weak orientation cues. Its color helps isolate pixels but does not uniquely determine 3D rotation.
- Cache designs locally and prove the final party build works without a development server or venue internet.

## Distribution and next experiment

For one or a few known phones, a native internal build is practical: Android uses an APK, while iOS ad hoc installation requires a paid developer account and registered device UDIDs. New devices can require a new build or re-signing. This makes “everyone scans a QR code at the door” materially different from “one host phone does the trick.” [Expo internal distribution](https://docs.expo.dev/build/internal-distribution/).

A preview/internal build can run without a development server. External TestFlight introduces Apple's test review process, so do not leave distribution until party day. [Expo internal-build tutorial](https://docs.expo.dev/tutorial/eas/internal-distribution-builds/), [distribution overview](https://docs.expo.dev/review/overview/).

First experiment: one real phone, one basket, one rigid printed marker, one untextured fitted shell, and two selectable materials. Verify that a native build installs, acquires the marker, follows slow translation/rotation, loses/reacquires gracefully, and remains aligned under expected party lighting. Only then invest in several finished designs. Choose acceptance criteria with the user after confirming phone/platform, whether the basket moves, marker tolerance, and whether guests need their own installations.

No device testing has been performed. SDK 58 integration, arbitrary object tracking, convincing hand occlusion, and all-angle marker coverage remain unproven.
