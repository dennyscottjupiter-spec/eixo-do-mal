'use strict';
/* =====================================================================
   EIXO DO MAL — engine.js
   Layer 2: economy — incomes, upkeep, end-of-turn tick (pure-ish math)
   ===================================================================== */
function industryMult(n){ return 1 + Math.min(n.res.industry,300)/300; }   // up to 2×

function incomes(n){
  const m=industryMult(n), f=fb(n);
  return {
    gold: (n.res.pop*0.5 + n.b.bank*60) * m * (f.gold||1) * (hasTech(n,'blackMarket')?1.2:1),
    oil:  n.b.oilField*20 * m * (f.oil||1),
    food: n.b.farm*30 * m * (hasTech(n,'advAgri')?1.1:1),
    ind:  n.b.factory*8 * m * (hasTech(n,'steel')?1.1:1)
  };
}
function upkeep(n){
  const u=CONFIG.units, a=n.army;
  return {
    food: n.res.pop*0.02 + a.infantry*u.infantry.fu + a.tank*u.tank.fu + a.jet*u.jet.fu + a.spy*u.spy.fu,
    oil:  a.tank*u.tank.ou + a.jet*u.jet.ou
  };
}
function econTick(n){
  const inc=incomes(n), up=upkeep(n), r=n.res, f=fb(n);
  r.gold += inc.gold;
  r.industry += inc.ind;
  r.oil += inc.oil - up.oil;
  n.oilShort = r.oil < 0;
  if(r.oil<0){ r.oil=0; if(n.isPlayer) log('eco','⛽ OIL SHORTAGE — you are out of oil. Tanks and jets fight at 50% power until you produce or buy more.'); }
  r.food += inc.food - up.food;
  if(r.food<0){
    r.food=0; r.pop=Math.floor(r.pop*0.95); n.morale=clamp(n.morale-20,20,150);
    if(n.isPlayer) log('eco','🌾 FAMINE! Your people are starving — population dropped 5% and morale collapsed. Build more Farms urgently.');
  } else {
    const growth = 1 + 0.02*(f.pop||1);            // Cuba grows 2.2%/turn
    r.pop = Math.min(popCap(n), Math.floor(r.pop*growth));
  }
  n.morale = clamp(n.morale + (n.morale<100?5:(n.morale>100?-3:0)),20,150);
  // passive nuclear research with an active facility
  if(n.b.nuclearFacility>0 && hasTech(n,'nuclearPhysics') && n.nukeProg<CONFIG.warhead.researchNeeded)
    n.nukeProg++;
}

/* =====================================================================
   Layer 3: combat, spies, missiles, nukes
   ===================================================================== */
function atkPower(n,units){
  const f=fb(n), pen=n.oilShort?0.5:1;
  return (units.infantry*1 + units.tank*4*pen + units.jet*6*pen)
         * (n.morale/100) * (f.atk||1) * (hasTech(n,'guided')?1.15:1);
}
function defPower(n){
  const f=fb(n), pen=n.oilShort?0.5:1;
  const lastStand = totalBuildings(n)<=3 ? 1.5 : 1;   // cornered nations fight desperately
  return (n.army.infantry*1.2 + n.army.tank*5*pen + n.army.jet*5*pen + n.army.turret*4)
         * (1 + n.b.bunker*0.05) * (f.def||1) * lastStand;
}
function lossCommit(n,commit,p){ for(const k of ['infantry','tank','jet']) n.army[k]-=Math.floor(commit[k]*p); }
function lossAll(n,p){ for(const k of ['infantry','tank','jet']) n.army[k]-=Math.floor(n.army[k]*p); }
function destroyRandomBuilding(n){
  const w={}; for(const k in n.b) if(n.b[k]>0) w[k]=n.b[k];
  const key=weightedPick(w); if(!key) return null;
  n.b[key]--; return CONFIG.buildings[key].n;
}

