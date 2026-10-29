import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function RootHTML({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return <html lang="en" {...htmlAttributes}>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#151219" />
      <meta name="description" content="Dress your Halloween basket in a little augmented-reality magic. Pick a creature, scan your Pumpky badge, and capture a photo." />
      <title>Pumpky · A little Halloween magic</title>
      <ScrollViewStyleReset />
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { margin: 0; background: #151219; }
        #root { height: 100%; height: 100dvh; overflow: hidden; }
      ` }} />
      {headNodes}
    </head>
    <body {...bodyAttributes}>{children}{bodyNodes}</body>
  </html>;
}
