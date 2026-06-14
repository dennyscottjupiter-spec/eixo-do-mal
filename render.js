'use strict';
/* =====================================================================
   EIXO DO MAL — render.js
   Layer 7: core in-game rendering — one render() rewrites everything from state
   ===================================================================== */
const $=id=>document.getElementById(id);
const REL_ICON={war:'⚔',alliance:'✦',vassal:'♟',master:'⛓',peace:'·'};

/* Full-screen nuclear blast image — shown on any deployNuke() call */
function showBlast(){
  const el=$('blastOverlay');
  if(!el) return;
  clearTimeout(showBlast._t);
  el.classList.remove('hidden','blast-fade');
  void el.offsetWidth; // force reflow so CSS transition replays
  el.classList.add('blast-show');
  showBlast._t = setTimeout(()=>{
    el.classList.add('blast-fade');
    setTimeout(()=>{
      el.classList.add('hidden');
      el.classList.remove('blast-show','blast-fade');
    }, 600);
  }, 2200);
}

function render(){
  if(!G || !G.started){ document.body.classList.remove('ingame'); renderFactionOverlay(true); if(window.twemoji) twemoji.parse(document.body,{base:'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',folder:'svg',ext:'.svg'}); return; }
  document.body.classList.add('ingame');
  renderFactionOverlay(false);
  renderDefcon(); renderHud(); renderDetail(); renderCmd(); renderTabs(); renderTabContent();
  renderLog(); renderRank(); renderOver();
  if(window.twemoji) twemoji.parse(document.body,{base:'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',folder:'svg',ext:'.svg'});
}

function renderDefcon(){
  const w=warsCount(), d=clamp(5-w,1,5);
  const blocks=Array.from({length:5},(_,i)=>i<(6-d)?'■':'□').join('');
  $('defcon-inner').innerHTML=
    `<span class="brand">EIXO DO MAL <small>// WORLD DOMINATION TERMINAL v2.3</small></span>`+
    `<span class="dstat d${d}">DEFCON ${d} [${blocks}] ${w} active war${w===1?'':'s'}</span>`+
    `<span class="dstat">${fb(P()).flag} ${nm(P()).toUpperCase()} · TURN <b>${G.turn}</b><span class="cursor"></span></span>`;
}

/* renderHud — sticky top resource bar, redrawn every action */
function renderHud(){
  const n=P(), inc=incomes(n), up=upkeep(n);
  const chip=(icon,val,delta,tip)=>{
    const cls=delta>=0?'g':'r', sign=delta>=0?'+':'';
    return `<span class="hchip" title="${tip}">${icon} <span class="hval">${fmt(val)}</span><span class="hdelta ${cls}">${sign}${fmt(delta)}</span></span>`;
  };
  let h='';
  h+=chip('💰',n.res.gold,Math.round(inc.gold),'Gold — your main currency. Spend on buildings, troops, tech and market. The +number is next turn\'s income.');
  h+=`<span class="hud-sep">|</span>`;
  h+=chip('🛢️',n.res.oil,Math.round(inc.oil-up.oil),'Oil — fuel for tanks and jets. Running out cuts their combat power by 50%. +number is net oil gain per turn.');
  if(n.oilShort) h+=`<span class="oilshort-badge">OIL!</span>`;
  h+=`<span class="hud-sep">|</span>`;
  h+=chip('🌾',n.res.food,Math.round(inc.food-up.food),'Food — feeds your army and population. Famine drops population 5% and collapses morale. +number is net food per turn.');
  h+=`<span class="hud-sep">|</span>`;
  h+=chip('⚙️',n.res.industry,Math.round(inc.ind),'Industry — multiplies all building output (up to 2×). More factories = faster gold, oil, food, and research. +number gained per turn.');
  h+=`<span class="hud-sep">|</span>`;
  h+=`<span class="hchip" title="Population — sets your base gold income (pop × 0.5 per turn). Rises 2%/turn when fed; shown as current / capacity.">👥 <span class="hval">${fmt(n.res.pop)}</span><span class="hdelta dim">/${fmt(popCap(n))}</span></span>`;
  h+=`<span class="hud-sep">|</span>`;
  h+=`<span class="hchip" title="Free land — acres available to build on. Each building costs 1 acre. Use EXPLORE to claim more land.">🗺 <span class="hval">${fmt(freeLand(n))}</span><span class="hdelta dim"> free ac.</span></span>`;
  h+=`<span class="hud-sep">|</span>`;
  h+=`<span class="hchip dim" title="Attack power — combined offensive strength: infantry + tanks×4 + jets×6, scaled by morale and tech bonuses.">⚔ <span class="hval">${fmt(atkPower(n,n.army))}</span></span>`;
  h+=`<span class="hud-sep">·</span>`;
  h+=`<span class="hchip dim" title="Defense power — your ability to repel invasions. Boosted by turrets, bunkers, and your defensive tech bonus.">🛡 <span class="hval">${fmt(defPower(n))}</span></span>`;
  h+=`<span class="hud-sep">|</span>`;
  h+=`<span class="hchip" title="Morale — multiplies attack power (max 150). Rises slowly in peacetime; drops from defeats, famine, or nuclear strikes."><span class="dim">morale </span><span class="bar dim">[${asciiBar(n.morale,150,8)}]</span> <span class="hval">${n.morale}</span></span>`;
  $('hud').innerHTML=h;
}