/* Full ground assault. pct = fraction of attacker's army committed. */
function resolveAttack(att,def,pct){
  setWar(att,def);
  def.lastAttackedBy = att.id;
  def.hitThisCycle = (def.hitThisCycle||0)+1;
  const commit={
    infantry:Math.floor(att.army.infantry*pct),
    tank:Math.floor(att.army.tank*pct),
    jet:Math.floor(att.army.jet*pct)
  };
  if(commit.infantry+commit.tank+commit.jet===0){
    log('war',`${nm(att)} tried to attack but has no troops to send. Train soldiers first.`); return false;
  }
  const ap=atkPower(att,commit)*(0.9+rnd()*0.2);
  const dp=defPower(def)   *(0.9+rnd()*0.2);
  if(ap>dp){
    lossCommit(att,commit,0.12); lossAll(def,0.30);
    const loot=Math.floor(def.res.gold*0.10); def.res.gold-=loot; att.res.gold+=loot;
    const grab=Math.max(2,Math.floor(def.land*0.12)); def.land-=grab; att.land+=grab;
    const destroyed=[]; const nDest=rint(1,2);
    for(let i=0;i<nDest;i++){ const b=destroyRandomBuilding(def); if(b) destroyed.push(b); }
    att.morale=clamp(att.morale+10,20,150); def.morale=clamp(def.morale-15,20,150);
    log('war',`⚔️ ${nm(att)} WON — broke through ${nm(def)}'s defenses! Looted ${fmt(loot)} gold and seized ${grab} acres`+
        (destroyed.length?`. Razed: ${destroyed.join(', ')}.`:'.'));
    checkDestroyed(def);
    return true;
  } else {
    lossCommit(att,commit,0.30); lossAll(def,0.10);
    att.morale=clamp(att.morale-15,20,150); def.morale=clamp(def.morale+10,20,150);
    log('war',`🛡️ ${nm(def)} DEFENDED — repelled ${nm(att)}'s assault. The attackers retreated with heavy losses.`);
    checkDestroyed(att);
    return false;
  }
}

/* SCUD strike: consumes one missile, may level buildings. Jets intercept. */
function scudStrike(att,def){
  att.army.scud--; setWar(att,def); def.lastAttackedBy=att.id;
  const hitP = clamp(0.75 - def.army.jet*0.005, 0.2, 0.9);
  if(chance(hitP)){
    const destroyed=[]; const nDest=rint(1,2);
    for(let i=0;i<nDest;i++){ const b=destroyRandomBuilding(def); if(b) destroyed.push(b); }
    log('war',`🚀 SCUD missile from ${nm(att)} hit ${nm(def)}${destroyed.length?` — destroyed: ${destroyed.join(', ')}.`:' — landed in empty fields, no buildings hit.'}`);
    checkDestroyed(def);
  } else {
    log('war',`🚀 ${nm(def)}'s jets intercepted and shot down the SCUD fired by ${nm(att)}. No damage.`);
  }
}

/* Covert operation. Uses the whole spy network. */
function spyMission(att,def,mission){
  if(att.army.spy<1){ if(att.isPlayer) log('spy','You have no spies. Train some first.'); return; }
  const enc = hasTech(def,'encryption')?1.15:1;
  const p = clamp(att.army.spy/(Math.max(def.army.spy,1)*1.5*enc),0.05,0.95);
  if(chance(p)){
    if(mission==='steal'){
      const amt=Math.floor(def.res.gold*(0.05+rnd()*0.10));
      def.res.gold-=amt; att.res.gold+=amt;
      if(att.isPlayer)
        log('spy',`🕶️ Your spies stole ${fmt(amt)} gold from ${nm(def)} and wired it to your treasury.`);
      else if(def.isPlayer)
        log('spy',`🕶️ ${nm(att)} agents raided your treasury — ${fmt(amt)} gold stolen.`);
    } else if(mission==='sabotage'){
      const b=destroyRandomBuilding(def);
      if(att.isPlayer)
        log('spy', b?`🕶️ Sabotage! Your agents blew up ${nm(def)}'s ${b}.`
                    :`🕶️ Your saboteurs infiltrated ${nm(def)} but found nothing left to destroy.`);
      else if(def.isPlayer)
        log('spy', b?`🕶️ ${nm(att)} saboteurs destroyed your ${b}!`
                    :`🕶️ ${nm(att)} agents infiltrated your territory but found nothing to destroy.`);
      checkDestroyed(def);
    } else if(mission==='killpop'){
      const killed=Math.floor(def.res.pop*(0.05+rnd()*0.08));
      def.res.pop-=killed;
      if(att.isPlayer)
        log('spy',`🕶️ Your agents poisoned ${nm(def)}'s water supply — ${fmt(killed)} citizens died.`);
      else if(def.isPlayer)
        log('spy',`🕶️ ${nm(att)} poisoned your water supply — ${fmt(killed)} of your citizens died.`);
      checkDestroyed(def);
    } else { // intel
      att.intel[def.id]=G.turn;
      if(att.isPlayer)
        log('spy',`🕶️ Intel report acquired on ${nm(def)}: army, gold, and building counts are now visible for 5 turns.`);
    }
  } else {
    const lost=Math.max(1,Math.floor(att.army.spy*(0.1+rnd()*0.2)));
    att.army.spy-=lost;
    if(att.isPlayer)
      log('spy',`🕶️ Mission failed — ${lost} of your spies were caught and captured by ${nm(def)}.`);
    else if(def.isPlayer)
      log('intel',`📡 You caught ${lost} of ${nm(att)}'s spies trying to infiltrate your territory.`);
  }
}

