export function work(s){let earn=s.type==='nepo'?5000:s.type==='balogun'?3500:s.type==='tech'?2800:s.type==='omo'?1200:800; s.money+=earn; s.hunger-=8; s.energy-=10; s.hygiene-=5; return 'Earned '+(earn).toLocaleString();}
export function eat(s){s.money-=120; s.hunger=Math.min(100,s.hunger+35); s.energy+=5; return 'Ate ugali';}
export function nyama(s){s.money-=850; s.fun=Math.min(100,s.fun+18); s.social=Math.min(100,s.social+15); s.hunger=Math.min(100,s.hunger+10); return 'Nyama choma';}
export function rest(s){s.energy=Math.min(100,s.energy+25); s.fun=Math.min(100,s.fun+8); return 'Rested';}