/* renderDetail — forces + structures in the right panel */
function renderDetail(){
  const n=P();
  let h='';
  h+=`<div id="sec-forces" class="sec" title="Your live military inventory. Infantry/tanks/jets are combat troops — they attack and defend. Turrets are static defense towers (cannot attack, never lost in combat). Spies run covert ops. SCUDs are one-use missiles that destroy enemy buildings from any range. Warheads are nuclear weapons. Capacity = current troops / max allowed by your barracks.">ARMED FORCES</div>`;
  h+=`<div class="kv" title="Cheap front-line soldiers. Attack power 1, defense 1.2. No oil upkeep — always fight at full strength."><span>${CONFIG.units.infantry.i} Infantry</span><span>${fmt(n.army.infantry)}</span></div>`;
  h+=`<div class="kv" title="Heavy armor. Attack power 4× infantry. Needs oil or fights at 50% strength. Check your oil delta in the HUD — keep it positive."><span>${CONFIG.units.tank.i} Tanks</span><span>${fmt(n.army.tank)}</span></div>`;
  h+=`<div class="kv" title="Deadliest offensive unit — attack power 6× infantry. Also intercepts incoming SCUD missiles. Oil-hungry: oil shortage halves their power."><span>${CONFIG.units.jet.i} Jet Fighters</span><span>${fmt(n.army.jet)}</span></div>`;
  h+=`<div class="kv" title="Static defense tower — adds 4 defense power each. Cannot attack, never lost in combat, no oil or food upkeep. Stack them to make your territory a fortress."><span>${CONFIG.units.turret.i} Turrets <span class="dim">(def)</span></span><span>${fmt(n.army.turret)}</span></div>`;
  h+=`<div class="kv" title="Your spy network. More spies = higher success rate on covert ops (steal gold, sabotage buildings, poison population, gather intel). Success rate = your spies ÷ (their spies × 1.5)."><span>${CONFIG.units.spy.i} Spies</span><span>${fmt(n.army.spy)}</span></div>`;
  h+=`<div class="kv" title="One-use ballistic missiles. Each launch destroys 2-3 enemy buildings from any range — their jets may intercept it. The more jets the enemy has, the lower your hit chance."><span>${CONFIG.units.scud.i} SCUD Missiles</span><span>${fmt(n.army.scud)}</span></div>`;
  h+=`<div class="kv" title="Nuclear warhead. Assembled after completing the Manhattan-Do-Mal Project path. Deploy via ATTACK tab while ranked #1 to win the game instantly."><span>☢️ Warheads</span><span>${fmt(n.army.warhead)}</span></div>`;
  h+=`<div class="kv dim" title="Current / maximum troop count. Barracks raise the cap by 100 each. When full you cannot train more infantry, tanks, or jets — build more Barracks first."><span>Capacity</span><span>${fmt(troopCnt(n))}/${fmt(troopCap(n))}</span></div>`;
  h+=`<div class="kv dim" title="Your attack power (infantry + tanks×4 + jets×6, scaled by morale/oil/tech) vs your defense power (same units + turrets×4 + bunker bonus, scaled by faction). Higher attack wins assaults; higher defense repels them."><span>Atk / Def</span><span>${fmt(atkPower(n,n.army))} / ${fmt(defPower(n))}</span></div>`;
  h+=`<div id="sec-structures" class="sec" title="Your built infrastructure. Each building costs 1 acre of land and produces resources every turn. The Industry × multiplier (from factories) scales ALL building output up to 2×. More factories = every bank, farm, and oil field earns double.">STRUCTURES</div>`;
  for(const k in n.b) h+=`<div class="kv" title="${CONFIG.buildings[k].n}: ${CONFIG.buildings[k].d}. You have ${n.b[k]}."><span>${CONFIG.buildings[k].i} ${CONFIG.buildings[k].n}</span><span>${n.b[k]}</span></div>`;
  h+=`<div class="kv dim" title="Industry multiplier: all building income (gold, oil, food) is multiplied by this factor each turn. Starts at 1.0× with no factories; caps at 2.0× with 300+ industry. Build factories early — they compound everything." style="margin-top:4px"><span>Industry ×</span><span>${industryMult(n).toFixed(2)}</span></div>`;
  if(hasTech(n,'nuclearPhysics')){
    h+=`<div class="sec" title="Your warhead development progress. Passive research: +1 per turn with an active Nuclear Facility. Manual advance: TECH tab → ADVANCE +2 (costs 1 action). Reach ${CONFIG.warhead.researchNeeded}/${CONFIG.warhead.researchNeeded} to unlock the ASSEMBLE button.">☢ NUCLEAR</div>`;
    h+=`<div class="dim">[${asciiBar(n.nukeProg,CONFIG.warhead.researchNeeded,12)}] ${n.nukeProg}/${CONFIG.warhead.researchNeeded}</div>`;
  }
  $('detail').innerHTML=h;
}

