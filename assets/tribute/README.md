# Rene standee asset

`statue-cutout.png` is a transparent, image-based standee texture generated from the user-supplied statue photograph using the built-in image-generation tool. It is not a reconstructed/sculpted human mesh and has no newly generated side or rear views. The browser renderer adds a small 3D plinth and anchors the textured plane to the second marker.

Final prompt:

> Use case: background-extraction. Edit target: supplied photo of a painted basketball-player statue. Create a clean transparent-background full-body cutout of ONLY the central statue: preserve his exact face, upward gaze, pose, body proportions, blue PILIPINAS number 2 jersey, shorts, basketball held in hands, black knee brace, white socks and shoes. Include both feet fully. Remove the entire surrounding tent, background people, flowers, ground, grass, and existing concrete pedestal. Preserve holes of transparency between arms and torso and between legs. Do not repaint, redesign, glamorize, change identity, change jersey text, add accessories or add any other subject. Output tall portrait framing with 3% transparent padding around the isolated complete statue; actual alpha transparency, no background, no ground shadow. This will be used as an image-based AR standee texture.

No audio was generated. The user supplied `/HDD/Downloads/Rene Baterbonia Mama - Sound Effect.mp3`; it is copied byte-for-byte to `public/audio/rene-baterbonia-mama.mp3` (38,021 bytes, approximately three seconds). It ships with the website; there is no file picker or local-audio storage workflow. Tests use the actual bundled MP3.

For tabletop viewing, the standee's +Y axis is rotated onto the badge's +Z surface normal. Its roughly 7.2 cm plinth footprint fits within the 8 cm badge width, with the plinth bottom exactly on the badge plane. The roughly 11 cm photo figure turns about its feet toward the camera, without tipping off the plinth. A slightly angled top-down view works best; this remains a thin photo standee, not a reconstructed overhead/head/back view.
