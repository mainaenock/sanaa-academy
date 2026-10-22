import satori from 'satori';
import { readFile, writeFile } from 'node:fs/promises';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

const W = 1080;
const H = 1350;
const fonts = await Promise.all(
  [
    ['800', 800],
    ['600', 600],
    ['400', 400],
  ].map(async ([file, weight]) => ({
    name: 'Plus Jakarta Sans',
    weight,
    style: 'normal',
    data: await readFile(new URL(`../public/fonts/plus-jakarta-${file}.ttf`, import.meta.url)),
  })),
);

function box(x, y, w, h, bg, r = 0, border) {
  const style = {
    display: 'flex', position: 'absolute', left: x, top: y, width: w, height: h,
    backgroundColor: bg, borderRadius: r,
  };
  if (border) style.border = `1px solid ${border}`;
  return { type: 'div', props: { style } };
}

function text(label, x, baseline, size, color, weight = 600, options = {}) {
  const height = size * 1.35;
  const centered = options.align === 'center';
  const width = options.width ?? 940;
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', position: 'absolute', left: centered ? x - width / 2 : x,
        top: baseline - height * 0.82, width, height, alignItems: 'center',
        justifyContent: centered ? 'center' : 'flex-start',
        fontFamily: 'Plus Jakarta Sans', fontSize: size, fontWeight: weight,
        color, lineHeight: 1, letterSpacing: options.spacing ?? 0,
        whiteSpace: options.wrap ? 'normal' : 'nowrap',
      },
      children: label,
    },
  };
}

function pill(label, x, y, w, h, bg, color, size = 12) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', position: 'absolute', left: x, top: y, width: w, height: h,
        borderRadius: h / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Plus Jakarta Sans', fontSize: size, fontWeight: 800, color, letterSpacing: 0.5,
      },
      children: label,
    },
  };
}

function mark(x, y) {
  return {
    type: 'svg', props: {
      width: 54, height: 54, viewBox: '0 0 80 80',
      style: { position: 'absolute', left: x, top: y },
      children: [
        { type: 'path', props: { d: 'M8 35C20 32 30 36 40 43C50 36 60 32 72 35V62C59 60 49 64 40 70C31 64 21 60 8 62V35Z', fill: '#fff' } },
        { type: 'path', props: { d: 'M13 40C22 39 30 42 37 47V61C29 56 22 54 13 55V40Z', fill: '#BB162B' } },
        { type: 'path', props: { d: 'M43 47C50 42 58 39 67 40V55C58 54 51 56 43 61V47Z', fill: '#078442' } },
        { type: 'path', props: { d: 'M40 10L70 23L40 36L10 23L40 10Z', fill: '#A9EF70' } },
      ],
    },
  };
}

function makeQrCodeSvg(payload, left, top, size) {
  const version = 2;
  const side = version * 4 + 17;
  const dataCodewords = 34;
  const eccCodewords = 10;
  const gfMultiply = (x, y) => {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z &= 0xff;
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  };
  const bits = [];
  const appendBits = (value, count) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  const bytes = [...new TextEncoder().encode(payload)];
  if (bytes.length > 32) throw new Error('The QR payload is too long for this QR version.');
  appendBits(0b0100, 4);
  appendBits(bytes.length, 8);
  for (const byte of bytes) appendBits(byte, 8);
  const capacity = dataCodewords * 8;
  appendBits(0, Math.min(4, capacity - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < dataCodewords; pad ^= 0xec ^ 0x11) data.push(pad);

  let generator = [1];
  let root = 1;
  for (let i = 0; i < eccCodewords; i++) {
    const next = new Array(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j++) {
      next[j] ^= generator[j];
      next[j + 1] ^= gfMultiply(generator[j], root);
    }
    generator = next;
    root = gfMultiply(root, 2);
  }
  const ecc = new Array(eccCodewords).fill(0);
  for (const byte of data) {
    const factor = byte ^ ecc.shift();
    ecc.push(0);
    for (let i = 0; i < eccCodewords; i++) ecc[i] ^= gfMultiply(generator[i + 1], factor);
  }
  const allBits = [...data, ...ecc].flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));

  const modules = Array.from({ length: side }, () => new Array(side).fill(false));
  const reserved = Array.from({ length: side }, () => new Array(side).fill(false));
  const setFunction = (x, y, dark) => {
    if (x >= 0 && x < side && y >= 0 && y < side) {
      modules[y][x] = dark;
      reserved[y][x] = true;
    }
  };
  const finder = (cx, cy) => {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const distance = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        setFunction(cx + dx, cy + dy, distance <= 1 || distance === 3);
      }
    }
  };
  finder(0, 0);
  finder(side - 7, 0);
  finder(0, side - 7);
  for (let i = 8; i < side - 8; i++) {
    setFunction(i, 6, i % 2 === 0);
    setFunction(6, i, i % 2 === 0);
  }
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      setFunction(18 + dx, 18 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  // Error correction level L, mask pattern 0.
  const formatData = (0b01 << 3) | 0;
  let remainder = formatData;
  for (let i = 0; i < 10; i++) remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  const formatBits = ((formatData << 10) | remainder) ^ 0x5412;
  for (let i = 0; i <= 5; i++) setFunction(8, i, ((formatBits >>> i) & 1) !== 0);
  setFunction(8, 7, ((formatBits >>> 6) & 1) !== 0);
  setFunction(8, 8, ((formatBits >>> 7) & 1) !== 0);
  setFunction(7, 8, ((formatBits >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i++) setFunction(14 - i, 8, ((formatBits >>> i) & 1) !== 0);
  for (let i = 0; i < 8; i++) setFunction(side - 1 - i, 8, ((formatBits >>> i) & 1) !== 0);
  for (let i = 8; i < 15; i++) setFunction(8, side - 15 + i, ((formatBits >>> i) & 1) !== 0);
  setFunction(8, side - 8, true);

  let bitIndex = 0;
  for (let right = side - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < side; vert++) {
      const y = ((right + 1) & 2) === 0 ? side - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (!reserved[y][x]) {
          const bit = bitIndex < allBits.length ? allBits[bitIndex] : 0;
          bitIndex++;
          modules[y][x] = (bit ^ (((x + y) % 2 === 0) ? 1 : 0)) !== 0;
        }
      }
    }
  }

  const path = modules.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`M${x + 4} ${y + 4}h1v1h-1z`] : [])).join('');
  return {
    type: 'svg',
    props: {
      width: size, height: size, viewBox: '0 0 33 33',
      style: { position: 'absolute', left, top },
      children: [
        { type: 'rect', props: { x: 0, y: 0, width: 33, height: 33, fill: '#FFFFFF' } },
        { type: 'path', props: { d: path, fill: '#101D19' } },
      ],
    },
  };
}

