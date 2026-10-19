export const events=['NEPA blackout','Water rationing','Flooded road','Landlord knocking','Harambee request','Council raid','Fuel hike','Job interview','Viral moment','Boda accident'];
export function randomEvent(){return events[Math.floor(Math.random()*events.length)];}
