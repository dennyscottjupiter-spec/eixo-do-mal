'use strict';
/* =====================================================================
   EIXO DO MAL — config.js
   Layer 1: CONFIG (all balance numbers live here), state, pure helpers
   ===================================================================== */
const CONFIG = {
  actionsPerTurn: 10,
  startRes: { gold:1500, oil:120, food:600, industry:60, pop:1000 },
  startLand: 25,
  easyTargetNW: 60000,
  market: { lot:50, oil:{buy:8,sell:5}, food:{buy:4,sell:2} },
  popCapBase: 2000, popCapPerBuilding: 400,
  buildings: {
    oilField:        { n:'Oil Field',        i:'🛢️', g:300,  ind:5,  d:'+20 oil/turn' },
    farm:            { n:'Farm',             i:'🌾', g:250,  ind:3,  d:'+30 food/turn' },
    factory:         { n:'Factory',          i:'⚙️', g:450,  ind:0,  d:'+8 industry/turn' },
    bank:            { n:'Bank',             i:'💰', g:500,  ind:8,  d:'+60 gold/turn' },
    barracks:        { n:'Barracks',         i:'🛡️', g:350,  ind:6,  d:'+100 troop capacity' },
    bunker:          { n:'Bunker',           i:'🧱', g:400,  ind:10, d:'+5% defense' },
    lab:             { n:'Research Lab',     i:'🔬', g:800,  ind:15, d:'unlocks tech tree' },
    nuclearFacility: { n:'Nuclear Facility', i:'☢️', g:4000, ind:60, d:'enables warhead program', req:'nuclearPhysics' }
  },
  units: {
    infantry: { n:'Infantry',     i:'🪖', g:20,  f:5,  batch:10, atk:1, def:1.2, fu:0.5, ou:0 },
    tank:     { n:'Tank',         i:'🚙', g:150, f:20, batch:5,  atk:4, def:5,   fu:1,   ou:1 },
    jet:      { n:'Jet Fighter',  i:'✈️', g:300, f:10, batch:2,  atk:6, def:5,   fu:1,   ou:2 },
    spy:      { n:'Spy',          i:'🕵️', g:100, f:5,  batch:5,  atk:0, def:0,   fu:0.5, ou:0 },
    turret:   { n:'Turret',       i:'🗼', g:80,  f:0,  batch:5,  atk:0, def:4,   fu:0,   ou:0 },
    scud:     { n:'SCUD Missile', i:'🚀', g:500, f:0,  batch:1,  atk:0, def:0,   fu:0,   ou:0 }
  },
  factions: {
    iran:        { n:'Iran',        flag:'🇮🇷', bonus:'Oil income +15%',   tip:'Extra oil income keeps tanks and jets always fuelled — great for sustained armored offensives.', oil:1.15 },
    iraq:        { n:'Iraq',        flag:'🇮🇶', bonus:'Attack power +10%', tip:'Born fighters — your ground forces punch above their weight for the same training cost.', atk:1.10 },
    northkorea:  { n:'North Korea', flag:'🇰🇵', bonus:'Spy cost −20%',     tip:'Espionage specialists — run spy networks 20% cheaper than anyone else. Own the shadows.', spyCost:0.8 },
    cuba:        { n:'Cuba',        flag:'🇨🇺', bonus:'Pop. growth +10%',  tip:'High birth rate grows your passive gold income every turn. Slow start, dominant late game.', pop:1.10 },
    libya:       { n:'Libya',       flag:'🇱🇾', bonus:'Gold income +15%',  tip:'Oil wealth fills your treasury faster — build, research, and arm before rivals catch up.', gold:1.15 },
    syria:       { n:'Syria',       flag:'🇸🇾', bonus:'Defense +15%',      tip:'Hardened fortifications — the toughest nation to invade. Hold the line and counterattack.', def:1.15 },
    brazil:      { n:'Brazil',      flag:'🇧🇷', bonus:'Pop. growth +15%',  tip:'Fastest population growth in the game — your passive gold snowballs harder than anyone.', pop:1.15 },
    usa:         { n:'USA',         flag:'🇺🇸', bonus:'Attack power +15%', tip:'Best attack multiplier in the game — your army punches far above its weight class.', atk:1.15 },
    russia:      { n:'Russia',      flag:'🇷🇺', bonus:'Oil income +15%',   tip:'Oil-rich superpower — tanks and jets always fuelled, dominates long wars and late combat.', oil:1.15 },
    china:       { n:'China',       flag:'🇨🇳', bonus:'Gold income +15%',  tip:'Highest gold income multiplier — builds faster, researches earlier, and arms the largest army.', gold:1.15 },
    netherlands: { n:'Netherlands', flag:'🇳🇱', bonus:'Defense +15%',      tip:'Fortified nation with the best defense bonus — ideal for a turtle-then-nuke strategy.', def:1.15 }
  },
  techs: [
    { id:'advAgri',        tier:1, n:'Advanced Agriculture', g:800,  d:'+10% food production' },
    { id:'steel',          tier:1, n:'Steel Industry',       g:800,  d:'+10% industry output' },
    { id:'guided',         tier:2, n:'Guided Missiles',      g:2000, d:'+15% attack power' },
    { id:'encryption',     tier:2, n:'Encryption',           g:2000, d:'+15% spy defense' },
    { id:'nuclearPhysics', tier:3, n:'Nuclear Physics',      g:5000, d:'unlocks Nuclear Facility' },
    { id:'blackMarket',    tier:3, n:'Black Market',         g:4000, d:'+20% gold income' },
    { id:'icbm',           tier:4, n:'ICBM Program',         g:8000, d:'warhead becomes deployable', req:'nuclearPhysics' }
  ],
  warhead: { researchNeeded:50, g:5000, oil:100 },
  // AI personality weight profiles. ratio = attack when myPower >= ratio × targetDefense.
  profiles: {
    aggressive:{ build:{barracks:3,oilField:2,farm:1.5,bank:1,factory:1,bunker:.5,lab:.3},
                 train:{infantry:2,tank:3,jet:2,spy:.3}, ratio:0.9, spy:.10, acceptAlly:.15 },
    defensive: { build:{bunker:3,farm:2,bank:1,factory:1,oilField:1,barracks:1,lab:.4},
                 train:{infantry:3,tank:1,jet:1,spy:.5}, ratio:99,  spy:.10, acceptAlly:.60 },
    economic:  { build:{bank:3,factory:3,farm:1.5,oilField:2,barracks:.5,bunker:1,lab:.6},
                 train:{infantry:1,tank:.5,jet:.5,spy:.3}, ratio:1.5, spy:.10, acceptAlly:.60 },
    espionage: { build:{lab:1.5,bank:1,farm:1.2,factory:1,oilField:1,bunker:1,barracks:.5},
                 train:{spy:3,infantry:1,tank:.5,jet:.5}, ratio:1.4, spy:.85, acceptAlly:.50 },
    balanced:  { build:{farm:1.2,bank:1,factory:1,oilField:1,barracks:1,bunker:1,lab:.5},
                 train:{infantry:1,tank:1,jet:1,spy:1}, ratio:1.2, spy:.30, acceptAlly:.40 }
  },
  bootLines: [
    'EIXO-OS v2.3 ... terminal link established.',
    'Satellite uplink: 6 rogue states detected.',
    'UN sanctions in effect. Nobody cares.',
    'Your reign begins. The world is watching.'
  ]
};