/* Nuclear strike. The endgame button. */
function deployNuke(att,def){
  att.army.warhead--;
  setWar(att,def);
  def.res.pop = Math.floor(def.res.pop*0.30);
  for(const k in def.b) def.b[k] = Math.ceil(def.b[k]*0.40);
  def.morale = 20;
  log('nuke',`☢️ ${nm(att)} DETONATED A NUCLEAR WARHEAD over ${nm(def).toUpperCase()}. 70% of their population wiped out. The world holds its breath.`);
  showBlast();
  checkDestroyed(def);
  if(att.isPlayer){
    if(rankOf(att)===1) winGame('nuclear');
    else log('nuke','☢️ You deployed the bomb, but you are not ranked #1. Climb to the top and strike again for the nuclear victory.');
  } else {
    if(rankOf(att)===1 && !G.over) loseGame(`${nm(att)} achieved nuclear supremacy. Your era is over.`);
  }
}

/* ---------- destruction & endings ---------- */
function checkDestroyed(n){
  if(!n.alive) return;
  if(n.res.pop<=0 || totalBuildings(n)<=0){
    n.alive=false;
    log('nuke',`☠ THE NATION OF ${nm(n).toUpperCase()} HAS FALLEN. Its lands are ash and silence.`);
    for(const o of G.nations) if(o!==n){ delete o.relations[n.id]; }
    if(n.isPlayer) loseGame('Your nation was wiped from the map.');
    if(UI.attackTarget===n.id) UI.attackTarget=null;
  }
}
function winGame(type){
  if(G.over) return;
  G.over=true;
  G.result={ win:true, type,
    msg: type==='nuclear' ? 'NUCLEAR VICTORY — you deployed the warhead as the world\'s #1 power.'
       : type==='easy'    ? 'EASY VICTORY — you mastered the basics and rose to the top of the Axis. Ready for the full game?'
                          : 'DOMINATION VICTORY — ranked #1, you bent 4 of 6 nations to your will (allies + at least one conquered vassal).' };
  log('nuke','★★★ TOTAL VICTORY ★★★');
}
function loseGame(reason){
  if(G.over) return;
  G.over=true;
  G.result={ win:false, msg:reason };
  log('nuke','— GAME OVER —');
}
function checkAll(){
  if(G.over) return;
  for(const n of G.nations) checkDestroyed(n);
  if(G.over) return;
  if(G.easy){
    // easy mode: win by reaching the target networth as #1, or wiping out every rival
    const rivals=G.nations.filter(n=>!n.isPlayer&&n.alive).length;
    if(P().alive && (rivals===0 || (score(P())>=CONFIG.easyTargetNW && rankOf(P())===1))) winGame('easy');
    return;
  }
  // domination: ranked #1 + at least 1 conquered vassal + bloc of 4 of 6
  const vassals=G.nations.filter(n=>!n.isPlayer&&n.alive&&rel(P(),n)==='vassal').length;
  const allies =G.nations.filter(n=>!n.isPlayer&&n.alive&&rel(P(),n)==='alliance').length;
  const ctrl=1+vassals+allies;
  if(ctrl>=4 && vassals>=1 && rankOf(P())===1) winGame('domination');
}
/* =====================================================================
   Layer 4: shared action helpers (used by both player and AI)
   ===================================================================== */
function buildCostOk(n,key){
  const b=CONFIG.buildings[key];
  if(b.req && !hasTech(n,b.req)) return false;
  if(!(G&&G.easy) && freeLand(n)<1) return false;      // buildings consume land (acres) — disabled in easy mode
  return n.res.gold>=b.g && n.res.industry>=b.ind;
}
function doBuild(n,key){
  const b=CONFIG.buildings[key];
  if(!buildCostOk(n,key)) return false;
  n.res.gold-=b.g; n.res.industry-=b.ind; n.b[key]++;
  if(!n.isPlayer){
    if(!n._ann) n._ann={};
    if(key==='lab' && !n._ann.lab){ n._ann.lab=true; log('intel',`📡 Intel: ${nm(n)} has completed a Research Lab — the tech tree is now open to them.`); }
    if(key==='nuclearFacility' && !n._ann.nf){ n._ann.nf=true; log('intel',`☢ ALERT: ${nm(n)} has completed a Nuclear Facility — their warhead program is now active.`); }
  }
  return true;
}
function unitGoldCost(n,key){
  const u=CONFIG.units[key];
  return u.g * u.batch * (key==='spy'?(fb(n).spyCost||1):1);
}
function trainCostOk(n,key){
  const u=CONFIG.units[key];
  if(['infantry','tank','jet'].includes(key) && troopCnt(n)+u.batch>troopCap(n)) return false;
  return n.res.gold>=unitGoldCost(n,key) && n.res.food>=u.f*u.batch;
}
function doTrain(n,key){
  const u=CONFIG.units[key];
  if(!trainCostOk(n,key)) return false;
  n.res.gold-=unitGoldCost(n,key); n.res.food-=u.f*u.batch; n.army[key]+=u.batch;
  return true;
}
function availTechs(n){
  return CONFIG.techs.filter(t=>{
    if(hasTech(n,t.id) || n.b.lab<1) return false;
    if(t.req && !hasTech(n,t.req)) return false;
    if(t.tier>1 && !n.techs.some(id=>techOf(id).tier===t.tier-1)) return false;
    return true;
  });
}
function doResearch(n,t){
  if(n.res.gold<t.g) return false;
  n.res.gold-=t.g; n.techs.push(t.id);
  return true;
}