const nodes = [];
const add = (node) => nodes.push(node);

// Dark, high-contrast poster inspired by the strong central typography in the supplied event samples.
add(box(0, 0, W, H, '#101D19'));
add(box(0, 0, W, 7, '#A9EF70'));
// Subtle geometric light field behind the hero illustration.
add({ type: 'div', props: { style: { display: 'flex', position: 'absolute', left: 710, top: 160, width: 470, height: 470, borderRadius: '50%', backgroundColor: '#17352B' } } });
add({ type: 'div', props: { style: { display: 'flex', position: 'absolute', left: 795, top: 245, width: 300, height: 300, borderRadius: '50%', backgroundColor: '#234A39' } } });

add(box(58, 42, 58, 58, '#20372D', 16));
add(mark(60, 47));
add(text('sanaa', 132, 75, 27, '#FFFFFF', 800));
add(text('A C A D E M Y', 134, 98, 10, '#B6C5BB', 700, { spacing: 3 }));
add(pill('NOV 09 — DEC 18, 2026  ·  LIVE ONLINE', 651, 54, 371, 42, '#20372D', '#D8E9D8', 11));

add(text('A SIX-WEEK, BEGINNER-FRIENDLY BOOTCAMP', 64, 166, 14, '#A9EF70', 800, { spacing: 2 }));
add(text('BUILD YOUR', 58, 258, 77, '#F7F4E9', 800, { spacing: -3 }));
add(text('FIRST WEBSITE', 58, 347, 77, '#A9EF70', 800, { spacing: -3 }));
add(text('with AI — from first idea to launch.', 66, 391, 21, '#D1DBD2', 500));