/* ---------- tiny utils ---------- */
const rnd = Math.random;
const rint = (a,b)=>a+Math.floor(rnd()*(b-a+1));
const chance = p=>rnd()<p;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const fmt = v=>Math.floor(v).toLocaleString('en-US');
const pick = a=>a[Math.floor(rnd()*a.length)];
function shuffle(a){ const c=a.slice(); for(let i=c.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[c[i],c[j]]=[c[j],c[i]];} return c; }
function weightedPick(weights){
  const es = Object.entries(weights).filter(e=>e[1]>0);
  let tot = es.reduce((s,e)=>s+e[1],0); if(tot<=0) return null;
  let r = rnd()*tot;
  for(const [k,w] of es){ r-=w; if(r<=0) return k; }
  return es[es.length-1][0];
}
function asciiBar(v,max,len){
  const f = clamp(Math.round(v/max*len),0,len);
  return '█'.repeat(f)+'░'.repeat(len-f);
}

/* ---------- game state ---------- */
let G = null;                                   // single source of truth
const UI = { tab:'build', attackTarget:null, mode:'normal' };  // view-only state

function newNation(faction,isPlayer,personality){
  return {
    id:faction, faction, isPlayer, personality, alive:true,
    res:{ ...CONFIG.startRes }, land:CONFIG.startLand,
    b:{ oilField:2, farm:3, factory:2, bank:1, barracks:1, bunker:1, lab:0, nuclearFacility:0 },
    army:{ infantry:50, tank:5, jet:0, spy:5, turret:10, scud:0, warhead:0 },
    techs:[], morale:100, relations:{}, intel:{}, nukeProg:0,
    oilShort:false, lastAttackedBy:null, hitThisCycle:0
  };
}

