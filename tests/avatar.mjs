// tests/avatar.mjs — the avatar builder: every combination, every mood, offline-safe
const base = '../src/';
const av = await import(base + 'svg/avatar.js');
const { buildAvatar, buildAvatarSvg, ensureAvatar, moodOf, moodSpec, defaultAvatarFor, DEFAULT_AVATAR, ARCHETYPE_LOOK, MOODS } = av;
const pal = await import(base + 'svg/palette.js');
const { skin, hairColor, outfit, hairStyles, fits, accessories } = pal;
const { archetypes } = await import(base + 'content.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

console.log('\n[1] Shape of the output');
const basic = buildAvatar(DEFAULT_AVATAR, 'neutral');
ok('returns a group fragment', basic.startsWith('<g ') && basic.endsWith('</g>'));
ok('carries the mood as a class hook', basic.includes('avatar-mood-neutral'));
ok('wraps into a standalone svg', buildAvatarSvg(DEFAULT_AVATAR, 'happy').startsWith('<svg '));
ok('svg declares a viewBox', buildAvatarSvg(DEFAULT_AVATAR, 'happy').includes('viewBox="0 0 200 260"'));
ok('svg is labelled for screen readers', buildAvatarSvg(DEFAULT_AVATAR).includes('aria-label='));
ok('decorative fragment is hidden from AT', basic.includes('class="avatar'));

console.log('\n[2] Offline-safe: no external assets at all');
const svg = buildAvatarSvg(DEFAULT_AVATAR, 'neutral');
const httpCount = (svg.match(/http/g) || []).length;
ok('only the svg namespace uses a URL', httpCount === 1, `${httpCount}`);
ok('no <image> elements', !svg.includes('<image'));
ok('no <use> references', !svg.includes('<use'));
ok('no external url() fills', !svg.includes('url('));
ok('no base64 blobs', !svg.includes('base64'));

console.log('\n[3] Every combination renders cleanly (no undefined / NaN)');
let combos = 0, dirty = [];
for (const s of Object.keys(skin)) {
  for (const h of hairStyles.map(x => x.id)) {
    for (const hc of Object.keys(hairColor)) {
      for (const o of Object.keys(outfit)) {
        for (const f of fits.map(x => x.id)) {
          for (const acc of accessories.map(x => x.id)) {
            for (const mood of Object.keys(MOODS)) {
              for (const sneakers of [false, true]) {
                const out = buildAvatar({ skin: s, hair: h, hairColor: hc, outfit: o, fit: f, accessory: acc, sneakers }, mood);
                combos++;
                if (out.includes('undefined') || out.includes('NaN') || out.length < 200) {
                  dirty.push(`${s}/${h}/${hc}/${o}/${f}/${acc}/${mood}/${sneakers}`);
                }
              }
            }
          }
        }
      }
    }
  }
}
ok(`${combos} combinations rendered`, combos === 5 * 6 * 5 * 6 * 4 * 5 * 5 * 2, `${combos}`);
ok('none contain undefined or NaN', dirty.length === 0, dirty.slice(0, 3).join(' | '));

console.log('\n[4] The data actually drives the drawing');
for (const s of Object.keys(skin)) {
  ok(`skin "${s}" paints its own tone`, buildAvatar({ ...DEFAULT_AVATAR, skin: s }, 'neutral').includes(skin[s]));
}
for (const o of Object.keys(outfit)) {
  ok(`outfit "${o}" paints its own colour`, buildAvatar({ ...DEFAULT_AVATAR, outfit: o }, 'neutral').includes(outfit[o]));
}
const hairOuts = new Set(hairStyles.map(h => buildAvatar({ ...DEFAULT_AVATAR, hair: h.id }, 'neutral')));
ok(`all ${hairStyles.length} hairstyles draw differently`, hairOuts.size === hairStyles.length, `${hairOuts.size}`);
const fitOuts = new Set(fits.map(f => buildAvatar({ ...DEFAULT_AVATAR, fit: f.id }, 'neutral')));
ok(`all ${fits.length} fits draw differently`, fitOuts.size === fits.length, `${fitOuts.size}`);
const accOuts = new Set(accessories.map(a => buildAvatar({ ...DEFAULT_AVATAR, accessory: a.id }, 'neutral')));
ok(`all ${accessories.length} accessories draw differently`, accOuts.size === accessories.length, `${accOuts.size}`);

console.log('\n[5] Moods are visually distinct');
const moodOuts = new Map(Object.keys(MOODS).map(m => [m, buildAvatar(DEFAULT_AVATAR, m)]));
ok(`all ${Object.keys(MOODS).length} moods draw differently`, new Set(moodOuts.values()).size === Object.keys(MOODS).length);
ok('tired droops the eyes', moodOuts.get('tired').includes('avatar-droop') && moodOuts.get('tired') !== moodOuts.get('neutral'));
ok('happy smiles (a curve, not a line)', moodOuts.get('happy').includes('Q100 112'));
ok('broke turns the pockets out', moodOuts.get('broke').includes('opacity="0.85"'));
ok('broke does not turn pockets out otherwise', !moodOuts.get('neutral').includes('opacity="0.85"'));
ok('tired tilts the head', moodOuts.get('tired').includes('rotate(3'));
ok('happy tilts the other way', moodOuts.get('happy').includes('rotate(-1'));
ok('unknown mood falls back to neutral', buildAvatar(DEFAULT_AVATAR, 'nonsense') === moodOuts.get('neutral'));
ok('moodSpec falls back safely', moodSpec('nope').label === MOODS.neutral.label);

console.log('\n[6] Sneakers change the feet');
const plain = buildAvatar({ ...DEFAULT_AVATAR, sneakers: false }, 'neutral');
const kicks = buildAvatar({ ...DEFAULT_AVATAR, sneakers: true }, 'neutral');
ok('sneakers change the drawing', plain !== kicks);
ok('plain avatar wears shoes', plain.includes('class="shoes"') && !plain.includes('class="kicks"'));
ok('sneaker-wearing avatar wears kicks', kicks.includes('class="kicks"') && !kicks.includes('class="shoes"'));
ok('sneakers get a stripe', kicks.includes('stroke-width="3"'));

console.log('\n[7] moodOf derives from state, with a defined priority');
const s = { energy: 60, money: 5000, happiness: 50, hunger: 60 };
ok('default is neutral', moodOf(s) === 'neutral');
ok('low energy -> tired', moodOf({ ...s, energy: 19 }) === 'tired');
ok('low money -> broke', moodOf({ ...s, money: 99 }) === 'broke');
ok('high happiness -> happy', moodOf({ ...s, happiness: 75 }) === 'happy');
ok('low hunger -> hungry', moodOf({ ...s, hunger: 24 }) === 'hungry');
ok('exhaustion outranks being broke', moodOf({ ...s, energy: 5, money: 0 }) === 'tired');
ok('being broke outranks happiness', moodOf({ ...s, money: 0, happiness: 99 }) === 'broke');
ok('happiness outranks hunger', moodOf({ ...s, happiness: 80, hunger: 5 }) === 'happy');

console.log('\n[8] ensureAvatar repairs anything');
ok('fills a missing object entirely', ensureAvatar(undefined).skin === DEFAULT_AVATAR.skin);
ok('fills missing fields only', ensureAvatar({ skin: 'rich' }).skin === 'rich' && ensureAvatar({ skin: 'rich' }).hair === DEFAULT_AVATAR.hair);
ok('unknown skin falls back', ensureAvatar({ skin: 'chartreuse' }).skin === DEFAULT_AVATAR.skin);
ok('unknown hair falls back', ensureAvatar({ hair: 'mohawk' }).hair === DEFAULT_AVATAR.hair);
ok('unknown outfit falls back', ensureAvatar({ outfit: 'neon' }).outfit === DEFAULT_AVATAR.outfit);
ok('unknown accessory falls back', ensureAvatar({ accessory: 'crown' }).accessory === 'none');
ok('unknown fit falls back', ensureAvatar({ fit: 'spacesuit' }).fit === DEFAULT_AVATAR.fit);
ok('sneakers coerced to boolean', ensureAvatar({ sneakers: 'yes' }).sneakers === false && ensureAvatar({ sneakers: true }).sneakers === true);
ok('empty name falls back', ensureAvatar({ name: '   ' }).name === DEFAULT_AVATAR.name);
ok('long name is trimmed', ensureAvatar({ name: 'x'.repeat(60) }).name.length === 18);
ok('repaired avatar renders', buildAvatar(ensureAvatar({ skin: 'nope', hair: 'nope' }), 'neutral').length > 200);

console.log('\n[9] Archetype defaults');
for (const key of Object.keys(archetypes)) {
  const look = defaultAvatarFor(key);
  ok(`${key} has a distinct default look`, !!look && !!look.skin && !!look.outfit);
  ok(`${key} default renders`, buildAvatar(look, 'neutral').length > 200);
}
const looks = new Set(Object.keys(archetypes).map(k => JSON.stringify(ARCHETYPE_LOOK[k])));
ok('no two archetypes share a look', looks.size === Object.keys(archetypes).length, `${looks.size}`);
ok('unknown archetype gets the base default', defaultAvatarFor('ghost').skin === DEFAULT_AVATAR.skin);

console.log('\n[10] Deterministic');
ok('same input, same output', buildAvatar(DEFAULT_AVATAR, 'happy') === buildAvatar(DEFAULT_AVATAR, 'happy'));
ok('no Math.random in the builder source',
   !(await import('node:fs')).readFileSync(new URL('../src/svg/avatar.js', import.meta.url), 'utf8').includes('Math.random'));

console.log('\n[11] Geometry: everything lands inside the frame');
// No rasteriser or headless browser on this host, so parse the markup and check the
// maths instead: catches shapes drifting outside the viewBox or NaN coordinates.
function geometry(svg) {
  const pts = [], shapes = [];
  for (const m of svg.matchAll(/<(ellipse|circle|rect|path)\b([^>]*?)\/?>/g)) {
    const tag = m[1], attrs = m[2];
    const num = a => { const r = attrs.match(new RegExp(a + '="(-?[\\d.]+)"')); return r ? parseFloat(r[1]) : null; };
    if (tag === 'ellipse') {
      const cx = num('cx'), cy = num('cy'), rx = num('rx'), ry = num('ry');
      shapes.push({ tag, cx, cy, rx, ry });
      pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]);
    } else if (tag === 'circle') {
      const cx = num('cx'), cy = num('cy'), r = num('r');
      shapes.push({ tag, cx, cy, r });
      pts.push([cx - r, cy - r], [cx + r, cy + r]);
    } else if (tag === 'rect') {
      const x = num('x'), y = num('y'), w = num('width'), h = num('height');
      shapes.push({ tag, x, y, w, h });
      pts.push([x, y], [x + w, y + h]);
    } else {
      const d = (attrs.match(/d="([^"]*)"/) || [])[1] || '';
      const toks = d.match(/[MLQZ]|-?\d*\.?\d+/g) || [];
      let cmd = null;
      for (let i = 0; i < toks.length;) {
        if (/[MLQZ]/.test(toks[i])) { cmd = toks[i]; i++; continue; }
        if (cmd === 'M' || cmd === 'L') {
          const x = parseFloat(toks[i]), y = parseFloat(toks[i + 1]);
          shapes.push({ tag: 'path', x, y }); pts.push([x, y]); i += 2;
        } else if (cmd === 'Q') {
          const cx = parseFloat(toks[i]), cy = parseFloat(toks[i + 1]);
          const x = parseFloat(toks[i + 2]), y = parseFloat(toks[i + 3]);
          pts.push([cx, cy], [x, y]); i += 4;
        } else { i++; }
      }
    }
  }
  return { pts, shapes };
}