// Hero browser: a clear, polished visual stand-in for the learner's finished project.
add(box(66, 438, 948, 350, '#21352D', 26, '#3B5749'));
add(box(84, 456, 912, 44, '#2C4439', 14));
add({ type: 'div', props: { style: { display: 'flex', position: 'absolute', left: 104, top: 471, width: 13, height: 13, borderRadius: '50%', backgroundColor: '#F27C5B' } } });
add({ type: 'div', props: { style: { display: 'flex', position: 'absolute', left: 126, top: 471, width: 13, height: 13, borderRadius: '50%', backgroundColor: '#E7BD65' } } });
add({ type: 'div', props: { style: { display: 'flex', position: 'absolute', left: 148, top: 471, width: 13, height: 13, borderRadius: '50%', backgroundColor: '#A9EF70' } } });
add(text('YOUR PROJECT  /  HOMEPAGE', 538, 484, 11, '#D5E2D8', 700, { align: 'center', width: 450, spacing: 1 }));
add(box(85, 519, 910, 249, '#F5F1E8', 18));
add(text('A SMALL IDEA, GROWING', 120, 559, 11, '#467A52', 800, { spacing: 1.8 }));
add(text('Make a place for', 120, 617, 34, '#14251E', 800, { spacing: -0.6 }));
add(text('something good.', 120, 658, 34, '#14251E', 800, { spacing: -0.6 }));
add(text('A real website shaped around a problem you care about.', 122, 695, 15, '#65756C', 500));
add(pill('YOUR IDEA HERE', 122, 718, 178, 34, '#14251E', '#F8F5EC', 10));
// A compact source-code card gives the window its developer context.
add(box(710, 551, 245, 183, '#162921', 15));
add(text('THE BUILD', 731, 582, 10, '#A9EF70', 800, { spacing: 1.5 }));
add(box(731, 603, 105, 5, '#74C77C', 2));
add(box(731, 619, 180, 5, '#60776A', 2));
add(box(752, 637, 142, 5, '#D6925C', 2));
add(box(752, 655, 164, 5, '#7A9C82', 2));
add(box(731, 673, 128, 5, '#60776A', 2));
add(box(731, 700, 104, 23, '#A9EF70', 11));
add(text('SHIP IT', 783, 716, 9, '#14251E', 800, { align: 'center', width: 104 }));

add(text('IDEA', 170, 837, 12, '#A9EF70', 800, { align: 'center', width: 180, spacing: 1.2 }));
add(text('DESIGN', 410, 837, 12, '#A9EF70', 800, { align: 'center', width: 180, spacing: 1.2 }));
add(text('BUILD', 650, 837, 12, '#A9EF70', 800, { align: 'center', width: 180, spacing: 1.2 }));
add(text('LAUNCH', 890, 837, 12, '#A9EF70', 800, { align: 'center', width: 180, spacing: 1.2 }));
for (const cx of [170, 410, 650, 890]) {
  add({ type: 'div', props: { style: { display: 'flex', position: 'absolute', left: cx - 17, top: 858, width: 34, height: 34, borderRadius: '50%', backgroundColor: '#A9EF70', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 800, color: '#14251E' }, children: '→' } });
}
add(box(187, 873, 206, 3, '#3C5B49', 2));
add(box(427, 873, 206, 3, '#3C5B49', 2));
add(box(667, 873, 206, 3, '#3C5B49', 2));
add(text('Web foundations  ·  AI tools  ·  Design  ·  Databases  ·  Deployment', 540, 921, 14, '#C5D1C7', 600, { align: 'center', width: 920 }));

add(box(64, 969, 952, 247, '#F5F1E8', 24));
add(text('NEXT COHORT', 101, 1008, 11, '#59705F', 800, { spacing: 1.6 }));
add(text('09 NOV — 18 DEC', 99, 1052, 30, '#14251E', 800, { spacing: -0.4 }));
add(text('2026  ·  SIX WEEKS  ·  ONLINE', 102, 1081, 13, '#64736B', 600));
add(makeQrCodeSvg('https://sanaacademy.co.ke', 391, 1000, 112));
add(text('SCAN TO VISIT', 447, 1128, 9, '#58705F', 800, { align: 'center', width: 140, spacing: 1 }));
add(box(534, 995, 1, 155, '#D9DED3'));
add(text('EARLY FEE  ·  THROUGH 01 NOV', 583, 1008, 11, '#59705F', 800, { spacing: 1.2 }));
add(text('KES 8,000', 580, 1057, 38, '#216236', 800, { spacing: -0.4 }));
add(text('Regular fee  KES 10,000', 584, 1085, 13, '#64736B', 500));
add(pill('REGISTRATION OPEN', 581, 1110, 260, 46, '#E96449', '#FFFFFF', 12));
add(text('PAY THROUGH', 540, 1175, 10, '#58705F', 800, { align: 'center', width: 450, spacing: 1.3 }));
add(text('www.sanaacademy.co.ke', 540, 1198, 16, '#216236', 800, { align: 'center', width: 450 }));
add(text('NO CODING EXPERIENCE NEEDED', 540, 1230, 10, '#58705F', 800, { align: 'center', width: 450, spacing: 1.1 }));

add(text('Sanaa Academy  ·  Learn. Build. Create.', 540, 1286, 17, '#F4F1E7', 700, { align: 'center', width: 900 }));

await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)));
const tree = { type: 'div', props: { style: { display: 'flex', position: 'relative', width: W, height: H, backgroundColor: '#101D19' }, children: nodes } };
const svg = await satori(tree, { width: W, height: H, fonts });
await writeFile(new URL('../public/ai-web-development-bootcamp-poster-pro.svg', import.meta.url), svg);
const png = new Resvg(svg).render();
await writeFile(new URL('../public/ai-web-development-bootcamp-poster-pro.png', import.meta.url), png.asPng());
console.log(`Professional poster: ${png.width}x${png.height}`);