function renderCmd(){
  $('cmdbar').innerHTML=
    `<span>ACTIONS <span class="bar">[${asciiBar(G.actions,CONFIG.actionsPerTurn,10)}]</span> <b>${G.actions}/${CONFIG.actionsPerTurn}</b></span>`+
    `<button class="btn gr" data-a="collect" title="Collect half your turn's income right now — gold, oil, food. Costs 1 action. Shortcut: Space." ${G.actions<1?'disabled':''}>💰 COLLECT ▸1</button>`+
    `<button class="btn cy" data-a="explore" title="Send scouts to claim new land. You need free acres to build. Costs 1 action. Shortcut: X." ${G.actions<1?'disabled':''}>🗺️ EXPLORE ▸1</button>`+
    `<button class="btn warn" data-a="endTurn" title="End your turn. All rivals act, then you get 10 fresh actions. Shortcut: Enter.">⏎ END TURN</button>`;
}

function renderTabs(){
  const tabs=[['build','🏗 BUILD','Construct buildings that produce resources or troops'],
              ['train','🎖 TRAIN','Recruit soldiers, tanks, jets, spies, turrets or missiles'],
              ['market','🏷 MARKET','Buy or sell oil and food on the black market'],
              ['attack','⚔️ ATTACK','Launch a ground assault, fire a missile, or drop a nuke'],
              ['spy','🕶️ SPY','Send agents to steal gold, sabotage buildings, or gather intel'],
              ['tech','🔬 TECH','Research technologies that boost production, combat, or unlock nukes'],
              ['diplo','🤝 DIPLO','Propose alliances, declare war, or vassalize weaker nations']];
  $('tabs').innerHTML=tabs.map(([k,l,tip])=>
    `<button class="tab${UI.tab===k?' on':''}" data-a="tab" data-p="${k}" title="${tip}">${l}</button>`).join('');
}

function intelStr(t){
  const fresh = P().intel[t.id]!==undefined && (G.turn-P().intel[t.id])<=5;
  if(!fresh) return `<span class="muted">army ??? · gold ??? · bldgs ??? <span class="dim">(run INTEL)</span></span>`;
  return `<span class="c">army ${fmt(troopCnt(t))} · gold ${fmt(t.res.gold)} · bldgs ${totalBuildings(t)} · spies ${fmt(t.army.spy)}</span>`;
}
function targetsOf(){ return G.nations.filter(t=>!t.isPlayer&&t.alive); }