function initGame(playerFaction){
  const others = shuffle(Object.keys(CONFIG.factions).filter(f=>f!==playerFaction)).slice(0,5);
  const persL  = shuffle(['aggressive','defensive','economic','espionage','balanced']);
  G = {
    turn:1, actions:CONFIG.actionsPerTurn, nations:[], log:[],
    over:false, result:null, streak:0, coalition:false, started:true,
    easy: UI.mode==='easy'
  };
  G.nations.push(newNation(playerFaction,true,null));
  others.forEach((f,i)=>G.nations.push(newNation(f,false,persL[i%persL.length])));
  if(G.easy){ P().res.gold+=2000; P().res.food+=400; }
  log('sys', G.easy
    ? '— TURN 1 · EASY MODE — Collect, build, train, attack. Rivals stay peaceful. Learn the ropes.'
    : '— TURN 1 — Choose your moves wisely. 10 actions per turn.');
  bootSequence();
  render();
}

/* ---------- accessors ---------- */
const P    = ()=>G.nations[0];
const byId = id=>G.nations.find(n=>n.id===id);
const nm   = n=>CONFIG.factions[n.faction].n;
const fb   = n=>CONFIG.factions[n.faction];
const hasTech = (n,id)=>n.techs.includes(id);
const techOf  = id=>CONFIG.techs.find(t=>t.id===id);
const totalBuildings = n=>Object.values(n.b).reduce((s,v)=>s+v,0);
const freeLand = n=>n.land - totalBuildings(n);
const popCap   = n=>CONFIG.popCapBase + totalBuildings(n)*CONFIG.popCapPerBuilding;
const troopCnt = n=>n.army.infantry+n.army.tank+n.army.jet;
const troopCap = n=>100 + n.b.barracks*100;
const rawPower = n=>n.army.infantry + n.army.tank*4 + n.army.jet*6;
const score    = n=>Math.floor(n.res.gold + n.res.pop*2 + rawPower(n)*3 + n.land*40 + totalBuildings(n)*500 + n.techs.length*1000);
function rankOf(n){
  return G.nations.filter(x=>x.alive).sort((a,b)=>score(b)-score(a)).indexOf(n)+1;
}
function log(type,text){
  G.log.unshift({ t:G.turn, type, text });
  if(G.log.length>200) G.log.length = 200;
}

/* ---------- relations ---------- */
const rel = (a,b)=>a.relations[b.id] || 'peace';
function setRel(a,b,ra,rb){ a.relations[b.id]=ra; b.relations[a.id]=rb??ra; }
function setWar(a,b){
  if(rel(a,b)==='war') return;
  if(rel(a,b)==='vassal'||rel(a,b)==='master'){ /* rebellion / betrayal breaks the bond */ }
  setRel(a,b,'war');
  log('diplo',`⚔️ ${nm(a)} and ${nm(b)} are now AT WAR. Attacks between them are allowed.`);
}
function warsCount(){
  let w=0; const ns=G.nations.filter(n=>n.alive);
  for(let i=0;i<ns.length;i++) for(let j=i+1;j<ns.length;j++)
    if(rel(ns[i],ns[j])==='war') w++;
  return w;
}
