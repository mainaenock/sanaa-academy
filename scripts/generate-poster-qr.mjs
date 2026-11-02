// Extend the academy's existing vector poster system; embed the supplied QR unchanged.
import satori from 'satori';
import { readFile, writeFile } from 'node:fs/promises';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { fileURLToPath } from 'node:url';

const W = 1080, H = 1350;
const ink = '#10271F', muted = '#61736A', lime = '#B2F277', cream = '#F6F3EB';
const fonts = await Promise.all([400, 600, 800].map(async weight => ({
  name: 'Sanaa', weight, style: 'normal',
  data: await readFile(new URL(`../public/fonts/plus-jakarta-${weight}.ttf`, import.meta.url)),
})));
const qr = await readFile(process.argv[2] || 'C:/Users/maina/Downloads/qr code.png');
const logo = await readFile(new URL('../public/sanaa-academy-mark.svg', import.meta.url));
const portrait = await readFile(new URL('../public/images/enock-maina-transparent.png', import.meta.url));
const nodes = [];
function box(x, y, w, h, bg, r = 0, border) {
  nodes.push({ type: 'div', props: { style: {
    display: 'flex', position: 'absolute', left: x, top: y, width: w, height: h,
    backgroundColor: bg, borderRadius: r, ...(border ? { border: `1px solid ${border}` } : {}),
  } } });
}
function text(label, x, y, size, color = ink, weight = 600, width = 960, spacing = 0) {
  nodes.push({ type: 'div', props: { style: {
    display: 'flex', position: 'absolute', left: x, top: y, width, height: size * 1.4,
    fontFamily: 'Sanaa', fontSize: size, fontWeight: weight, color, lineHeight: 1.15,
    letterSpacing: spacing, whiteSpace: 'nowrap',
  }, children: label } });
}
function image(data, mime, x, y, w, h) {
  nodes.push({ type: 'img', props: {
    src: `data:${mime};base64,${data.toString('base64')}`, width: w, height: h,
    style: { position: 'absolute', left: x, top: y },
  } });
}
function arrow(x, y, color, size = 36) {
  nodes.push({ type: 'svg', props: {
    width: size, height: size, viewBox: '0 0 40 40', style: { position: 'absolute', left: x, top: y },
    children: [{ type: 'path', props: { d: 'M8 30L30 8M9 8H30V29', fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } }],
  } });
}

box(0, 0, W, H, cream);
box(0, 0, W, 7, lime);
image(logo, 'image/svg+xml', 53, 33, 70, 70);
text('sanaa', 137, 39, 31, ink, 800);
text('A C A D E M Y', 139, 79, 10, muted, 800, 200, 2);
box(748, 48, 272, 43, ink, 22);
box(767, 65, 8, 8, lime, 4);
text('ENROLMENT OPEN', 789, 60, 12, '#FFFFFF', 800, 220, 1.2);
box(60, 127, 960, 1, '#D9DED2');

text('AI-POWERED WEB DEVELOPMENT BOOTCAMP', 62, 159, 17, '#3F6B45', 800, 970, 1.2);
text('Your idea.', 56, 201, 91, ink, 800, 980, -4);
text('Your first website.', 56, 304, 80, ink, 800, 990, -3.7);
box(62, 408, 105, 5, lime, 2);
text('Learn to plan, build and launch with AI.', 62, 435, 25, '#4D6256', 400);

// Instructor profile, using the academy's existing portrait and published biography.
box(60, 507, 960, 300, ink, 24);
box(103, 541, 245, 245, '#B2F277', 123);
image(portrait, 'image/png', 84, 532, 280, 264);
text('MEET YOUR INSTRUCTOR', 400, 538, 12, lime, 800, 580, 1.8);
text('Enock Maina', 397, 574, 41, '#FFFFFF', 800, 595, -1.3);
text('Software Engineer · Data Analyst at Uber', 400, 641, 17, '#E5EDDF', 600, 590);
text('Mathematics & Physics Teacher', 400, 673, 17, '#E5EDDF', 600, 590);
box(400, 714, 52, 3, lime, 1);
text('Practical teaching. Real product-building experience.', 400, 738, 14, '#C5D6C5', 400, 590);

const features = [
  ['01', 'Start from zero', 'No coding experience needed.'],
  ['02', 'Learn with a guide', '15 live online lessons.'],
  ['03', 'Build & launch', 'Turn your idea into a website.'],
];
features.forEach(([num, title, sub], i) => {
  const x = 62 + i * 326;
  text(num, x, 839, 12, '#55714A', 800, 50);
  text(title, x, 865, 21, ink, 800, 310, -0.5);
  text(sub, x, 898, 13, muted, 400, 310);
});

box(60, 952, 960, 285, ink, 23);
text('16 NOV — 18 DEC 2026', 88, 980, 25, '#FFFFFF', 800, 690, -0.5);
text('5 weeks  /  Monday, Wednesday & Friday', 89, 1024, 16, '#D0DCCF', 400, 670);
text('KES 5,000', 86, 1066, 47, lime, 800, 630, -1.8);
text('One payment for the full program', 89, 1130, 14, '#D0DCCF', 400, 650);
box(88, 1175, 220, 38, lime, 19);
text('SCAN TO ENROL', 110, 1187, 12, ink, 800, 210, 1);
arrow(326, 1179, lime, 28);

// White margin supplies the QR quiet zone; the original PNG is embedded byte for byte.
box(747, 977, 244, 234, '#FFFFFF', 12);
image(qr, 'image/png', 771, 997, 196, 196);

text('Learn. Build. Create.', 62, 1263, 18, ink, 800, 600);
text('LIVE ONLINE · BEGINNER FRIENDLY', 666, 1267, 11, muted, 800, 380, 0.6);
text('Domain purchases and paid third-party tools are separate costs.', 62, 1302, 10, muted, 400, 970);

await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm', import.meta.url)));
const tree = { type: 'div', props: { style: { display: 'flex', position: 'relative', width: W, height: H, backgroundColor: cream }, children: nodes } };
const svg = await satori(tree, { width: W, height: H, fonts });
const base = fileURLToPath(new URL('../public/sanaa-bootcamp-poster-qr-instructor', import.meta.url));
await writeFile(`${base}.svg`, svg);
const render = new Resvg(svg, { fitTo: { mode: 'width', value: 2160 } }).render();
await writeFile(`${base}.png`, render.asPng());
console.log(`Saved poster: ${render.width} × ${render.height}; original QR embedded unchanged.`);
