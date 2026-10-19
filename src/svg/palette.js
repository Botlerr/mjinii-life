// src/svg/palette.js — colour tokens for all original artwork.
// Characters use warm, readable colours so they stand out against the black/acid frame.

export const skin = {
  light: '#f0c9a6',
  tan:   '#d99a6c',
  brown: '#a9714b',
  deep:  '#7a4a2d',
  rich:  '#4a2a1a'
};

export const skinShade = {
  light: '#d9a982',
  tan:   '#bf7f52',
  brown: '#8d5a39',
  deep:  '#5f3821',
  rich:  '#341c10'
};

export const hairColor = {
  black:  '#15110f',
  brown:  '#4a2c1a',
  auburn: '#7a3b1e',
  grey:   '#b9b3ad',
  gold:   '#c9973f'
};

export const outfit = {
  teal:   '#0d9488',
  acid:   '#ccff00',
  rust:   '#c2410c',
  indigo: '#4338ca',
  sand:   '#e7d3b3',
  plum:   '#7e22ce'
};

export const outfitShade = {
  teal:   '#0a6f66',
  acid:   '#9dc400',
  rust:   '#8f3009',
  indigo: '#312a94',
  sand:   '#c9b493',
  plum:   '#5c1899'
};

// Readable against any skin tone.
export const ink = '#1a1410';
export const white = '#f7f4ef';

export const hairStyles = [
  { id: 'coily-afro',  label: 'Coily afro' },
  { id: 'short-crop',  label: 'Short crop' },
  { id: 'braids',      label: 'Braids' },
  { id: 'headwrap',    label: 'Headwrap' },
  { id: 'fade',        label: 'Fade' },
  { id: 'long-coils',  label: 'Long coils' }
];

export const fits = [
  { id: 'casual',     label: 'Casual' },
  { id: 'smart',      label: 'Smart' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'workwear',   label: 'Workwear' }
];

export const accessories = [
  { id: 'none',     label: 'None' },
  { id: 'cap',      label: 'Cap' },
  { id: 'glasses',  label: 'Glasses' },
  { id: 'chain',    label: 'Chain' },
  { id: 'earrings', label: 'Earrings' }
];

// Scene lighting. Blackout is a dimmer, warmer version of night.
export const light = {
  day:      { sky: '#2a3b4d', far: '#22303f', mid: '#1b2531', ground: '#171c22', haze: '#ffffff', hazeAlpha: 0.05, tint: null, dim: 1 },
  night:    { sky: '#101827', far: '#0d1520', mid: '#0a1018', ground: '#080c11', haze: '#7fb2ff', hazeAlpha: 0.04, tint: '#0b1220', dim: 0.72 },
  blackout: { sky: '#0a0d14', far: '#080b11', mid: '#06080d', ground: '#05070a', haze: '#000000', hazeAlpha: 0, tint: '#04060a', dim: 0.45 }
};

export const svgOpen = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" ` +
  `preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">`;