/* =====================================================================
   Layer 5: AI brains — one greedy decision function × five weight maps
   ===================================================================== */
let microIdx=0;
/* micro-turn: one cheap move by one rotating AI after each player action.
   Keeps the world feeling alive without overwhelming the player. */
function aiMicro(){
  if(G.over) return;
  const ais=G.nations.filter(n=>!n.isPlayer&&n.alive);
  if(!ais.length) return;
  const n=ais[microIdx++ % ais.length];
  const inc=incomes(n), up=upkeep(n);
  if(freeLand(n)<2){ n.land+=rint(6,12); return; }   // AIs explore for room to build
  if(inc.food-up.food<0 && doBuild(n,'farm')) return;
  if(chance(0.5)){ if(aiTrainWeighted(n)) return; }
  if(aiBuildWeighted(n)) return;
  n.res.gold += Math.floor(n.res.pop*0.12);  // hustle: minor tax collection
}
function aiBuildWeighted(n){
  const Pf=CONFIG.profiles[n.personality];
  const w={}; for(const k in Pf.build) if(buildCostOk(n,k)) w[k]=Pf.build[k];
  const key=weightedPick(w); if(!key) return false;
  return doBuild(n,key);
}
function aiTrainWeighted(n){
  const Pf=CONFIG.profiles[n.personality];
  const w={}; for(const k in Pf.train) if(trainCostOk(n,k)) w[k]=Pf.train[k];
  const key=weightedPick(w); if(!key) return false;
  return doTrain(n,key);
}
function aiResearch(n){
  const av=availTechs(n).filter(t=>n.res.gold>=t.g*1.5); // keep a cash buffer
  if(!av.length) return false;
  return doResearch(n, av.sort((a,b)=>a.g-b.g)[0]);
}
function aiSpy(n){
  if(n.army.spy<3) return false;
  const targets=G.nations.filter(x=>x!==n&&x.alive&&!['alliance','vassal','master'].includes(rel(n,x)));
  if(!targets.length) return false;
  const t=targets.sort((a,b)=>b.res.gold-a.res.gold)[0];
  spyMission(n,t, chance(0.3)?'sabotage':'steal');
  return true;
}
function aiConsiderAttack(n){
  if(G.turn<6) return false;                       // early-game grace period
  const Pf=CONFIG.profiles[n.personality];
  let targets=G.nations.filter(x=>x!==n&&x.alive&&(x.hitThisCycle||0)<2&&!['alliance','vassal','master'].includes(rel(n,x)));
  if(!targets.length) return false;
  let t=null, needed=Pf.ratio;
  if(n.personality==='defensive'){
    // defensive AIs never start wars — they only counterattack their last aggressor
    const ag = n.lastAttackedBy && byId(n.lastAttackedBy);
    if(!ag || !ag.alive || rel(n,ag)!=='war') return false;
    t=ag; needed=0.8;
  } else {
    if(G.coalition && rel(n,P())==='war' && targets.includes(P())) t=P();
    else t=targets.sort((a,b)=>score(a)-score(b))[0];        // hunt the weakest
  }
  const commit={infantry:Math.floor(n.army.infantry*0.7),tank:Math.floor(n.army.tank*0.7),jet:Math.floor(n.army.jet*0.7)};
  if(atkPower(n,commit) >= defPower(t)*needed && (commit.infantry+commit.tank+commit.jet)>20){
    resolveAttack(n,t,0.7);
    return true;
  }
  return false;
}
/* the long road to the bomb, step by step */
function aiNukeStep(n){
  if(n.res.gold<5000) return false;
  if(n.b.lab<1) return doBuild(n,'lab');
  if(!hasTech(n,'nuclearPhysics')){
    const av=availTechs(n).filter(t=>n.res.gold>=t.g);
    if(!av.length) return false;
    const phys=av.find(t=>t.id==='nuclearPhysics');
    return doResearch(n, phys || av.sort((a,b)=>a.g-b.g)[0]);
  }
  if(n.b.nuclearFacility<1) return doBuild(n,'nuclearFacility');
  if(!hasTech(n,'icbm')){
    const ic=availTechs(n).find(t=>t.id==='icbm');
    if(ic && n.res.gold>=ic.g) return doResearch(n,ic);
  }
  if(n.nukeProg<CONFIG.warhead.researchNeeded){ n.nukeProg=Math.min(CONFIG.warhead.researchNeeded,n.nukeProg+1); return true; }
  if(n.army.warhead<1 && hasTech(n,'icbm')){
    const W=CONFIG.warhead;
    if(n.res.gold>=W.g && n.res.oil>=W.oil){
      n.res.gold-=W.g; n.res.oil-=W.oil; n.army.warhead++;
      log('nuke',`☢ Intelligence reports: ${nm(n)} has assembled a NUCLEAR WARHEAD.`);
      return true;
    }
    return false;
  }
  if(n.army.warhead>0 && hasTech(n,'icbm')){
    const en=G.nations.filter(x=>x!==n&&x.alive&&!['alliance','vassal','master'].includes(rel(n,x)));
    if(en.length){ deployNuke(n, en.sort((a,b)=>score(b)-score(a))[0]); return true; }
  }
  return false;
}
function aiDiplomacy(n){
  // anti-player coalition: kicks in if you've been #1 for 5+ straight turns
  if(G.coalition && rel(n,P())!=='war' && rel(n,P())!=='vassal' && chance(0.30)){
    setWar(n,P());
    log('diplo',`${nm(n)} has joined the coalition against you!`);
    return;
  }
  // occasional AI–AI alliances
  if(chance(0.10)){
    const cands=G.nations.filter(x=>x!==n&&!x.isPlayer&&x.alive&&rel(n,x)==='peace');
    if(cands.length){
      const t=pick(cands);
      if(chance(CONFIG.profiles[t.personality].acceptAlly)){
        setRel(n,t,'alliance');
        log('diplo',`${nm(n)} and ${nm(t)} signed a secret pact of alliance.`);
      }
    }
  }
  // sue for peace when badly losing a war against the player
  if(rel(n,P())==='war' && score(n)<score(P())*0.4 && chance(0.25)){
    setRel(n,P(),'peace');
    log('diplo',`${nm(n)} unilaterally sued for peace with you, fearing annihilation.`);
  }
}
/* macro-turn: each AI gets a budget of 6 decisions at end of turn */
function aiMacro(n){
  for(let i=0;i<6;i++){
    if(!n.alive||G.over) return;
    const up=upkeep(n), inc=incomes(n);
    if(freeLand(n)<2){ n.land+=rint(6,12); continue; }
    if(n.res.food < up.food*2 && inc.food-up.food<0 && doBuild(n,'farm')) continue;
    if(!G.easy && G.turn>30 && chance(0.35) && aiNukeStep(n)) continue;
    if(chance(0.20) && aiResearch(n)) continue;
    if(chance(CONFIG.profiles[n.personality].spy) && aiSpy(n)) continue;
    if(chance(0.5) ? (aiBuildWeighted(n)||aiTrainWeighted(n)) : (aiTrainWeighted(n)||aiBuildWeighted(n))) continue;
    n.res.gold += Math.floor(n.res.pop*0.12);
  }
  if(n.alive && !G.over && !G.easy && chance(0.6)) aiConsiderAttack(n);   // easy mode: rivals never invade
  if(n.alive && !G.over && !G.easy) aiDiplomacy(n);
}

