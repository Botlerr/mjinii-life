// src/svg/avatar.js — the player avatar: a layered SVG built from data.
// Pure: same input always produces the same string, and every unknown value falls
// back to a default so no combination can emit "undefined" or "NaN" into the markup.
import { skin, skinShade, hairColor, outfit, outfitShade, ink, white, hairStyles, fits } from './palette.js';

export const VIEW = { w: 200, h: 260 };

export const DEFAULT_AVATAR = {
  name: 'Mjini',
  skin: 'brown',
  hair: 'coily-afro',
  hairColor: 'black',
  outfit: 'teal',
  fit: 'casual',
  accessory: 'none',
  sneakers: false
};

// Archetype -> default look, so a chosen path already looks like something.
export const ARCHETYPE_LOOK = {
  lapo:    { skin: 'deep',  hair: 'short-crop', outfit: 'rust',   fit: 'casual',     accessory: 'cap' },
  omo:     { skin: 'brown', hair: 'coily-afro', outfit: 'teal',   fit: 'smart',      accessory: 'none' },
  balogun: { skin: 'tan',   hair: 'headwrap',   outfit: 'sand',   fit: 'workwear',   accessory: 'chain' },
  tech:    { skin: 'brown', hair: 'fade',       outfit: 'indigo', fit: 'smart',      accessory: 'glasses' },
  nepo:    { skin: 'light', hair: 'braids',     outfit: 'plum',   fit: 'streetwear', accessory: 'earrings' }
};

const pick = (map, key, fallback) => (key && map[key] !== undefined ? key : fallback);
const hex = (map, key, fallback) => map[pick(map, key, fallback)];

export function defaultAvatarFor(archetypeKey) {
  return { ...DEFAULT_AVATAR, ...(ARCHETYPE_LOOK[archetypeKey] || {}) };
}

// Fills missing/invalid avatar fields. Used on load so old saves get a valid character.
export function ensureAvatar(a) {
  const base = { ...DEFAULT_AVATAR };
  if (a && typeof a === 'object') Object.assign(base, a);
  base.skin = pick(skin, base.skin, DEFAULT_AVATAR.skin);
  base.hair = pick(Object.fromEntries(hairStyles.map(h => [h.id, 1])), base.hair, DEFAULT_AVATAR.hair);
  base.hairColor = pick(hairColor, base.hairColor, DEFAULT_AVATAR.hairColor);
  base.outfit = pick(outfit, base.outfit, DEFAULT_AVATAR.outfit);
  base.fit = pick(Object.fromEntries(fits.map(f => [f.id, 1])), base.fit, DEFAULT_AVATAR.fit);
  base.accessory = pick({ none: 1, cap: 1, glasses: 1, chain: 1, earrings: 1 }, base.accessory, 'none');
  base.sneakers = base.sneakers === true;
  base.name = typeof base.name === 'string' && base.name.trim() ? base.name.trim().slice(0, 18) : DEFAULT_AVATAR.name;
  return base;
}

// ---- mood ------------------------------------------------------------------
// Derived from state, never stored.
export function moodOf(s) {
  if (s.energy < 20) return 'tired';
  if (s.money < 100) return 'broke';
  if (s.happiness >= 75) return 'happy';
  if (s.hunger < 25) return 'hungry';
  return 'neutral';
}

export const MOODS = {
  neutral: { brow: 'flat', eye: 'open',  mouth: 'flat',  tilt: 0,  pockets: false, label: 'Steady' },
  tired:   { brow: 'low',  eye: 'droop', mouth: 'flat',  tilt: 3,  pockets: false, label: 'Exhausted' },
  broke:   { brow: 'sad',  eye: 'down',  mouth: 'frown', tilt: 2,  pockets: true,  label: 'Broke' },
  happy:   { brow: 'up',   eye: 'happy', mouth: 'smile', tilt: -1, pockets: false, label: 'Happy' },
  hungry:  { brow: 'up',   eye: 'wide',  mouth: 'o',     tilt: 0,  pockets: false, label: 'Hungry' }
};

export function moodSpec(mood) {
  return MOODS[mood] || MOODS.neutral;
}

