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

const variants = [
  {
    file: 'ai-web-development-bootcamp-poster-editorial',
    name: 'The first website',
    bg: '#F5F1E8',
    text: '#14251E',
    muted: '#64736B',
    accent: '#A8E875',
    secondary: '#EE7C5B',
    panel: '#13231D',
    light: '#FFFFFF',
    render: (add) => {
      add('box', { x: 60, y: 52, w: 56, h: 56, bg: '#14251E', r: 18 });
      add('mark', { x: 72, y: 62, color: '#A8E875' });
      add('text', { x: 132, b: 82, size: 27, weight: 800, color: '#14251E', text: 'sanaa' });
      add('text', { x: 134, b: 103, size: 10, weight: 700, color: '#64736B', spacing: 3, text: 'A C A D E M Y' });
      add('pill', { x: 728, y: 62, w: 292, h: 40, bg: '#E6EDD8', color: '#314A31', text: 'LIVE ONLINE  ·  NOV–DEC 2026' });
      add('text', { x: 70, b: 190, size: 14, weight: 800, color: '#5B8750', spacing: 2.5, text: 'START WITH AN IDEA. LEAVE WITH A WEBSITE.' });
      add('text', { x: 64, b: 281, size: 72, weight: 800, color: '#14251E', spacing: -3, text: 'MAKE YOUR' });
      add('text', { x: 64, b: 365, size: 72, weight: 800, color: '#14251E', spacing: -3, text: 'FIRST WEBSITE' });
      add('text', { x: 70, b: 407, size: 18, weight: 500, color: '#64736B', text: 'Learn to plan, build and launch it with AI.' });
      add('circle', { x: 700, y: 440, w: 300, h: 300, bg: '#E7AB8B' });
      add('box', { x: 366, y: 455, w: 610, h: 325, bg: '#15251F', r: 24, shadow: true });
      add('box', { x: 390, y: 479, w: 562, h: 39, bg: '#263A31', r: 10 });
      add('dot', { x: 407, y: 493, color: '#EE7C5B' });
      add('dot', { x: 426, y: 493, color: '#F5CE70' });
      add('dot', { x: 445, y: 493, color: '#A8E875' });
      add('text', { x: 645, b: 505, size: 10, weight: 600, color: '#C6D4C8', width: 250, align: 'center', text: 'YOUR PROJECT · HOME PAGE' });
      add('box', { x: 390, y: 534, w: 562, h: 221, bg: '#F3F0E7', r: 12 });
      add('text', { x: 420, b: 578, size: 10, weight: 800, color: '#5B8750', spacing: 1.7, text: 'A SMALL IDEA, GROWING' });
      add('text', { x: 420, b: 624, size: 29, weight: 800, color: '#14251E', text: 'Make a place for' });
      add('text', { x: 420, b: 659, size: 29, weight: 800, color: '#14251E', text: 'something good.' });
      add('text', { x: 420, b: 690, size: 12, weight: 400, color: '#64736B', text: 'A web project shaped around a problem you care about.' });
      add('pill', { x: 420, y: 709, w: 145, h: 30, bg: '#14251E', color: '#FFFFFF', text: 'YOUR IDEA HERE' });
      add('text', { x: 72, b: 512, size: 13, weight: 700, color: '#39583B', text: 'A practical path from' });
      add('text', { x: 72, b: 536, size: 13, weight: 700, color: '#39583B', text: 'curiosity to capability.' });
      add('box', { x: 64, y: 836, w: 952, h: 164, bg: '#E8E4D9', r: 22 });
      add('text', { x: 92, b: 875, size: 11, weight: 800, color: '#5B8750', spacing: 2, text: 'SIX-WEEK LEARNING JOURNEY' });
      add('text', { x: 92, b: 924, size: 20, weight: 800, color: '#14251E', text: 'LEARN' });
      add('text', { x: 92, b: 952, size: 12, weight: 500, color: '#64736B', text: 'Web foundations' });
      add('text', { x: 367, b: 924, size: 20, weight: 800, color: '#14251E', text: 'BUILD' });
      add('text', { x: 367, b: 952, size: 12, weight: 500, color: '#64736B', text: 'Design, data & AI tools' });
      add('text', { x: 690, b: 924, size: 20, weight: 800, color: '#14251E', text: 'LAUNCH' });
      add('text', { x: 690, b: 952, size: 12, weight: 500, color: '#64736B', text: 'Deploy your project' });
      add('line', { x: 331, y: 888, w: 1, h: 82, bg: '#CCC8BB' });
      add('line', { x: 651, y: 888, w: 1, h: 82, bg: '#CCC8BB' });
      add('box', { x: 64, y: 1022, w: 952, h: 178, bg: '#14251E', r: 22 });
      add('text', { x: 92, b: 1060, size: 10, weight: 700, color: '#AFC2B1', spacing: 1.4, text: 'PROGRAM DATES' });
      add('text', { x: 92, b: 1094, size: 21, weight: 800, color: '#FFFFFF', text: '09 NOV – 18 DEC 2026' });
      add('text', { x: 92, b: 1123, size: 12, weight: 600, color: '#B4EF80', text: 'Live online  ·  Beginner friendly' });
      add('line', { x: 574, y: 1046, w: 1, h: 106, bg: '#3A4A40' });
      add('text', { x: 616, b: 1060, size: 10, weight: 700, color: '#AFC2B1', spacing: 1.1, text: 'EARLY FEE THROUGH 01 NOV' });
      add('text', { x: 616, b: 1104, size: 32, weight: 800, color: '#B4EF80', text: 'KES 8,000' });
      add('text', { x: 616, b: 1130, size: 12, weight: 500, color: '#D1DBD2', text: 'Regular fee  KES 10,000' });
      add('text', { x: 540, b: 1255, size: 17, weight: 800, color: '#14251E', align: 'center', text: 'REGISTRATION OPEN  ·  SANAA ACADEMY' });
      add('text', { x: 540, b: 1310, size: 10, weight: 700, color: '#64736B', spacing: 2, align: 'center', text: 'LEARN  ·  BUILD  ·  CREATE' });
    },
  },
  {
    file: 'ai-web-development-bootcamp-poster-tech',
    name: 'Idea to internet',
    bg: '#0C1022',
    text: '#F8F7F2',
    muted: '#B1B9D0',
    accent: '#4DE6D1',
    secondary: '#FF6B6B',
    panel: '#171D35',
    light: '#F8F7F2',
    render: (add) => {
      add('grid', { color: '#222A46' });
      add('text', { x: 68, b: 82, size: 28, weight: 800, color: '#FFFFFF', spacing: -1, text: 'sanaa' });
      add('text', { x: 70, b: 103, size: 10, weight: 700, color: '#AEB7D0', spacing: 3, text: 'A C A D E M Y' });
      add('pill', { x: 767, y: 62, w: 245, h: 40, bg: '#18213A', color: '#4DE6D1', text: 'WEB DEV  /  BOOTCAMP 26' });
      add('text', { x: 72, b: 175, size: 12, weight: 800, color: '#4DE6D1', spacing: 2.5, text: 'SIX WEEKS. ONE REAL PROJECT.' });
      add('text', { x: 64, b: 272, size: 78, weight: 800, color: '#FFFFFF', spacing: -4, text: 'IDEA →' });
      add('text', { x: 64, b: 356, size: 78, weight: 800, color: '#4DE6D1', spacing: -4, text: 'INTERNET.' });
      add('text', { x: 72, b: 401, size: 17, weight: 500, color: '#B1B9D0', text: 'Build and launch your first website with AI.' });
      add('box', { x: 72, y: 450, w: 936, h: 397, bg: '#171D35', r: 24, border: '#313A59' });
      add('text', { x: 103, b: 489, size: 10, weight: 700, color: '#8F9BB9', spacing: 2, text: 'PROJECT TERMINAL  ·  YOUR-SITE' });
      add('line', { x: 103, y: 510, w: 874, h: 1, bg: '#303958' });
      add('text', { x: 108, b: 555, size: 15, weight: 600, color: '#FF6B6B', text: '01' });
      add('text', { x: 151, b: 555, size: 15, weight: 600, color: '#E8EAF2', text: 'Describe a problem worth solving' });
      add('pill', { x: 765, y: 528, w: 184, h: 32, bg: '#1E3E48', color: '#4DE6D1', text: 'PLAN THE IDEA' });
      add('line', { x: 103, y: 577, w: 874, h: 1, bg: '#303958' });
      add('text', { x: 108, b: 621, size: 15, weight: 600, color: '#FF6B6B', text: '02' });
      add('text', { x: 151, b: 621, size: 15, weight: 600, color: '#E8EAF2', text: 'Build an interface people can use' });
      add('pill', { x: 765, y: 594, w: 184, h: 32, bg: '#1E3E48', color: '#4DE6D1', text: 'BUILD & TEST' });
      add('line', { x: 103, y: 643, w: 874, h: 1, bg: '#303958' });
      add('text', { x: 108, b: 687, size: 15, weight: 600, color: '#FF6B6B', text: '03' });
      add('text', { x: 151, b: 687, size: 15, weight: 600, color: '#E8EAF2', text: 'Connect data, deploy, share' });
      add('pill', { x: 765, y: 660, w: 184, h: 32, bg: '#1E3E48', color: '#4DE6D1', text: 'SHIP IT' });
      add('box', { x: 103, y: 727, w: 874, h: 89, bg: '#10162B', r: 14 });
      add('text', { x: 127, b: 761, size: 11, weight: 700, color: '#8F9BB9', spacing: 1.5, text: 'YOUR TOOLKIT' });
      add('text', { x: 127, b: 793, size: 14, weight: 700, color: '#FFFFFF', text: 'Web foundations  /  AI coding tools  /  Git  /  Cloud deployment' });
      add('text', { x: 72, b: 898, size: 11, weight: 800, color: '#4DE6D1', spacing: 2, text: 'BEGINNER FRIENDLY  ·  GUIDED PROJECTS  ·  LIVE ONLINE' });
      add('box', { x: 72, y: 933, w: 936, h: 210, bg: '#F8F7F2', r: 22 });
      add('text', { x: 105, b: 977, size: 10, weight: 800, color: '#545C72', spacing: 1.5, text: 'NEXT COHORT' });
      add('text', { x: 105, b: 1021, size: 26, weight: 800, color: '#14192A', text: '09 NOV – 18 DEC' });
      add('text', { x: 105, b: 1048, size: 13, weight: 600, color: '#545C72', text: '2026  ·  Six weeks online' });
      add('line', { x: 540, y: 968, w: 1, h: 121, bg: '#D6D7DC' });
      add('text', { x: 590, b: 977, size: 10, weight: 800, color: '#545C72', spacing: 1.5, text: 'EARLY FEE · THROUGH 01 NOV' });
      add('text', { x: 590, b: 1023, size: 34, weight: 800, color: '#273B2B', text: 'KES 8,000' });
      add('text', { x: 590, b: 1052, size: 13, weight: 600, color: '#545C72', text: 'Regular fee  KES 10,000' });
      add('pill', { x: 757, y: 1067, w: 216, h: 46, bg: '#FF6B6B', color: '#FFFFFF', text: 'REGISTRATION OPEN' });
      add('text', { x: 540, b: 1218, size: 28, weight: 800, color: '#FFFFFF', align: 'center', spacing: -.5, text: 'YOUR IDEA CAN GO LIVE.' });
      add('text', { x: 540, b: 1251, size: 13, weight: 600, color: '#B1B9D0', align: 'center', text: 'Sanaa Academy  ·  Learn  ·  Build  ·  Create' });
      add('line', { x: 72, y: 1295, w: 936, h: 2, bg: '#4DE6D1' });
    },
  },
  {
    file: 'ai-web-development-bootcamp-poster-journey',
    name: 'Build what’s next',
    bg: '#FFF9F1',
    text: '#2E2038',
    muted: '#716477',
    accent: '#DB5E48',
    secondary: '#7E62C6',
    panel: '#2E2038',
    light: '#FFFFFF',
    render: (add) => {
      add('circle', { x: 786, y: 27, w: 252, h: 252, bg: '#F7D7C5' });
      add('circle', { x: 832, y: 76, w: 154, h: 154, bg: '#7E62C6' });
      add('text', { x: 68, b: 82, size: 28, weight: 800, color: '#2E2038', spacing: -1, text: 'sanaa' });
      add('text', { x: 70, b: 103, size: 10, weight: 700, color: '#716477', spacing: 3, text: 'A C A D E M Y' });
      add('pill', { x: 763, y: 60, w: 253, h: 42, bg: '#F5E8DB', color: '#774842', text: 'ENROLLMENT OPEN' });
      add('text', { x: 72, b: 176, size: 12, weight: 800, color: '#DB5E48', spacing: 2.1, text: 'A SIX-WEEK CREATIVE TECH JOURNEY' });
      add('text', { x: 64, b: 264, size: 68, weight: 800, color: '#2E2038', spacing: -3, text: 'LEARN TO BUILD' });
      add('text', { x: 64, b: 342, size: 68, weight: 800, color: '#7E62C6', spacing: -3, text: 'WHAT’S NEXT.' });
      add('text', { x: 72, b: 385, size: 17, weight: 500, color: '#716477', text: 'Your first website, from idea to launch — with AI.' });
      add('box', { x: 72, y: 429, w: 936, h: 341, bg: '#F1EADF', r: 26 });
      add('text', { x: 110, b: 473, size: 11, weight: 800, color: '#DB5E48', spacing: 2, text: 'THE BUILDING BLOCKS' });
      add('line', { x: 166, y: 558, w: 682, h: 4, bg: '#CFBEEB', r: 2 });
      const steps = [
        [150, '01', 'IDEA', 'Plan a project'],
        [326, '02', 'DESIGN', 'Shape the pages'],
        [502, '03', 'BUILD', 'Make it work'],
        [678, '04', 'LAUNCH', 'Share it online'],
        [854, '05', 'GROW', 'Improve over time'],
      ];
      for (const [cx, n, title, caption] of steps) {
        add('circle', { x: cx - 27, y: 532, w: 54, h: 54, bg: '#2E2038' });
        add('text', { x: cx, b: 566, size: 13, weight: 800, color: '#FFFFFF', width: 54, align: 'center', text: n });
        add('text', { x: cx, b: 624, size: 12, weight: 800, color: '#2E2038', width: 128, align: 'center', text: title });
        add('text', { x: cx, b: 653, size: 11, weight: 500, color: '#716477', width: 145, align: 'center', text: caption });
      }
      add('box', { x: 110, y: 692, w: 860, h: 48, bg: '#FFF9F1', r: 14 });
      add('text', { x: 540, b: 722, size: 12, weight: 700, color: '#604F68', align: 'center', text: 'Web foundations  ·  AI tools  ·  Design  ·  Databases  ·  Deployment' });
      add('text', { x: 72, b: 824, size: 12, weight: 800, color: '#DB5E48', spacing: 2, text: 'BEGINNER FRIENDLY  /  LIVE ONLINE  /  PROJECT FIRST' });
      add('text', { x: 68, b: 896, size: 42, weight: 800, color: '#2E2038', spacing: -1.5, text: 'A real website. Built by you.' });
      add('text', { x: 72, b: 932, size: 15, weight: 500, color: '#716477', text: 'Get guided practice, feedback and a project you can share.' });
      add('box', { x: 72, y: 973, w: 936, h: 209, bg: '#2E2038', r: 22 });
      add('text', { x: 106, b: 1016, size: 10, weight: 700, color: '#D4CBE0', spacing: 1.5, text: 'DATES  ·  SIX WEEKS' });
      add('text', { x: 106, b: 1057, size: 24, weight: 800, color: '#FFFFFF', text: '09 NOV – 18 DEC' });
      add('text', { x: 106, b: 1084, size: 13, weight: 600, color: '#D4CBE0', text: '2026  ·  online cohort' });
      add('line', { x: 548, y: 1007, w: 1, h: 125, bg: '#594C64' });
      add('text', { x: 594, b: 1016, size: 10, weight: 700, color: '#D4CBE0', spacing: 1.1, text: 'EARLY FEE · TO 01 NOV' });
      add('text', { x: 594, b: 1064, size: 35, weight: 800, color: '#B4EF80', text: 'KES 8,000' });
      add('text', { x: 594, b: 1091, size: 12, weight: 500, color: '#D4CBE0', text: 'Regular fee  KES 10,000' });
      add('pill', { x: 594, y: 1110, w: 215, h: 45, bg: '#DB5E48', color: '#FFFFFF', text: 'JOIN SANAA ACADEMY' });
      add('text', { x: 540, b: 1240, size: 20, weight: 800, color: '#2E2038', align: 'center', text: 'YOUR NEXT CHAPTER STARTS HERE.' });
      add('text', { x: 540, b: 1280, size: 11, weight: 700, color: '#716477', align: 'center', spacing: 2, text: 'LEARN  ·  BUILD  ·  CREATE' });
    },
  },
];