/* =====================================================================
   Layer 6: player action handlers (event-delegated via data-a attrs)
   ===================================================================== */
function spend(cost){
  if(G.over) return false;
  if(G.actions<cost){ log('sys',`Not enough actions (need ${cost}). End your turn.`); render(); return false; }
  G.actions-=cost; return true;
}
function afterAction(){ aiMicro(); checkAll(); render(); }

function endTurn(){
  if(G.over) return;
  for(const n of G.nations){ n.hitThisCycle=0; n.opsThisTurn={}; }
  for(const n of G.nations) if(n.alive) econTick(n);
  // vassal tribute: 10% of vassal gold flows to the master each turn
  for(const n of G.nations){
    if(!n.alive) continue;
    for(const oid in n.relations){
      if(n.relations[oid]==='master'){
        const m=byId(oid);
        if(m&&m.alive){ const tr=Math.floor(n.res.gold*0.10); n.res.gold-=tr; m.res.gold+=tr;
          if(m.isPlayer&&tr>0) log('eco',`Vassal ${nm(n)} paid ${fmt(tr)} gold in tribute.`); }
      }
    }
  }
  for(const n of G.nations) if(!n.isPlayer&&n.alive) aiMacro(n);
  // surface curated rival highlights: new #1, major tech milestone
  if(!G.over){ for(const n of G.nations.filter(x=>!x.isPlayer&&x.alive)){
    const r=rankOf(n); const was=n._lastRank||99;
    if(r===1 && was!==1 && rankOf(P())!==1) log('intel',`📡 ${nm(n)} has risen to #1 on the world ranking — they are now the dominant power.`);
    n._lastRank=r;
  }}
  // coalition pressure: dominate too long and the world turns on you (disabled in easy mode)
  if(!G.over && !G.easy){
    if(rankOf(P())===1){ G.streak++; } else G.streak=0;
    if(G.streak>=5 && !G.coalition){
      G.coalition=true;
      log('diplo','⚠️ WORLD ALERT: you have been ranked #1 for 5 turns. The rogue states are uniting against you — expect attacks from multiple nations.');
    }
  }
  // IMF: accrue compound interest on player debt, then drift the rate
  if((P().debt||0)>0){
    const interest=Math.ceil(P().debt*(G.imfRate||0.08));
    P().debt+=interest;
    log('eco',`🏦 IMF: interest charged ${fmt(interest)} gold (rate ${((G.imfRate||0.08)*100).toFixed(1)}%). Outstanding debt: ${fmt(P().debt)} gold.`);
  }
  G.imfRate=clamp((G.imfRate||0.08)+(rnd()-0.5)*0.04,0.04,0.16);
  G.turn++; G.actions=CONFIG.actionsPerTurn;
  log('sys',`— TURN ${G.turn} — Your rivals have acted. You have ${CONFIG.actionsPerTurn} fresh actions.`);
  checkAll(); render();
}