function renderTabContent(){
  const me=P(); let h='';
  if(UI.tab==='build'){
    const fl=freeLand(me);
    h+=`<div class="sec">CONSTRUCT — 1 action each · <span class="${fl<1?'r':'dim'}">free land: ${fmt(fl)} acres</span></div>`;
    const BW={oilField:'Fuels tanks and jets every turn — running out cuts their combat power by 50%.',farm:'Feeds army and population. Famine kills 5% pop and collapses morale every turn — build this first.',factory:'Multiplies ALL building output up to 2×. Every bank, farm, and oil field earns more when you have factories.',bank:'Your biggest gold income source — 60 gold/turn each. Gold pays for buildings, troops, tech, and loans.',barracks:'Raises troop capacity by 100. You cannot train more infantry/tanks/jets than your barracks allow.',bunker:'Adds +5% defense per bunker. Stack them to make your territory a fortress against invasions.',lab:'Unlocks the entire tech tree. Without a lab you cannot research ANYTHING — including the nuclear path.',nuclearFacility:'Passively advances warhead research by 1 step/turn. Step 2 on the nuclear path (requires Nuclear Physics tech).'};
    for(const k in CONFIG.buildings){
      const b=CONFIG.buildings[k], lock=b.req&&!hasTech(me,b.req);
      const tip=`Build a ${b.n}: ${b.d}. Costs ${fmt(b.g)} gold and ${b.ind} industry.${lock?' Requires Nuclear Physics tech first.':''}`;
      const ltip=`${b.n} — ${BW[k]||b.d}`;
      h+=`<div class="row"><span class="grow" title="${ltip}">${b.i} <b>${b.n}</b> <span class="dim">(${me.b[k]})</span><br><span class="muted">${b.d}${lock?' — <span class="r">requires Nuclear Physics</span>':''}</span></span>`+
         `<span class="dim">${fmt(b.g)}💰 ${b.ind}⚙️</span>`+
         `<button class="btn" data-a="build" data-p="${k}" title="${tip}" ${(!buildCostOk(me,k)||G.actions<1)?'disabled':''}>BUILD</button></div>`;
    }
  }
  else if(UI.tab==='train'){
    h+=`<div class="sec">TRAIN — 1 action per batch · capacity ${fmt(troopCnt(me))}/${fmt(troopCap(me))}</div>`;
    const UW={infantry:'Cheap front-line soldiers. Good in large numbers for both attack and defense. No oil upkeep.',tank:'4× attack power. Heavy armor for breakthroughs — needs oil or fights at 50% strength.',jet:'6× attack power and intercepts enemy SCUDs. Oil-hungry but the deadliest offensive unit in the game.',spy:'Enables covert ops: steal gold, blow up buildings, poison population, gather intel. More spies = higher success rate.',turret:'Static defense tower — holds the line at no oil or food cost. Cannot attack, only defend.',scud:'One-use missile: destroys 1-2 enemy buildings from a distance. Enemy jets may intercept it.'};
    for(const k in CONFIG.units){
      const u=CONFIG.units[k];
      const desc=u.atk?`Atk ${u.atk} / Def ${u.def} — good for ground combat`:k==='spy'?'Used for covert ops: steal gold, sabotage, gather intel':k==='turret'?`Static defense tower — Def ${u.def}, cannot attack`:'Missile — destroys enemy buildings from a distance';
      const tip=`Train ${u.batch}× ${u.n}. ${desc}. Costs ${fmt(unitGoldCost(me,k))} gold.`;
      const ltip=`${u.n} — ${UW[k]||desc}`;
      h+=`<div class="row"><span class="grow" title="${ltip}">${u.i} <b>${u.n}</b> <span class="dim">(own ${fmt(me.army[k])})</span><br><span class="muted">${u.atk?`atk ${u.atk} / def ${u.def}`:k==='spy'?'covert operations':k==='turret'?`static defense / def ${u.def}`:'destroys enemy buildings'}</span></span>`+
         `<span class="dim">${fmt(unitGoldCost(me,k))}💰 ${u.f*u.batch}🌾</span>`+
         `<button class="btn" data-a="train" data-p="${k}" title="${tip}" ${(!trainCostOk(me,k)||G.actions<1)?'disabled':''}>TRAIN ×${u.batch}</button></div>`;
    }
  }
  else if(UI.tab==='market'){
    const M=CONFIG.market;
    h+=`<div class="sec">BLACK MARKET — 1 action per lot of ${M.lot}</div>`;
    h+=`<div class="muted" style="margin-bottom:6px">On-hand: 🛢️ ${fmt(me.res.oil)} oil · 🌾 ${fmt(me.res.food)} food · 💰 ${fmt(me.res.gold)} gold</div>`;
    const MWHY={oil:'Needed by tanks and jets — running low cuts their combat power by 50%. Sell surplus; buy before your oil delta goes negative.',food:'Feeds your army and population. Famine kills 5% pop per turn. Sell excess; buy immediately if your food delta is red.'};
    for(const res of ['oil','food']){
      const ic=res==='oil'?'🛢️':'🌾';
      h+=`<div class="row"><span class="grow" title="${MWHY[res]}">${ic} <b>${res.toUpperCase()}</b> <span class="dim">buy ${M[res].buy}💰 · sell ${M[res].sell}💰 each</span></span>`+
         `<button class="btn cy" data-a="market" data-p="${res}" data-q="buy" title="Spend ${M.lot*M[res].buy} gold to buy ${M.lot} ${res}. Costs 1 action." ${(me.res.gold<M.lot*M[res].buy||G.actions<1)?'disabled':''}>BUY ${M.lot}</button>`+
         `<button class="btn" data-a="market" data-p="${res}" data-q="sell" title="Sell ${M.lot} ${res} for ${M.lot*M[res].sell} gold. Costs 1 action." ${(me.res[res]<M.lot||G.actions<1)?'disabled':''}>SELL ${M.lot}</button></div>`;
    }
    const rate=((G.imfRate||0.08)*100).toFixed(1), debt=me.debt||0;
    const overleveraged=debt>score(me)*0.8;
    h+=`<div class="sec">🏦 INTERNATIONAL MONETARY FUND — 1 action each</div>`;
    h+=`<div class="muted" style="margin-bottom:6px">Current interest rate: <b class="${parseFloat(rate)>=12?'r':parseFloat(rate)>=9?'c':'g'}">${rate}%/turn</b> (compound, changes each turn) · Debt: <b class="${debt>0?'r':'g'}">${fmt(debt)} gold</b>${debt>0?' — subtracts from your net-worth':''}</div>`;
    h+=`<div class="row" style="flex-wrap:wrap;gap:6px"><span class="grow dim">BORROW${overleveraged?' <span class="r">(over-leveraged — repay first)</span>':''}</span>`+
      [1000,2500,5000].map(amt=>`<button class="btn cy" data-a="loan" data-p="${amt}" title="Borrow ${fmt(amt)} gold from the IMF. Repaid with ${rate}% compound interest per turn. IMF refuses if debt exceeds 80% of your net-worth." ${(overleveraged||G.actions<1)?'disabled':''}>+${fmt(amt)}</button>`).join('')+`</div>`;
    h+=`<div class="row" style="flex-wrap:wrap;gap:6px"><span class="grow dim">REPAY${debt<=0?' <span class="g">(no debt)</span>':''}</span>`+
      [1000,5000].map(amt=>`<button class="btn" data-a="repay" data-p="${amt}" title="Pay down ${fmt(amt)} gold of IMF debt. Costs 1 action." ${(debt<=0||me.res.gold<amt||G.actions<1)?'disabled':''}>−${fmt(amt)}</button>`).join('')+
      `<button class="btn gr" data-a="repay" data-p="all" title="Pay off your entire IMF debt in one action." ${(debt<=0||me.res.gold<debt||G.actions<1)?'disabled':''}>REPAY ALL</button></div>`;
  }
  else if(UI.tab==='attack'){
    const t=UI.attackTarget&&byId(UI.attackTarget);
    if(!t||!t.alive){
      h+=`<div class="sec">SELECT TARGET — attack costs 2 actions</div>`;
      for(const x of targetsOf()){
        const r=rel(me,x), block=['alliance','vassal'].includes(r);
        const atkOps=(P().opsThisTurn&&P().opsThisTurn[x.id])||0;
        const atkCap=atkOps>=CONFIG.maxOpsPerTarget;
        const tltip=block?`${nm(x)} is your ${r} — you cannot attack allies or vassals.`:atkCap?`${nm(x)} is on HIGH ALERT — already hit ${atkOps} times this turn. Wait for next turn.`:`${nm(x)} (ranked #${rankOf(x)}) — click ENGAGE to plan an assault. Run SPY → INTEL first to reveal their army and gold.`;
        h+=`<div class="row"><span class="grow" title="${tltip}">${fb(x).flag} <b>${nm(x)}</b> <span class="dim">#${rankOf(x)}</span> ${REL_ICON[r]||''}${atkCap?' <span class="r">· HIGH ALERT</span>':''}<br>${intelStr(x)}</span>`+
           `<button class="btn warn" data-a="target" data-p="${x.id}" title="${block?`Cannot attack — they are your ${r}`:atkCap?`${nm(x)} is on high alert — wait until next turn`:`Select ${nm(x)} as your attack target`}" ${(block||atkCap)?'disabled':''}>${block?(r==='vassal'?'VASSAL':'ALLY'):atkCap?'ALERT':'ENGAGE ▸'}</button></div>`;
      }
      if(!targetsOf().length) h+=`<div class="muted">No nations left to attack. You are alone among the ruins.</div>`;
    } else {
      h+=`<div class="sec">OFFENSIVE vs ${nm(t).toUpperCase()}</div>`;
      h+=`<div class="row"><span class="grow">${fb(t).flag} <b>${nm(t)}</b> — ${intelStr(t)}</span><button class="btn" data-a="back" title="Go back to the target list">◂ BACK</button></div>`;
      h+=`<div class="row"><span class="grow" title="Ground invasion: commit a % of your army. Win → seize their land and loot gold. Lose → heavy troop casualties. Costs 2 actions.">Ground assault <span class="dim">(▸2 actions — seizes acres + loot on victory)</span></span>`+
         [25,50,75,100].map(p=>`<button class="btn warn" data-a="attack" data-p="${p}" title="Commit ${p}% of your army. Win → loot gold + seize land. Lose → heavy casualties. Costs 2 actions." ${G.actions<2?'disabled':''}>${p}%</button>`).join('')+`</div>`;
      h+=`<div class="row"><span class="grow" title="SCUD missile: destroys 1-2 enemy buildings from any range. Bypasses their army — but their jets may intercept it.">🚀 SCUD strike <span class="dim">(▸1 action, consumes 1 missile · own ${me.army.scud})</span></span>`+
         `<button class="btn warn" data-a="scud" title="Fire a SCUD missile — destroys 1–2 of their buildings. Costs 1 action and 1 missile." ${(me.army.scud<1||G.actions<1)?'disabled':''}>LAUNCH</button></div>`;
      const canNuke=me.army.warhead>0&&hasTech(me,'icbm');
      h+=`<div class="row"><span class="grow" title="${canNuke?'Nuclear warhead: wipes 70% of their population and 60% of their buildings. Win instantly if you are ranked #1.':'Requires: assembled warhead + ICBM Program tech. Path: Nuclear Physics → Nuclear Facility → advance research → assemble → ICBM.'}">☢️ NUCLEAR STRIKE <span class="dim">(▸2 actions${canNuke?'':' — needs warhead + ICBM Program'})</span></span>`+
         `<button class="btn warn" data-a="nuke" title="${canNuke?'Detonate a nuclear warhead — devastates the target. Win the game if you are ranked #1.':'You need an assembled warhead AND the ICBM Program tech to deploy this.'}" ${(!canNuke||G.actions<2)?'disabled':''}>☢️ DEPLOY</button></div>`;
    }
  }
  else if(UI.tab==='spy'){
    h+=`<div class="sec">COVERT OPS — 1 action · network: ${fmt(me.army.spy)} spies</div>`;
    for(const x of targetsOf()){
      const hasIntel=P().intel[x.id]!==undefined&&(G.turn-P().intel[x.id])<=5;
      const spyLtip=hasIntel?`Intel on ${nm(x)} is current — army, gold, and buildings are visible. Run ops below.`:`Run covert ops against ${nm(x)}. ??? means no intel yet — use INTEL first to reveal their army, gold, and buildings.`;
      const opsOnX=(P().opsThisTurn&&P().opsThisTurn[x.id])||0;
      const atCap=opsOnX>=CONFIG.maxOpsPerTarget;
      h+=`<div class="row"><span class="grow" title="${spyLtip}">${fb(x).flag} <b>${nm(x)}</b>${atCap?' <span class="r">· HIGH ALERT ('+opsOnX+'/'+CONFIG.maxOpsPerTarget+' ops)</span>':''}<br>${intelStr(x)}</span>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="steal" title="Spies steal 5–15% of ${nm(x)}'s gold and transfer it to you." ${(G.actions<1||atCap)?'disabled':''}>STEAL</button>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="sabotage" title="Saboteurs blow up one of ${nm(x)}'s buildings." ${(G.actions<1||atCap)?'disabled':''}>SABOTAGE</button>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="killpop" title="Poison the water supply — kills 5–13% of ${nm(x)}'s population." ${(G.actions<1||atCap)?'disabled':''}>KILL POP</button>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="intel" title="Get a full report on ${nm(x)}'s army, gold, and buildings. Valid for 5 turns." ${(G.actions<1||atCap)?'disabled':''}>INTEL</button></div>`;
    }
  }
  else if(UI.tab==='tech'){
    h+=`<div class="sec">TECH TREE — 1 action each${me.b.lab<1?' · <span class="r">build a Research Lab first</span>':''}</div>`;
    const av=availTechs(me);
    for(const t of CONFIG.techs){
      const done=hasTech(me,t.id), can=av.includes(t)&&me.res.gold>=t.g;
      let st;
      if(done) st=`<span class="g">[RESEARCHED]</span>`;
      else if(av.includes(t)) st=`<button class="btn" data-a="tech" data-p="${t.id}" title="Research ${t.n}: ${t.d}. Costs ${fmt(t.g)} gold and 1 action." ${(!can||G.actions<1)?'disabled':''}>RESEARCH ${fmt(t.g)}💰</button>`;
      else {
        const prevTierTechs=CONFIG.techs.filter(x=>x.tier===t.tier-1).map(x=>x.n);
        const needsTier=t.tier>1&&!me.techs.some(id=>techOf(id).tier===t.tier-1);
        const needsReq=t.req&&!hasTech(me,t.req);
        const lockParts=[];
        if(needsTier) lockParts.push(`research any Tier ${t.tier-1} tech first (${prevTierTechs.join(' or ')})`);
        if(needsReq) lockParts.push(`also need ${techOf(t.req).n}`);
        if(me.b.lab<1) lockParts.push('build a Research Lab first');
        st=`<span class="r">[LOCKED — ${lockParts.join(' · ')}]</span>`;
      }
      const treqName=t.req?techOf(t.req).n:'';
      const techLtip=done?`${t.n} — already researched. Effect: ${t.d}.`
        :av.includes(t)?`Tier ${t.tier} upgrade: ${t.d}. Techs unlock in tier order — research lower tiers first.${treqName?' Also requires: '+treqName+'.':''}`
        :`Locked — complete at least one Tier ${t.tier-1} tech first.${treqName?' Also requires: '+treqName+'.':''}`;
      h+=`<div class="row"><span class="grow" title="${techLtip}"><span class="dim">T${t.tier}</span> <b>${t.n}</b><br><span class="muted">${t.d}</span></span>${st}</div>`;
    }
    h+=`<div class="sec">☢️ MANHATTAN-DO-MAL PROJECT</div>`;
    const W=CONFIG.warhead, phys=hasTech(me,'nuclearPhysics'), fac=me.b.nuclearFacility>0;
    h+=`<div class="muted">1. Nuclear Physics ${phys?'<span class="g">✔</span>':'✘'} → 2. Nuclear Facility ${fac?'<span class="g">✔</span>':'✘'} → 3. Research ×${W.researchNeeded} → 4. Assemble → 5. ICBM → 6. Deploy as #1 power = <b>VICTORY</b></div>`;
    h+=`<div class="row"><span class="grow">Warhead research <span class="dim">[${asciiBar(me.nukeProg,W.researchNeeded,14)}] ${me.nukeProg}/${W.researchNeeded} (+1 passive/turn with facility)</span></span>`+
       `<button class="btn" data-a="nukeAdv" title="Manually advance warhead research by 2 steps. Requires Nuclear Physics tech + Nuclear Facility. Costs 1 action." ${(!phys||!fac||me.nukeProg>=W.researchNeeded||G.actions<1)?'disabled':''}>ADVANCE +2</button></div>`;
    h+=`<div class="row"><span class="grow">Assemble warhead <span class="dim">${fmt(W.g)}💰 + ${W.oil}🛢️ · own: ${me.army.warhead}</span></span>`+
       `<button class="btn warn" data-a="assemble" title="Build a nuclear warhead. Then research ICBM Program and deploy it as the #1 power to win. Costs ${fmt(W.g)} gold + ${W.oil} oil." ${(me.nukeProg<W.researchNeeded||me.res.gold<W.g||me.res.oil<W.oil||G.actions<1)?'disabled':''}>ASSEMBLE</button></div>`;
  }
  else if(UI.tab==='diplo'){
    h+=`<div class="sec">DIPLOMACY — 1 action each</div>`;
    const RDESC={peace:'Neutral — propose an alliance (counts toward Domination) or declare war to enable ground attacks.',war:'At war — you can assault them, fire SCUDs, or vassalize them when they drop below 25% of your score.',alliance:'Allied — counts toward your Domination victory bloc. You cannot attack an ally.',vassal:'Your vassal — pays you 10% tribute each turn and counts toward Domination.',master:'You are their vassal, paying 10% tribute each turn.'};
    for(const x of targetsOf()){
      const r=rel(me,x);
      let btns='';
      if(r==='peace') btns=`<button class="btn" data-a="diplo" data-p="${x.id}" data-q="ally" title="Propose an alliance — they may accept or refuse. Allies count toward your Domination victory." ${G.actions<1?'disabled':''}>PROPOSE ALLIANCE</button>`+
                           `<button class="btn warn" data-a="diplo" data-p="${x.id}" data-q="war" title="Formally declare war on ${nm(x)}. This allows you to attack them." ${G.actions<1?'disabled':''}>DECLARE WAR</button>`;
      else if(r==='war'){
        const canV=score(x)<score(me)*0.25;
        btns=`<button class="btn" data-a="diplo" data-p="${x.id}" data-q="peace" title="Offer a peace treaty. ${nm(x)} is more likely to accept if they are losing." ${G.actions<1?'disabled':''}>OFFER PEACE</button>`+
             `<button class="btn warn" data-a="diplo" data-p="${x.id}" data-q="vassal" title="${canV?`Demand ${nm(x)} surrender as your vassal — they will pay 10% tribute each turn`:'Enemy must be below 25% of your score to vassalize'}. Enemy becomes your vassal." ${(!canV||G.actions<1)?'disabled':''}>VASSALIZE</button>`;
      }
      else if(r==='alliance') btns=`<button class="btn warn" data-a="diplo" data-p="${x.id}" data-q="break" title="End the alliance with ${nm(x)}. Relations return to peace." ${G.actions<1?'disabled':''}>BREAK PACT</button>`;
      else if(r==='vassal') btns=`<span class="g">pays you tribute ♟</span>`;
      const diploLtip=`${nm(x)} [${r.toUpperCase()}]: ${RDESC[r]||r}`;
      h+=`<div class="row"><span class="grow" title="${diploLtip}">${fb(x).flag} <b>${nm(x)}</b> <span class="v">${REL_ICON[r]} ${r.toUpperCase()}</span> <span class="dim">${x.personality||''}</span></span>${btns}</div>`;
    }
    h+=`<div class="muted" style="margin-top:8px">Domination victory: be ranked <b>#1</b> with 4 of 6 nations in your bloc (you + allies + vassals), including <b>at least 1 conquered vassal</b>. Pure alliances alone are not enough.</div>`;
  }
  $('tabContent').innerHTML=h;
}