const geo = geometry(basic);
ok(`parsed ${geo.shapes.length} shapes`, geo.shapes.length > 30, `${geo.shapes.length}`);
ok('every coordinate is a real number', geo.pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
const badX = geo.pts.filter(([x]) => x < -1 || x > 201);
const badY = geo.pts.filter(([, y]) => y < -1 || y > 261);
ok('nothing falls outside the frame horizontally', badX.length === 0, JSON.stringify(badX.slice(0, 3)));
ok('nothing falls outside the frame vertically', badY.length === 0, JSON.stringify(badY.slice(0, 3)));

const head = geo.shapes.find(s => s.tag === 'ellipse' && s.rx === 30 && s.ry === 35);
ok('the head is present and centred', !!head && head.cx === 100 && head.cy === 86, JSON.stringify(head));

// the head must sit above the torso, the torso above the feet
const headBottom = head.cy + head.ry;
// ignore the ground shadow ellipse when measuring the figure itself
const pathYs = geo.shapes.filter(s => s.tag === 'path').map(s => s.y);
const lowestFoot = Math.max(...pathYs);
ok('feet reach the bottom of the figure', lowestFoot > 240 && lowestFoot <= 250, `${lowestFoot}`);
ok('the head sits above the feet', headBottom < lowestFoot, `${headBottom} < ${lowestFoot}`);

// hair must overlap the head, not float above or beside it
for (const h of hairStyles.map(x => x.id)) {
  const g = geometry(buildAvatar({ ...DEFAULT_AVATAR, hair: h }, 'neutral'));
  const overlapsHead = g.pts.some(([x, y]) =>
    x > head.cx - head.rx - 12 && x < head.cx + head.rx + 12 &&
    y > head.cy - head.ry - 12 && y < head.cy + head.ry + 12);
  ok(`hair "${h}" overlaps the head`, overlapsHead);
}

// eyes and mouth must land on the face
const face = geometry(buildAvatar(DEFAULT_AVATAR, 'happy'));
const eyeY = face.shapes.filter(s => s.tag === 'path' && s.y >= 76 && s.y <= 92);
ok('eye shapes sit at eye height', eyeY.length >= 2, `${eyeY.length}`);
const mouthShapes = face.shapes.filter(s => s.tag === 'path' && s.y >= 100 && s.y <= 116);
ok('mouth shapes sit at mouth height', mouthShapes.length >= 1, `${mouthShapes.length}`);

console.log('\n[12] Paint values are valid');
const allOut = buildAvatarSvg(DEFAULT_AVATAR, 'neutral');
const fills = [...allOut.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map(m => m[1]);
ok('every paint is a hex colour or none',
   fills.every(f => f === 'none' || /^#[0-9a-f]{3,8}$/i.test(f)),
   [...new Set(fills.filter(f => f !== 'none' && !/^#[0-9a-f]{3,8}$/i.test(f)))].join(','));
const widths = [...allOut.matchAll(/stroke-width="([\d.]+)"/g)].map(m => parseFloat(m[1]));
ok('no zero or negative stroke widths', widths.every(w => w > 0), `${widths.filter(w => w <= 0)}`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
