// Optional regeneration tool. Renderers are included in the locked vinext dependency tree.
import { readFile, writeFile } from 'node:fs/promises';
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
const fontPath = process.argv[2];
if (!fontPath)
  throw new Error(
    'Provide an absolute path to a licensed .ttf font for static image regeneration.',
  );
const font = await readFile(fontPath);
const block = (style, children) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});
const graphic = block(
  {
    width: '100%',
    height: '100%',
    padding: '70px 85px',
    backgroundColor: '#111a2c',
    color: 'white',
    fontFamily: 'Sanaa',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  [
    block({ alignItems: 'center', gap: 18, fontSize: 36, fontWeight: 700 }, [
      {
        type: 'img',
        props: {
          src:
            'data:image/svg+xml;base64,' +
            (await readFile(new URL('../public/sanaa-academy-mark.svg', import.meta.url))).toString(
              'base64',
            ),
          width: 80,
          height: 80,
        },
      },
      'sanaa academy',
    ]),
    block(
      {
        flexDirection: 'column',
        fontSize: 76,
        fontWeight: 700,
        letterSpacing: -3,
        lineHeight: 1.08,
      },
      [block({}, 'Learn to build'), block({ color: '#b4ef80' }, 'what’s next.')],
    ),
    block(
      { fontSize: 25, color: '#adbad1' },
      'Practical skills. Human guidance. New possibilities.',
    ),
    block(
      { fontSize: 17, letterSpacing: 3, color: '#adbad1' },
      'BEGINNER FRIENDLY  ·  LIVE ONLINE  ·  REAL PROJECTS',
    ),
  ],
);
const svg = await satori(graphic, {
  width: 1200,
  height: 630,
  fonts: [
    { name: 'Sanaa', data: font, weight: 400, style: 'normal' },
    { name: 'Sanaa', data: font, weight: 700, style: 'normal' },
  ],
});
await initWasm(
  await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)),
);
const image = new Resvg(svg);
await writeFile(new URL('../public/og-image.svg', import.meta.url), svg);
await writeFile(new URL('../public/og-image.png', import.meta.url), image.render().asPng());
const logo = await satori(
  block(
    {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'Sanaa',
      color: '#161616',
    },
    [
      {
        type: 'img',
        props: {
          src:
            'data:image/svg+xml;base64,' +
            (await readFile(new URL('../public/sanaa-academy-mark.svg', import.meta.url))).toString(
              'base64',
            ),
          width: 130,
          height: 130,
        },
      },
      block({ flexDirection: 'column' }, [
        block({ fontSize: 62, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }, 'sanaa'),
        block({ fontSize: 16, letterSpacing: 8, marginTop: 12 }, 'ACADEMY'),
      ]),
    ],
  ),
  {
    width: 370,
    height: 150,
    fonts: [
      { name: 'Sanaa', data: font, weight: 400 },
      { name: 'Sanaa', data: font, weight: 700 },
    ],
  },
);
await writeFile(new URL('../public/sanaa-academy-logo.svg', import.meta.url), logo);
await writeFile(
  new URL('../public/sanaa-academy-logo.png', import.meta.url),
  new Resvg(logo).render().asPng(),
);
console.log(
  'Created public/og-image.png at 1200 × 630. The source font is not copied to the project.',
);
