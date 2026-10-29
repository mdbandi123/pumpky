import { copyFile, mkdir } from 'node:fs/promises';

// Publish the canonical printable target without maintaining duplicate source assets.
const destination = new URL('../public/badge/', import.meta.url);
await mkdir(destination, { recursive: true });
await Promise.all(['print.html', 'pumpky-badge.png', 'statue-print.html', 'statue-badge.png'].map((name) =>
  copyFile(new URL('../assets/markers/' + name, import.meta.url), new URL(name, destination))
));
