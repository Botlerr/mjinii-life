// src/content.js — ALL game data. Single source of truth; other modules consume this.

// Actions a player may take per day. Rent cycle is 6 days -> 24 slots per cycle.
export const DAY_SLOTS = 4;
// Below this hunger, hard work is refused. Side hustles stay open so a broke,
// starving player always has a way back (no soft-lock).
export const WORK_HUNGER_MIN = 10;
// Being hungry is not free. Two effects: it drains energy overnight (below), and it
// is part of the happiness formula, so you cannot stay cheerful on an empty stomach.
// `max` is inclusive, so a hunger of exactly 0 is starving, not "very hungry".
export const HUNGER_PENALTY = [
  { max: 0,  energy: 12, label: 'starving' },
  { max: 9,  energy: 6,  label: 'very hungry' },
  { max: 24, energy: 3,  label: 'hungry' }
];
// An empty stomach slows you down: hustling on less than 25 hunger pays less.
export const HUSTLE_HUNGER_MIN = 25;
export const HUSTLE_HUNGRY_RATE = 0.6;

export const REP_START = 50;
export const REP_FATAL = 0;   // reputation at or below this ends the run

export const archetypes = {
  lapo: {
    name: 'Lapo Mtu', desc: 'Street vendor, single room.',
    money: 2500, room: 'Single Room (Kibera)', career: 'Street Vendor',
    rent: 4500, pay: 800, repDrain: 0
  },
  omo: {
    name: 'Omo Area', desc: 'Matatu / office, one-bed.',
    money: 15000, room: 'One-Bed Flat', career: 'Matatu / Office',
    rent: 18000, pay: 2600, repDrain: 0
  },
  balogun: {
    name: 'Balogun Trader', desc: 'Market legend, warehouse.',
    money: 120000, room: 'Warehouse + Flat', career: 'Market Trader',
    rent: 55000, pay: 7800, repDrain: 0
  },
  tech: {
    name: 'Tech Sis/Bro', desc: 'Startup, serviced apt.',
    money: 80000, room: 'Serviced Apt', career: 'Developer / Freelance',
    rent: 85000, pay: 12000, repDrain: 0
  },
  nepo: {
    name: 'Nepo Baby', desc: 'Inherited plaza, zero rent.',
    money: 2500000, room: 'Family Plaza', career: 'Executive / Advisor',
    rent: 0, pay: 5000,
    // No rent, so the pressure is the name: talk drains reputation daily, and only
    // spending on other people holds it up.
    repDrain: 2
  }
};

export const locations = [
  'Kibera Estate', 'Westlands Nightlife', 'CBD Work', 'Eastlands Matatu',
  'Mombasa Old Town', 'Kisumu Market', 'Home / Estate', 'Matatu Stage',
  'Computer Village', 'Nyama Choma Joint', 'Quilox Club', 'Boda Stage'
];

export const foods = [
  'Ugali + Sukuma Wiki', 'Nyama Choma', 'Chapati + Beans', 'Mandazi + Chai',
  'Githeri', 'Mutura (street)', 'Pilau (coast)', 'Kachumbari Salad'
];

export const actions = [
  { id: 'work',            label: 'Work (+KES)',      desc: 'Earn money. Needs food in you.' },
  { id: 'side_hustle',     label: 'Side Hustle',      desc: 'Small earn, small energy cost' },
  { id: 'eat_ugali',       label: 'Eat Ugali',        desc: 'Restore hunger' },
  { id: 'nyama',           label: 'Nyama Choma',      desc: 'Expensive meal, big fun' },
  { id: 'matatu',          label: 'Matatu',           desc: 'Transport + social' },
  { id: 'rest',            label: 'Rest',             desc: 'Restore energy. Once per day.' },
  { id: 'shop',            label: 'Computer Village', desc: 'Gamble money' },
  { id: 'call_friend',     label: 'Call Friend',      desc: 'Social +' },
  { id: 'study',           label: 'Study',            desc: 'Energy - long-term growth' },
  { id: 'visit_westlands', label: 'Visit Westlands',  desc: 'Travel + fun + social' },
  { id: 'visit_kibera',    label: 'Visit Kibera',     desc: 'Travel + social' },
  { id: 'visit_kisumu',    label: 'Visit Kisumu',     desc: 'Travel + fun' },
  { id: 'visit_mombasa',   label: 'Visit Mombasa',    desc: 'Travel + fun (long trip)' }
];

// Reputation deltas. Reputation is at stake for everyone, but only Nepo bleeds it
// daily — everyone else has to do something catastrophic to reach the floor.
export const actionRep = {
  work: 1, side_hustle: 1, eat_ugali: 0, nyama: 2, matatu: 0, rest: -1,
  shop: 0, call_friend: 1, study: 1,
  visit_westlands: 1, visit_kibera: 1, visit_kisumu: 1, visit_mombasa: 1
};