function makeNode(type, data) {
  if (type === 'text') {
    const height = data.size * 1.3;
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          position: 'absolute',
          left: data.x - (data.align === 'center' ? (data.width ?? 900) / 2 : 0),
          top: data.b - height * 0.82,
          width: data.width ?? 900,
          height,
          alignItems: 'center',
          justifyContent: data.align === 'center' ? 'center' : 'flex-start',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: data.size,
          fontWeight: data.weight,
          color: data.color,
          lineHeight: 1,
          letterSpacing: data.spacing ?? 0,
          whiteSpace: 'nowrap',
        },
        children: data.text,
      },
    };
  }
  if (type === 'pill') {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          position: 'absolute',
          left: data.x,
          top: data.y,
          width: data.w,
          height: data.h,
          borderRadius: data.h / 2,
          backgroundColor: data.bg,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 11,
          fontWeight: 800,
          color: data.color,
          letterSpacing: 0.5,
          whiteSpace: 'nowrap',
        },
        children: data.text,
      },
    };
  }
  const style = {
    display: 'flex',
    position: 'absolute',
    left: data.x,
    top: data.y,
    width: data.w ?? 18,
    height: data.h ?? 18,
    backgroundColor: data.bg ?? data.color,
    borderRadius: type === 'circle' || type === 'dot' ? '50%' : data.r ?? 0,
  };
  if (data.border) style.border = `1px solid ${data.border}`;
  if (data.shadow) style.boxShadow = '0 18px 42px rgba(0,0,0,.24)';
  return { type: 'div', props: { style } };
}