function renderLog(){
  $('log').innerHTML=G.log.map(e=>
    `<div class="le ${e.type}"><span class="tt">[T${e.t}]</span>${e.text}</div>`).join('');
}

function renderRank(){
  const alive=G.nations.filter(n=>n.alive).sort((a,b)=>score(b)-score(a));
  const dead=G.nations.filter(n=>!n.alive);
  let h='';
  alive.forEach((n,i)=>{
    const r=n.isPlayer?'':REL_ICON[rel(P(),n)]||'';
    h+=`<div class="rrow${n.isPlayer?' me':''}"><span class="pos">#${i+1}</span>`+
       `<span class="nn">${fb(n).flag} ${nm(n)}${n.isPlayer?' (YOU)':''} ${n.isPlayer?'':`<span class="v">${r}</span>`}</span>`+
       `<span class="sc">$${fmt(score(n))}</span></div>`;
  });
  dead.forEach(n=>{ h+=`<div class="rrow dead"><span class="pos">☠</span><span class="nn">${nm(n)}</span><span class="sc">FALLEN</span></div>`; });
  h+=`<div class="sec" title="How the ranking score is calculated: gold + population×2 + raw army power×3 + land acres×40 + buildings×500 + researched techs×1000 − IMF debt. Think of it as your nation's total real-world strength — wealth, people, army, territory, infrastructure, and knowledge, all in one number.">NETWORTH ($)</div><div class="muted" style="font-size:12px">Your overall power: wealth · people · army · land · buildings · techs − debt.<br><span class="dim" style="font-size:11px">(hover for exact formula)</span></div>`;
  if(G.coalition) h+=`<div class="r" style="margin-top:8px">⚠ COALITION AGAINST YOU ACTIVE</div>`;
  h+=`<div class="sec" title="Ranks all nations by raw attack power — infantry×1 + tanks×4 + jets×6, boosted by morale, tech bonuses, and faction attack bonus. This is different from NETWORTH: a rich nation with no army can rank #1 in networth but #6 here. Watch this to know who can actually hurt you and who is safe to attack.">⚔️ MILITARY POWER</div>`;
  const byMil=G.nations.filter(n=>n.alive).slice().sort((a,b)=>rawPower(b)-rawPower(a));
  byMil.forEach((n,i)=>{
    h+=`<div class="rrow${n.isPlayer?' me':''}"><span class="pos">#${i+1}</span>`+
       `<span class="nn">${fb(n).flag} ${nm(n)}${n.isPlayer?' (YOU)':''}</span>`+
       `<span class="sc">${fmt(atkPower(n,n.army))}</span></div>`;
  });
  h+=`<div class="muted" style="font-size:11px;margin-top:2px">attack power score (infantry + tanks×4 + jets×6 × morale × tech)</div>`;
  $('rank').innerHTML=h;
}