const FLAVOR={
  collect:['Emergency requisition complete','Tax collectors swept the bazaars','State coffers reinforced'],
  build:['Construction crews finished the','Workers raised a new','State engineers completed the'],
  train:['Fresh recruits sworn in:','Military parade welcomes','Drill sergeants delivered']
};

const H = {
  /* ---- meta ---- */
  tab:(p)=>{ UI.tab=p; UI.attackTarget=null; render(); },
  newGame:()=>{ G=null; UI.tab='build'; UI.attackTarget=null; render(); },
  toggleEasy:()=>{ UI.mode = UI.mode==='easy' ? 'normal' : 'easy'; render(); },
  pickFaction:(p)=>initGame(p),
  back:()=>{ UI.attackTarget=null; render(); },
  menu:()=>renderMenu(),
  help:()=>renderHelp(),
  keys:()=>renderKeys(),
  helpFromMenu:()=>{ $('menuOverlay').classList.add('hidden'); renderHelp(); },
  firstMoves:()=>renderFirstMoves(),
  firstMovesFromMenu:()=>{ $('menuOverlay').classList.add('hidden'); renderFirstMoves(); },
  setTheme:(p)=>{ applyTheme(p); render(); },
  closeOverlay:()=>{
    $('menuOverlay').classList.add('hidden');
    $('helpOverlay').classList.add('hidden');
    $('keysOverlay').classList.add('hidden');
    $('firstMovesOverlay').classList.add('hidden');
    $('statsOverlay').classList.add('hidden');
  },
  statsFromMenu:()=>{ $('menuOverlay').classList.add('hidden'); renderStats(); },
  saveGame:()=>{
    if(!G||!G.started||G.over) return;
    try{
      localStorage.setItem('eixo-save',JSON.stringify({G,UImode:UI.mode,UItab:UI.tab,UIatk:UI.attackTarget}));
      if(G&&G.started) log('sys','💾 Game saved to browser storage.');
      $('menuOverlay').classList.add('hidden'); render();
    } catch(e){ alert('Save failed: '+e.message); }
  },
  loadGame:()=>{
    const raw=localStorage.getItem('eixo-save');
    if(!raw){ alert('No saved game found.'); return; }
    try{
      const s=JSON.parse(raw);
      G=s.G; UI.mode=s.UImode||'normal'; UI.tab=s.UItab||'build'; UI.attackTarget=s.UIatk||null;
      $('menuOverlay').classList.add('hidden'); $('helpOverlay').classList.add('hidden');
      $('keysOverlay').classList.add('hidden'); $('firstMovesOverlay').classList.add('hidden');
      $('statsOverlay').classList.add('hidden');
      log('sys','📂 Game loaded from browser storage.'); render();
    } catch(e){ alert('Load failed — save data may be corrupted.'); }
  },
  restartGame:()=>{ $('menuOverlay').classList.add('hidden'); G=null; UI.tab='build'; UI.attackTarget=null; render(); },
  resignGame:()=>{ $('menuOverlay').classList.add('hidden'); if(G&&G.started&&!G.over){ loseGame('You resigned — the throne stays empty.'); render(); } },

  /* ---- economy ---- */
  collect:()=>{
    if(!spend(1)) return;
    const inc=incomes(P()), r=P().res;
    r.gold+=inc.gold*0.5; r.oil+=inc.oil*0.5; r.food+=inc.food*0.5; r.industry+=inc.ind*0.5;
    log('eco',`💰 Collected taxes: +${fmt(inc.gold*0.5)} gold, +${fmt(inc.oil*0.5)} oil, +${fmt(inc.food*0.5)} food.`);
    afterAction();
  },
  explore:()=>{
    if(!spend(1)) return;
    const me=P(), g=Math.max(4,Math.round(18 - me.land/50));   // yield diminishes as the nation grows
    me.land+=g;
    log('eco',`🗺️ Scouts claimed ${g} new acres — your total land is now ${fmt(me.land)} acres.`);
    afterAction();
  },
  market:(p,q)=>{
    const me=P(), M=CONFIG.market, amt=M.lot, res=p;
    if(q==='buy'){
      const cost=amt*M[res].buy;
      if(me.res.gold<cost){ log('sys','Not enough gold for that lot.'); render(); return; }
      if(!spend(1)) return;
      me.res.gold-=cost; me.res[res]+=amt;
      log('eco',`🏷️ Bought ${amt} ${res} for ${fmt(cost)} gold on the black market.`);
    } else {
      if(me.res[res]<amt){ log('sys',`Not enough ${res} to sell.`); render(); return; }
      if(!spend(1)) return;
      const gain=amt*M[res].sell;
      me.res[res]-=amt; me.res.gold+=gain;
      log('eco',`🏷️ Sold ${amt} ${res} for ${fmt(gain)} gold on the black market.`);
    }
    afterAction();
  },
  build:(p)=>{
    if(!G.easy && freeLand(P())<1){ log('sys','No free land. EXPLORE to claim acres first.'); render(); return; }
    if(!buildCostOk(P(),p)){ log('sys','Cannot afford that structure.'); render(); return; }
    if(!spend(1)) return;
    doBuild(P(),p);
    log('eco',`🏗️ Built a ${CONFIG.buildings[p].n}. ${CONFIG.buildings[p].d}.`);
    afterAction();
  },
  train:(p)=>{
    if(!trainCostOk(P(),p)){ log('sys','Cannot train: check gold, food and barracks capacity.'); render(); return; }
    if(!spend(1)) return;
    doTrain(P(),p);
    log('eco',`${CONFIG.units[p].i} Trained ${CONFIG.units[p].batch}× ${CONFIG.units[p].n} — ready for deployment.`);
    afterAction();
  },

  /* ---- war ---- */
  target:(p)=>{ UI.attackTarget=p; render(); },
  attack:(p)=>{
    const t=byId(UI.attackTarget); if(!t||!t.alive) return;
    const ops=(P().opsThisTurn[t.id]||0);
    if(ops>=CONFIG.maxOpsPerTarget){
      log('war',`⚔️ ${nm(t)} is on HIGH ALERT — you have hit them ${ops} times this turn. Wait until next turn to attack again.`);
      render(); return;
    }
    if(!spend(2)) return;
    P().opsThisTurn[t.id]=(ops)+1;
    resolveAttack(P(),t,parseInt(p,10)/100);
    afterAction();
  },
  scud:()=>{
    const t=byId(UI.attackTarget); if(!t||!t.alive||P().army.scud<1) return;
    if(!spend(1)) return;
    P().opsThisTurn[t.id]=(P().opsThisTurn[t.id]||0)+1;
    scudStrike(P(),t);
    afterAction();
  },
  nuke:()=>{
    const t=byId(UI.attackTarget); if(!t||!t.alive||P().army.warhead<1||!hasTech(P(),'icbm')) return;
    if(!spend(2)) return;
    deployNuke(P(),t);
    afterAction();
  },

  /* ---- espionage ---- */
  spy:(p,q)=>{
    const t=byId(p); if(!t||!t.alive) return;
    const ops=(P().opsThisTurn[t.id]||0);
    if(ops>=CONFIG.maxOpsPerTarget){
      log('spy',`🕶️ ${nm(t)} is on HIGH ALERT — your network is burned there this turn. Try a different target or end your turn.`);
      render(); return;
    }
    if(!spend(1)) return;
    P().opsThisTurn[t.id]=(ops)+1;
    spyMission(P(),t,q);
    afterAction();
  },

  /* ---- science ---- */
  tech:(p)=>{
    const t=techOf(p), me=P();
    if(!availTechs(me).includes(t)||me.res.gold<t.g){ log('sys','Research unavailable.'); render(); return; }
    if(!spend(1)) return;
    doResearch(me,t);
    log('eco',`🔬 Research complete: ${t.n} — ${t.d}`);
    afterAction();
  },
  nukeAdv:()=>{
    const me=P();
    if(me.b.nuclearFacility<1||!hasTech(me,'nuclearPhysics')||me.nukeProg>=CONFIG.warhead.researchNeeded) return;
    if(!spend(1)) return;
    me.nukeProg=Math.min(CONFIG.warhead.researchNeeded, me.nukeProg+2);
    log('eco',`☢️ Warhead research advanced: ${me.nukeProg}/${CONFIG.warhead.researchNeeded}. Keep going — you need to reach ${CONFIG.warhead.researchNeeded} to assemble.`);
    afterAction();
  },
  assemble:()=>{
    const me=P(), W=CONFIG.warhead;
    if(me.nukeProg<W.researchNeeded||me.res.gold<W.g||me.res.oil<W.oil) { log('sys','Warhead assembly requirements not met.'); render(); return; }
    if(!spend(1)) return;
    me.res.gold-=W.g; me.res.oil-=W.oil; me.army.warhead++;
    log('nuke','☢️ WARHEAD ASSEMBLED. The bomb is ready. Now research the ICBM Program tech, then deploy it while ranked #1 to win.');
    afterAction();
  },

  /* ---- diplomacy ---- */
  diplo:(p,q)=>{
    const t=byId(p), me=P();
    if(!t||!t.alive) return;
    if(!spend(1)) return;
    if(q==='ally'){
      const base=CONFIG.profiles[t.personality].acceptAlly;
      const ratio=score(me)/Math.max(score(t),1);
      const earlyWary=clamp(G.turn/8,0.25,1); // nations are suspicious of unknown powers early-game
      const ok = ratio>0.5 && ratio<2.5 && chance((base + (rel(me,t)==='war'?-0.3:0))*earlyWary);
      if(ok){ setRel(me,t,'alliance'); log('diplo',`🤝 ${nm(t)} accepted your alliance proposal. They count toward your Domination victory.`); }
      else log('diplo',`🤝 ${nm(t)} rejected your alliance proposal. ${G.turn<8?'Nations distrust strangers early in the game — build power and try again later.':'Try again when you are closer in power.'}`);
    } else if(q==='war'){
      setWar(me,t);
    } else if(q==='peace'){
      const ok = chance(score(t)<score(me)?0.7:0.35);
      if(ok){ setRel(me,t,'peace'); log('diplo',`🕊️ ${nm(t)} accepted a peace treaty. Hostilities have ended.`); }
      else log('diplo',`🕊️ ${nm(t)} refused your peace offer. The war continues.`);
    } else if(q==='vassal'){
      if(rel(me,t)==='war' && score(t)<score(me)*0.25){
        setRel(me,t,'vassal','master');
        log('diplo',`♟️ ${nm(t)} capitulated — now your VASSAL. They will pay 10% of their gold as tribute each turn.`);
      } else log('diplo',`♟️ ${nm(t)} refused to surrender. Their score must be below 25% of yours to vassalize them.`);
    } else if(q==='break'){
      setRel(me,t,'peace');
      log('diplo',`You dissolved the alliance with ${nm(t)}. Relations return to neutral peace.`);
    }
    afterAction();
  },
  /* ---- IMF loans ---- */
  loan:(p)=>{
    const me=P(), amt=parseInt(p,10);
    if(!amt||amt<=0){ log('sys','Invalid loan amount.'); render(); return; }
    if((me.debt||0)+amt > score(me)*0.8){ log('sys','🏦 IMF REFUSES — you are already over-leveraged. Repay existing debt first.'); render(); return; }
    if(!spend(1)) return;
    me.res.gold+=amt; me.debt=(me.debt||0)+amt;
    log('eco',`🏦 IMF granted a ${fmt(amt)} gold loan at ${((G.imfRate||0.08)*100).toFixed(1)}% interest. Outstanding debt: ${fmt(me.debt)} gold. Repay before it compounds.`);
    afterAction();
  },
  repay:(p)=>{
    const me=P();
    if(!(me.debt>0)){ log('sys','No outstanding IMF debt.'); render(); return; }
    const requested=p==='all'?me.debt:parseInt(p,10);
    const amt=Math.min(requested,me.debt,Math.floor(me.res.gold));
    if(amt<=0){ log('sys','Not enough gold to repay.'); render(); return; }
    if(!spend(1)) return;
    me.res.gold-=amt; me.debt-=amt;
    log('eco',`🏦 Repaid ${fmt(amt)} gold to the IMF. Remaining debt: ${fmt(me.debt)} gold.`);
    afterAction();
  },
  endTurn
};