function mark(data) {
  return {
    type: 'svg',
    props: {
      width: 34,
      height: 34,
      viewBox: '0 0 80 80',
      style: { position: 'absolute', left: data.x, top: data.y },
      children: [
        { type: 'path', props: { d: 'M8 35C20 32 30 36 40 43C50 36 60 32 72 35V62C59 60 49 64 40 70C31 64 21 60 8 62V35Z', fill: '#fff' } },
        { type: 'path', props: { d: 'M13 40C22 39 30 42 37 47V61C29 56 22 54 13 55V40Z', fill: '#BB162B' } },
        { type: 'path', props: { d: 'M43 47C50 42 58 39 67 40V55C58 54 51 56 43 61V47Z', fill: '#078442' } },
        { type: 'path', props: { d: 'M40 10L70 23L40 36L10 23L40 10Z', fill: data.color } },
      ],
    },
  };
}

function grid({ color }) {
  const lines = [];
  for (let x = 0; x < W; x += 40) lines.push(makeNode('line', { x, y: 0, w: 1, h: H, bg: color }));
  for (let y = 0; y < H; y += 40) lines.push(makeNode('line', { x: 0, y, w: W, h: 1, bg: color }));
  return lines;
}

await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)));
for (const variant of variants) {
  const nodes = [];
  const add = (type, data) => nodes.push(type === 'mark' ? mark(data) : type === 'grid' ? grid(data) : makeNode(type, data));
  variant.render(add);
  const tree = {
    type: 'div',
    props: {
      style: { display: 'flex', position: 'relative', width: W, height: H, backgroundColor: variant.bg },
      children: nodes.flat(),
    },
  };
  const svg = await satori(tree, { width: W, height: H, fonts });
  await writeFile(new URL(`../public/${variant.file}.svg`, import.meta.url), svg);
  const png = new Resvg(svg).render();
  await writeFile(new URL(`../public/${variant.file}.png`, import.meta.url), png.asPng());
  console.log(`${variant.name}: ${png.width}x${png.height}`);
}