// ---- hair ------------------------------------------------------------------
// Each style is a back layer (behind the head) and a front layer (over it).
function hairStyle(id, c) {
  switch (id) {
    case 'coily-afro':
      return {
        back: `<circle cx="100" cy="70" r="44" fill="${c}"/>
               <circle cx="62" cy="84" r="18" fill="${c}"/>
               <circle cx="138" cy="84" r="18" fill="${c}"/>`,
        front: `<circle cx="74" cy="52" r="13" fill="${c}"/>
                <circle cx="100" cy="42" r="15" fill="${c}"/>
                <circle cx="126" cy="52" r="13" fill="${c}"/>
                <circle cx="86" cy="46" r="11" fill="${c}"/>
                <circle cx="114" cy="46" r="11" fill="${c}"/>`
      };
    case 'short-crop':
      return {
        back: '',
        front: `<path d="M68 74 Q70 40 100 38 Q130 40 132 74 Q124 56 100 54 Q76 56 68 74 Z" fill="${c}"/>`
      };
    case 'braids':
      return {
        back: `<path d="M66 78 Q64 128 74 152 L86 148 Q76 124 78 80 Z" fill="${c}"/>
               <path d="M134 78 Q136 128 126 152 L114 148 Q124 124 122 80 Z" fill="${c}"/>`,
        front: `<path d="M68 76 Q70 38 100 36 Q130 38 132 76 Q122 54 100 52 Q78 54 68 76 Z" fill="${c}"/>
                <path d="M74 44 L86 40 M100 38 L112 42 M124 46 L132 54" stroke="${white}" stroke-width="1.6" opacity="0.35" fill="none"/>`
      };
    case 'headwrap':
      return {
        back: '',
        front: `<path d="M62 70 Q64 34 100 32 Q136 34 138 70 Q134 58 100 56 Q66 58 62 70 Z" fill="${c}"/>
                <path d="M60 66 Q100 50 140 66 Q142 76 138 82 Q100 68 62 82 Q58 76 60 66 Z" fill="${c}"/>
                <path d="M132 60 Q152 54 158 40 Q150 56 136 68 Z" fill="${c}"/>`
      };
    case 'fade':
      return {
        back: '',
        front: `<path d="M70 72 Q72 42 100 40 Q128 42 130 72 Q126 60 100 58 Q74 60 70 72 Z" fill="${c}"/>
                <path d="M70 72 Q74 66 80 64 L80 72 Z M130 72 Q126 66 120 64 L120 72 Z" fill="${c}" opacity="0.55"/>`
      };
    case 'long-coils':
      return {
        back: `<path d="M64 80 Q58 140 70 172 L86 166 Q74 134 78 84 Z" fill="${c}"/>
               <path d="M136 80 Q142 140 130 172 L114 166 Q126 134 122 84 Z" fill="${c}"/>
               <circle cx="100" cy="68" r="42" fill="${c}"/>`,
        front: `<circle cx="76" cy="50" r="12" fill="${c}"/>
                <circle cx="100" cy="42" r="14" fill="${c}"/>
                <circle cx="124" cy="50" r="12" fill="${c}"/>`
      };
    default:
      return { back: '', front: '' };
  }
}

