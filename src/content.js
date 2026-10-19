// src/content.js — all game data (data-driven, not hardcoded in UI)
export const archetypes = {
  lapo:    { name: 'Lapo Mtu',      desc: 'Street vendor, single room.', money: 200,     room: 'Single Room (Kibera)', career: 'Street Vendor',         rent: 4500 },
  omo:     { name: 'Omo Area',      desc: 'Matatu / office, one-bed.',   money: 15000,   room: 'One-Bed Flat',         career: 'Matatu / Office',        rent: 18000 },
  balogun: { name: 'Balogun Trader',desc: 'Market legend, warehouse.',   money: 120000,  room: 'Warehouse + Flat',     career: 'Market Trader',          rent: 55000 },
  tech:    { name: 'Tech Sis/Bro',  desc: 'Startup, serviced apt.',      money: 80000,   room: 'Serviced Apt',         career: 'Developer / Freelance',  rent: 85000 },
  nepo:    { name: 'Nepo Baby',     desc: 'Inherited plaza, zero rent.', money: 2500000, room: 'Family Plaza',         career: 'Executive / Advisor',    rent: 0 }
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
  { id: 'work',            label: 'Work (+KES)',      desc: 'Earn money' },
  { id: 'side_hustle',     label: 'Side Hustle',      desc: 'Small earn, small energy cost' },
  { id: 'eat_ugali',       label: 'Eat Ugali',        desc: 'Restore hunger' },
  { id: 'nyama',           label: 'Nyama Choma',      desc: 'Expensive meal, big fun' },
  { id: 'matatu',          label: 'Matatu',           desc: 'Transport + social' },
  { id: 'rest',            label: 'Rest',             desc: 'Restore energy' },
  { id: 'shop',            label: 'Computer Village', desc: 'Gamble money' },
  { id: 'call_friend',     label: 'Call Friend',      desc: 'Social +' },
  { id: 'study',           label: 'Study',            desc: 'Energy - long-term growth' },
  { id: 'visit_westlands', label: 'Visit Westlands',  desc: 'Travel + fun + social' },
  { id: 'visit_kibera',    label: 'Visit Kibera',     desc: 'Travel + social' },
  { id: 'visit_kisumu',    label: 'Visit Kisumu',     desc: 'Travel + fun' },
  { id: 'visit_mombasa',   label: 'Visit Mombasa',    desc: 'Travel + fun (long trip)' }
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
  { id: 'friend_invite',   text: 'Friend invites you out — social +15',     effect: { social: 15 } }
];

export const npcs = [
  { name: 'Shiro',       relation: 'Friend', mood: 'happy',   gift: 'Chapati' },
  { name: 'Uncle J',     relation: 'Family', mood: 'neutral', gift: 'Advice' },
  { name: 'Nairobi Doc', relation: 'Work',   mood: 'busy',    gift: 'Referral' }
];