export const eventRep = {
  nepa_blackout: 0, water_rationing: 0, flooded_road: 0, landlord: 0,
  harambee: -2, council_raid: -5, fuel_hike: 0, job_interview: 1,
  viral_video: 5, boda_accident: -1, matatu_strike: 0, power_restored: 0,
  rain_stops: 0, mpesa_fee: 0, friend_invite: 1, group_chat: 1, family_call: 1,
  job_listing: 2
};

export const gifts = [
  { id: 'chapati',  label: 'Chapati',   cost: 50 },
  { id: 'airtime',  label: 'Airtime',   cost: 100 },
  { id: 'book',     label: 'Book',      cost: 800 },
  { id: 'sneakers', label: 'Sneakers',  cost: 2500 }
];

export const events = [
  { id: 'nepa_blackout',   text: 'NEPA blackout — token empty',             effect: { energy: -5 } },
  { id: 'water_rationing', text: 'Water rationing — no shower today',       effect: { hygiene: -10 } },
  { id: 'flooded_road',    text: 'Rain flooded the road — matatu delayed',  effect: { energy: -5 } },
  { id: 'landlord',        text: 'Landlord knocking — rent due Saturday',   effect: {} },
  { id: 'harambee',        text: 'Family harambee request — KES 2,000',     effect: { money: -2000 } },
  { id: 'council_raid',    text: 'City council raid — hawker goods seized', effect: { money: -1000 } },
  { id: 'fuel_hike',       text: 'Fuel price hike — matatu fare up',        effect: { money: -100 } },
  { id: 'job_interview',   text: 'Job interview tomorrow — prepare outfit', effect: {} },
  { id: 'viral_video',     text: 'Viral video — strangers know you',        effect: { social: 10, fun: 5 } },
  { id: 'boda_accident',   text: 'Boda boda accident — avoid for 1 day',    effect: { energy: -8 } },
  { id: 'matatu_strike',   text: 'Matatu strike — no transport',            effect: { energy: -3 } },
  { id: 'power_restored',  text: 'Power restored — token refill bonus',     effect: { energy: 5 } },
  { id: 'rain_stops',      text: 'Rain stops — fresh air, fun +10',         effect: { fun: 10 } },
  { id: 'mpesa_fee',       text: 'M-Pesa fee waived — save KES 50',         effect: { money: 50 } },
  { id: 'friend_invite',   text: 'Friend invites you out — social +15',     effect: { social: 15 } },
  { id: 'group_chat',      text: 'Group chat goes off all day — fun +5',    effect: { fun: 5 } },
  { id: 'family_call',     text: 'Uncle J calls about a family thing',      effect: { social: 5 } },
  { id: 'job_listing',     text: 'Nairobi Doc forwards a job listing',      effect: { happiness: 5 } }
];

export const npcs = [
  {
    id: 'shiro',
    name: 'Shiro',
    relation: 'Friend',
    location: 'Kibera Estate',
    likes: ['chapati', 'airtime'],
    lines: {
      cold:    'Shiro nods but keeps walking. Not today.',
      neutral: 'Shiro: "Sasa? Long time." She stops, half-turned.',
      warm:    'Shiro: "Wewe! Come, sit. You are eating something."',
      close:   'Shiro: "You are family. Anything you need, you say."'
    },
    perk: 'Feeds you on visits once you are Friends.'
  },
  {
    id: 'unclej',
    name: 'Uncle J',
    relation: 'Family',
    location: 'Eastlands',
    likes: ['book'],
    lines: {
      cold:    'Uncle J looks at you over his glasses. He has heard things.',
      neutral: 'Uncle J: "You are working? Good. Keep it that way."',
      warm:    'Uncle J: "Sit. I was just making tea."',
      close:   'Uncle J: "Whatever it is, we sort it as a family."'
    },
    perk: 'At Close, may send money or cover a rent shortfall.'
  },
  {
    id: 'doc',
    name: 'Nairobi Doc',
    relation: 'Work',
    location: 'Westlands',
    likes: ['airtime', 'sneakers'],
    lines: {
      cold:    'Doc checks his phone. "Sorry — back-to-back today."',
      neutral: 'Doc: "Ah, you. What are you working on?"',
      warm:    'Doc: "Good timing. Sit, let me tell you something."',
      close:   'Doc: "I am putting your name forward. Do not embarrass me."'
    },
    perk: 'At Friends or above, may refer you for paid gigs.'
  }
];

export const EVICTED_ROOM = 'Single Room (Kibera)';
export const EVICTED_RENT = 4500;