// ---- face ------------------------------------------------------------------
function brows(spec, c) {
  const y = spec.brow === 'low' ? 74 : 70;
  switch (spec.brow) {
    case 'up':  return `<path d="M82 ${y} Q88 ${y - 4} 93 ${y - 1} M107 ${y - 1} Q112 ${y - 4} 118 ${y}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'low': return `<path d="M82 ${y + 3} L93 ${y + 4} M107 ${y + 4} L118 ${y + 3}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'sad': return `<path d="M82 ${y + 4} Q88 ${y} 93 ${y + 3} M107 ${y + 3} Q112 ${y} 118 ${y + 4}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    default:    return `<path d="M82 ${y + 1} L93 ${y + 1} M107 ${y + 1} L118 ${y + 1}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
}

function eyes(spec, c) {
  const L = 88, R = 112, y = 84;
  switch (spec.eye) {
    case 'happy':
      return `<path d="M82 ${y} Q88 ${y - 6} 94 ${y}" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
              <path d="M106 ${y} Q112 ${y - 6} 118 ${y}" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'droop':
      return `<ellipse cx="${L}" cy="${y + 1}" rx="6" ry="4" fill="${white}"/>
              <circle cx="${L}" cy="${y + 2}" r="2.6" fill="${c}"/>
              <path d="M81 ${y - 3} L95 ${y - 3}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
              <ellipse cx="${R}" cy="${y + 1}" rx="6" ry="4" fill="${white}"/>
              <circle cx="${R}" cy="${y + 2}" r="2.6" fill="${c}"/>
              <path d="M105 ${y - 3} L119 ${y - 3}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
    case 'down':
      return `<ellipse cx="${L}" cy="${y + 2}" rx="6" ry="6" fill="${white}"/>
              <circle cx="${L}" cy="${y + 5}" r="3" fill="${c}"/>
              <ellipse cx="${R}" cy="${y + 2}" rx="6" ry="6" fill="${white}"/>
              <circle cx="${R}" cy="${y + 5}" r="3" fill="${c}"/>`;
    case 'wide':
      return `<ellipse cx="${L}" cy="${y}" rx="7" ry="7.5" fill="${white}"/>
              <circle cx="${L}" cy="${y}" r="3.4" fill="${c}"/>
              <ellipse cx="${R}" cy="${y}" rx="7" ry="7.5" fill="${white}"/>
              <circle cx="${R}" cy="${y}" r="3.4" fill="${c}"/>`;
    default:
      return `<ellipse cx="${L}" cy="${y}" rx="6" ry="6.5" fill="${white}"/>
              <circle cx="${L}" cy="${y}" r="3" fill="${c}"/>
              <ellipse cx="${R}" cy="${y}" rx="6" ry="6.5" fill="${white}"/>
              <circle cx="${R}" cy="${y}" r="3" fill="${c}"/>`;
  }
}

function mouth(spec, c) {
  const y = 104;
  switch (spec.mouth) {
    case 'smile': return `<path d="M90 ${y} Q100 ${y + 8} 110 ${y}" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'frown': return `<path d="M90 ${y + 4} Q100 ${y - 3} 110 ${y + 4}" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'o':     return `<ellipse cx="100" cy="${y + 2}" rx="5" ry="6" fill="${ink}" opacity="0.75"/>`;
    default:      return `<path d="M92 ${y + 2} L108 ${y + 2}" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
}

function accessory(a, hairC, skinC) {
  switch (a) {
    case 'cap':
      return `<path d="M64 62 Q68 34 100 32 Q132 34 136 62 Z" fill="${hairC}"/>
              <path d="M136 60 Q156 60 158 68 L134 70 Z" fill="${hairC}"/>
              <rect x="64" y="58" width="72" height="7" rx="3" fill="${white}" opacity="0.25"/>`;
    case 'glasses':
      return `<rect x="78" y="78" width="20" height="13" rx="4" fill="none" stroke="${ink}" stroke-width="2.2"/>
              <rect x="102" y="78" width="20" height="13" rx="4" fill="none" stroke="${ink}" stroke-width="2.2"/>
              <path d="M98 84 L102 84" stroke="${ink}" stroke-width="2.2"/>`;
    case 'chain':
      return `<path d="M88 130 Q100 142 112 130" stroke="${white}" stroke-width="2.4" fill="none"/>
              <circle cx="100" cy="139" r="4" fill="${white}"/>`;
    case 'earrings':
      return `<circle cx="70" cy="96" r="4" fill="none" stroke="${white}" stroke-width="2"/>
              <circle cx="130" cy="96" r="4" fill="none" stroke="${white}" stroke-width="2"/>`;
    default:
      return '';
  }
}

// ---- outfit ----------------------------------------------------------------
function torso(fit, fill, shade, pockets) {
  const body = `<path d="M68 132 Q100 120 132 132 L138 200 Q100 208 62 200 Z" fill="${fill}"/>`;
  const collar = `<path d="M88 126 Q100 138 112 126 Q100 132 88 126 Z" fill="${shade}"/>`;
  const pocketRow = pockets
    ? `<path d="M66 168 L76 176 L66 182 Z" fill="${white}" opacity="0.85"/>
       <path d="M134 168 L124 176 L134 182 Z" fill="${white}" opacity="0.85"/>`
    : '';

  switch (fit) {
    case 'smart':
      return `${body}${collar}
              <path d="M100 136 L100 200" stroke="${shade}" stroke-width="2" opacity="0.8"/>
              <circle cx="100" cy="152" r="2" fill="${shade}"/>
              <circle cx="100" cy="172" r="2" fill="${shade}"/>${pocketRow}`;
    case 'streetwear':
      return `${body}
              <path d="M74 128 Q100 148 126 128 Q120 120 100 118 Q80 120 74 128 Z" fill="${shade}"/>
              <rect x="84" y="152" width="32" height="22" rx="3" fill="${white}" opacity="0.16"/>
              <path d="M84 186 L116 186" stroke="${shade}" stroke-width="3"/>${pocketRow}`;
    case 'workwear':
      return `${body}
              <rect x="76" y="136" width="48" height="52" rx="4" fill="${shade}" opacity="0.55"/>
              <rect x="82" y="146" width="16" height="14" rx="2" fill="${white}" opacity="0.35"/>
              <path d="M108 146 L118 146" stroke="${white}" stroke-width="2.4" opacity="0.5"/>${pocketRow}`;
    default:
      return `${body}${collar}
              <path d="M70 140 Q66 168 68 186" stroke="${shade}" stroke-width="3" fill="none" opacity="0.5"/>
              <path d="M130 140 Q134 168 132 186" stroke="${shade}" stroke-width="3" fill="none" opacity="0.5"/>${pocketRow}`;
  }
}

function feet(sneakers, shade) {
  if (sneakers) {
    return `<g class="kicks">
            <path d="M74 232 L94 232 L94 246 Q84 250 72 246 Z" fill="${white}"/>
            <path d="M106 232 L126 232 L128 246 Q116 250 106 246 Z" fill="${white}"/>
            <path d="M74 240 L94 240" stroke="${shade}" stroke-width="3"/>
            <path d="M106 240 L126 240" stroke="${shade}" stroke-width="3"/></g>`;
  }
  return `<g class="shoes">
          <path d="M74 232 L94 232 L94 244 Q84 248 72 244 Z" fill="${ink}"/>
          <path d="M106 232 L126 232 L128 244 Q116 248 106 244 Z" fill="${ink}"/></g>`;
}

// Full standalone SVG (used by the creator and the scene panel).
export function buildAvatarSvg(avatarInput, moodInput, w = VIEW.w, h = VIEW.h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" ` +
         `preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your character">` +
         buildAvatar(avatarInput, moodInput) + `</svg>`;
}

// ---- build -----------------------------------------------------------------
export function buildAvatar(avatarInput, moodInput) {
  const a = ensureAvatar(avatarInput);
  // Resolve the mood once: an unknown value must not leak into the markup.
  const mood = MOODS[moodInput] ? moodInput : 'neutral';
  const spec = moodSpec(mood);
  const skinC = hex(skin, a.skin, DEFAULT_AVATAR.skin);
  const shadeC = hex(skinShade, a.skin, DEFAULT_AVATAR.skin);
  const hairC = hex(hairColor, a.hairColor, DEFAULT_AVATAR.hairColor);
  const fill = hex(outfit, a.outfit, DEFAULT_AVATAR.outfit);
  const outShade = hex(outfitShade, a.outfit, DEFAULT_AVATAR.outfit);
  const hair = hairStyle(a.hair, hairC);

  return `<g class="avatar avatar-${spec.eye} avatar-mood-${mood}">` +
    // ground shadow
    `<ellipse cx="100" cy="250" rx="46" ry="8" fill="#000" opacity="0.35"/>` +
    hair.back +
    // legs
    `<path d="M78 196 L96 196 L96 234 L78 234 Z" fill="${outShade}"/>` +
    `<path d="M104 196 L122 196 L122 234 L104 234 Z" fill="${outShade}"/>` +
    feet(a.sneakers, outShade) +
    // arms behind torso for a simple, readable silhouette
    `<path d="M66 134 Q54 168 60 194 L72 194 Q68 166 76 140 Z" fill="${outShade}"/>` +
    `<path d="M134 134 Q146 168 140 194 L128 194 Q132 166 124 140 Z" fill="${outShade}"/>` +
    `<circle cx="66" cy="198" r="7" fill="${skinC}"/>` +
    `<circle cx="134" cy="198" r="7" fill="${skinC}"/>` +
    torso(a.fit, fill, outShade, spec.pockets) +
    // neck + ears + head, tilted by mood
    `<g transform="rotate(${spec.tilt} 100 112)">` +
      `<rect x="92" y="108" width="16" height="20" rx="6" fill="${shadeC}"/>` +
      `<ellipse cx="70" cy="90" rx="6" ry="9" fill="${shadeC}"/>` +
      `<ellipse cx="130" cy="90" rx="6" ry="9" fill="${shadeC}"/>` +
      `<ellipse cx="100" cy="86" rx="30" ry="35" fill="${skinC}"/>` +
      hair.front +
      brows(spec, ink) +
      eyes(spec, ink) +
      `<path d="M100 92 Q104 98 100 100" stroke="${shadeC}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      mouth(spec, ink) +
    `</g>` +
    accessory(a.accessory, hairC, skinC) +
  `</g>`;
}
