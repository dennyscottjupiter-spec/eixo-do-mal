'use strict';
/* =====================================================================
   EIXO DO MAL — render.js
   Layer 7: rendering — one render() rewrites everything from state
   ===================================================================== */
function renderMenu(){
  const hasSave=!!localStorage.getItem('eixo-save');
  $('keysOverlay').classList.add('hidden');
  $('firstMovesOverlay').classList.add('hidden');
  $('menuOverlay').innerHTML=`<div class="obox" style="max-width:380px">
<div class="sec">☰ GAME MENU</div>
<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
  <button class="btn gr" data-a="saveGame" title="Save the current game to this browser. One save slot." ${(!G||!G.started||G.over)?'disabled':''}>💾 SAVE GAME</button>
  <button class="btn cy" data-a="loadGame" title="Load your last saved game." ${!hasSave?'disabled':''}>📂 LOAD GAME${hasSave?'':' <span class="muted">(no save found)</span>'}</button>
  <button class="btn" data-a="helpFromMenu" title="Read the quick-start rules.">❔ HOW TO PLAY</button>
  <button class="btn cy" data-a="firstMovesFromMenu" title="See the 6 best opening moves for your first game — each with a one-line why.">📋 FIRST MOVES</button>
  <button class="btn" data-a="restartGame" title="Abandon this game and start fresh — you will pick a new faction.">🔄 RESTART (new game)</button>
  <button class="btn warn" data-a="resignGame" title="Give up and end the game in defeat." ${(!G||!G.started||G.over)?'disabled':''}>🏳️ RESIGN (forfeit)</button>
  <button class="btn" data-a="closeOverlay" title="Close this menu and return to the game." style="margin-top:6px">✖ CLOSE</button>
</div></div>`;
  $('menuOverlay').classList.remove('hidden');
}
function renderHelp(){
  $('keysOverlay').classList.add('hidden');
  $('firstMovesOverlay').classList.add('hidden');
  $('helpOverlay').innerHTML=`<div class="obox" style="max-width:560px">
<pre>
╔══════════════════════════════════════════════════╗
║   E I X O   D O   M A L  ·  HOW TO PLAY          ║
╚══════════════════════════════════════════════════╝
</pre>
<div class="sec">GOAL</div>
<div class="muted">Dominate the world — either by bending 4 of the 6 nations
to your will, or by detonating a nuclear warhead while ranked #1.</div>
<div class="sec">EACH TURN</div>
<div class="muted">You get <b>10 actions</b>. Spend them on the tabs below.
Most actions cost 1; attacking costs 2.
Press <b>Enter</b> (or the END TURN button) when done.</div>
<div class="sec">TABS AT A GLANCE</div>
<div class="muted">
🏗 <b>BUILD</b>   — construct buildings to earn more resources each turn
🎖 <b>TRAIN</b>   — recruit soldiers, tanks, jets, spies, missiles
🏷 <b>MARKET</b>  — buy/sell oil and food for gold
⚔️ <b>ATTACK</b>  — ground assault (seizes land + loot), SCUD, or nuke
🕶️ <b>SPY</b>     — steal gold, blow up buildings, gather enemy intel
🔬 <b>TECH</b>    — research upgrades; the Nuclear path leads to victory
🤝 <b>DIPLO</b>   — make alliances (count toward domination) or declare war
</div>
<div class="sec">QUICK TIPS</div>
<div class="muted">
• 💰 COLLECT grabs half a turn's income instantly — use it when starved.
• 🗺️ EXPLORE claims land so you can build more structures.
• Build <b>Farms</b> early — starving armies collapse fast.
• The <b>World Ranking</b> on the right shows who to fear (or attack).
• Dominate #1 for 5 turns in a row → rivals form a <b>coalition</b> against you.
</div>
<div class="sec">WIN CONDITIONS</div>
<div class="muted">
☢️ <b>Nuclear</b>    — deploy a warhead while ranked #1
♟  <b>Domination</b> — ranked #1 + control 4 of 6 (allies + ≥1 conquered vassal)
🎓 <b>Easy mode</b>  — reach $60,000 net worth as #1, or eliminate all rivals
</div>
<div style="margin-top:14px"><button class="btn" data-a="closeOverlay" title="Return to the game">✖ CLOSE</button></div>
</div>`;
  $('helpOverlay').classList.remove('hidden');
}

function renderKeys(){
  $('menuOverlay').classList.add('hidden');
  $('helpOverlay').classList.add('hidden');
  $('firstMovesOverlay').classList.add('hidden');
  $('keysOverlay').innerHTML=`<div class="obox" style="max-width:400px">
<div class="sec">⌨ KEYBOARD SHORTCUTS</div>
<div style="margin-top:10px">
${[
  ['⏎ Enter',   'End your turn'],
  ['␣ Space',   'Collect half your income (1 action)'],
  ['X',         'Explore new land (1 action, normal mode)'],
  ['1 – 7',     'Switch tabs: BUILD / TRAIN / MARKET / ATTACK / SPY / TECH / DIPLO'],
  ['?',         'Open How to Play'],
  ['Esc',       'Close this panel / overlays'],
].map(([k,d])=>`<div class="kv" style="padding:5px 0;border-bottom:1px dashed #2c240e">
  <span class="c" style="min-width:130px;display:inline-block"><b>${k}</b></span>
  <span class="muted">${d}</span>
</div>`).join('')}
</div>
<div style="margin-top:12px"><button class="btn" data-a="closeOverlay" title="Close shortcuts panel">✖ CLOSE</button></div>
</div>`;
  $('keysOverlay').classList.remove('hidden');
}

function renderFirstMoves(){
  $('menuOverlay').classList.add('hidden');
  $('helpOverlay').classList.add('hidden');
  $('keysOverlay').classList.add('hidden');
  const phase=(label,sub,items)=>`<div class="sec">${label}</div><div class="dim" style="margin:-4px 0 6px;font-size:12px">${sub}</div>`+
    items.map(([act,why])=>`<div class="row" style="align-items:flex-start;padding:5px 0">
  <span class="grow"><b class="c">${act}</b><br><span class="muted">${why}</span></span>
</div>`).join('');
  $('firstMovesOverlay').innerHTML=`<div class="obox" style="max-width:560px">
<div class="sec">📋 OPENING GUIDE — FIRST 10 TURNS</div>
<div class="muted" style="margin-bottom:8px">Follow this phased plan your first game. Every game after, adapt it to your faction's bonus.</div>
${phase('PHASE 1 · TURNS 1–3 — Survive &amp; claim land','Don\'t starve. Get land. Grab a little cash.',[
  ['🌾 BUILD a Farm (turn 1)','Food feeds your army and population every single turn. No farm = famine = pop drop + morale collapse. Always first.'],
  ['🗺️ EXPLORE × 1–2','Each building needs 1 free acre. You start with 25 land and 12 buildings — only 13 free. Explore early or you hit a wall.'],
  ['🛢️ BUILD an Oil Field','Tanks and jets need oil or fight at 50% power. One field early means your army is always battle-ready.'],
  ['💰 COLLECT (Space) when low','Half a turn\'s income instantly, costs 1 action. Use it any turn you\'re tight on gold — it\'s never wasted.'],
])}
${phase('PHASE 2 · TURNS 4–7 — Build an economy &amp; a deterrent','Rivals start getting aggressive around turn 6.',[
  ['💰 BUILD a Bank','Your biggest income booster. Gold pays for everything — one Bank outperforms almost any other build mid-game.'],
  ['🪖 TRAIN 10–20 Infantry','A cheap standing army stops rivals from raiding you for free. You don\'t need to be the strongest — just not the easiest target.'],
  ['⚙️ BUILD a Factory','Multiplies ALL resource income (up to 2×). Factory synergizes with Banks, Farms, Oil Fields — build it before stacking more of those.'],
  ['🔬 BUILD a Research Lab','Opens the entire tech tree. Without it you can\'t research anything — and the nuclear path starts here. Priority before turn 8.'],
])}
${phase('PHASE 3 · TURNS 8–10 — Pick your win path','Two main roads to victory. Pick one and go hard.',[
  ['☢️ PATH A — The Bomb','Research Nuclear Physics → build Nuclear Facility → advance warhead → assemble → research ICBM → deploy while ranked #1. Slow but decisive.'],
  ['🤝 PATH B — Domination','You need: ranked #1 AND at least 1 conquered vassal AND 4 of 6 nations in your bloc (allies + vassals). Wars come first — then diplomacy.'],
  ['📊 Watch the WORLD RANKING','It tells you who to fear, who to attack, and when you\'re close to winning. Check it every turn.'],
])}
<div class="sec" style="color:var(--red)">⚠ WATCH OUT FOR</div>
${[
  ['🌾 Famine','Food < 0 → −5% population and −20 morale every turn. Check your food delta in the HUD. Build Farms first if it\'s red.'],
  ['⛽ Oil shortage','Oil < 0 → tanks and jets fight at 50% attack power. Watch the OIL! badge in the HUD.'],
  ['⚠ Coalition (turn 5+ as #1)','Stay ranked #1 for 5 straight turns → all rivals unite against you. Either win fast, or delay the climb.'],
  ['🏦 IMF debt (MARKET tab)','Loans are tempting early-game. But interest compounds every turn (rate changes!) and debt lowers your net-worth. Repay before it snowballs.'],
].map(([w,d])=>`<div class="row" style="align-items:flex-start;padding:4px 0">
  <span class="grow"><b class="r">${w}</b><br><span class="muted">${d}</span></span>
</div>`).join('')}
<div style="margin-top:14px"><button class="btn" data-a="closeOverlay" title="Return to faction select">✖ CLOSE</button></div>
</div>`;
  $('firstMovesOverlay').classList.remove('hidden');
}

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

const $=id=>document.getElementById(id);
const REL_ICON={war:'⚔',alliance:'✦',vassal:'♟',master:'⛓',peace:'·'};

function render(){
  if(!G || !G.started){ renderFactionOverlay(true); if(window.twemoji) twemoji.parse(document.body,{base:'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',folder:'svg',ext:'.svg'}); return; }
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
  if(!G.easy){
    h+=`<span class="hud-sep">|</span>`;
    h+=`<span class="hchip" title="Free land — acres available to build on. Each building costs 1 acre. Use EXPLORE to claim more land.">🗺 <span class="hval">${fmt(freeLand(n))}</span><span class="hdelta dim"> free ac.</span></span>`;
  }
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
  h+=`<div class="sec">ARMED FORCES</div>`;
  h+=`<div class="kv"><span>${CONFIG.units.infantry.i} Infantry</span><span>${fmt(n.army.infantry)}</span></div>`;
  h+=`<div class="kv"><span>${CONFIG.units.tank.i} Tanks</span><span>${fmt(n.army.tank)}</span></div>`;
  h+=`<div class="kv"><span>${CONFIG.units.jet.i} Jet Fighters</span><span>${fmt(n.army.jet)}</span></div>`;
  h+=`<div class="kv"><span>${CONFIG.units.turret.i} Turrets <span class="dim">(def)</span></span><span>${fmt(n.army.turret)}</span></div>`;
  h+=`<div class="kv"><span>${CONFIG.units.spy.i} Spies</span><span>${fmt(n.army.spy)}</span></div>`;
  h+=`<div class="kv"><span>${CONFIG.units.scud.i} SCUD Missiles</span><span>${fmt(n.army.scud)}</span></div>`;
  h+=`<div class="kv"><span>☢️ Warheads</span><span>${fmt(n.army.warhead)}</span></div>`;
  h+=`<div class="kv dim"><span>Capacity</span><span>${fmt(troopCnt(n))}/${fmt(troopCap(n))}</span></div>`;
  h+=`<div class="kv dim"><span>Atk / Def</span><span>${fmt(atkPower(n,n.army))} / ${fmt(defPower(n))}</span></div>`;
  h+=`<div class="sec">STRUCTURES</div>`;
  for(const k in n.b) h+=`<div class="kv"><span>${CONFIG.buildings[k].i} ${CONFIG.buildings[k].n}</span><span>${n.b[k]}</span></div>`;
  h+=`<div class="kv dim" style="margin-top:4px"><span>Industry ×</span><span>${industryMult(n).toFixed(2)}</span></div>`;
  if(hasTech(n,'nuclearPhysics')){
    h+=`<div class="sec">☢ NUCLEAR</div>`;
    h+=`<div class="dim">[${asciiBar(n.nukeProg,CONFIG.warhead.researchNeeded,12)}] ${n.nukeProg}/${CONFIG.warhead.researchNeeded}</div>`;
  }
  $('detail').innerHTML=h;
}

function renderCmd(){
  $('cmdbar').innerHTML=
    `<span>ACTIONS <span class="bar">[${asciiBar(G.actions,CONFIG.actionsPerTurn,10)}]</span> <b>${G.actions}/${CONFIG.actionsPerTurn}</b></span>`+
    `<button class="btn gr" data-a="collect" title="Collect half your turn's income right now — gold, oil, food. Costs 1 action. Shortcut: Space." ${G.actions<1?'disabled':''}>💰 COLLECT ▸1</button>`+
    (G.easy?'':`<button class="btn cy" data-a="explore" title="Send scouts to claim new land. You need free acres to build. Costs 1 action. Shortcut: X." ${G.actions<1?'disabled':''}>🗺️ EXPLORE ▸1</button>`)+
    `<button class="btn warn" data-a="endTurn" title="End your turn. All rivals act, then you get 10 fresh actions. Shortcut: Enter.">⏎ END TURN</button>`;
}

function renderTabs(){
  const tabs = G.easy
    ? [['build','🏗 BUILD','Construct buildings that produce resources or troops'],
       ['train','🎖 TRAIN','Recruit soldiers, tanks, jets, spies, turrets or missiles'],
       ['attack','⚔️ ATTACK','Launch a ground assault, fire a missile, or drop a nuke']]
    : [['build','🏗 BUILD','Construct buildings that produce resources or troops'],
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
  if(G.easy && !['build','train','attack'].includes(UI.tab)) UI.tab='build';
  if(UI.tab==='build'){
    const fl=freeLand(me);
    h+=`<div class="sec">CONSTRUCT — 1 action each${G.easy?'':` · <span class="${fl<1?'r':'dim'}">free land: ${fmt(fl)} acres</span>`}</div>`;
    for(const k in CONFIG.buildings){
      const b=CONFIG.buildings[k], lock=b.req&&!hasTech(me,b.req);
      const tip=`Build a ${b.n}: ${b.d}. Costs ${fmt(b.g)} gold and ${b.ind} industry.${lock?' Requires Nuclear Physics tech first.':''}`;
      h+=`<div class="row"><span class="grow">${b.i} <b>${b.n}</b> <span class="dim">(${me.b[k]})</span><br><span class="muted">${b.d}${lock?' — <span class="r">requires Nuclear Physics</span>':''}</span></span>`+
         `<span class="dim">${fmt(b.g)}💰 ${b.ind}⚙️</span>`+
         `<button class="btn" data-a="build" data-p="${k}" title="${tip}" ${(!buildCostOk(me,k)||G.actions<1)?'disabled':''}>BUILD</button></div>`;
    }
  }
  else if(UI.tab==='train'){
    h+=`<div class="sec">TRAIN — 1 action per batch · capacity ${fmt(troopCnt(me))}/${fmt(troopCap(me))}</div>`;
    for(const k in CONFIG.units){
      const u=CONFIG.units[k];
      const desc=u.atk?`Atk ${u.atk} / Def ${u.def} — good for ground combat`:k==='spy'?'Used for covert ops: steal gold, sabotage, gather intel':k==='turret'?`Static defense tower — Def ${u.def}, cannot attack`:'Missile — destroys enemy buildings from a distance';
      const tip=`Train ${u.batch}× ${u.n}. ${desc}. Costs ${fmt(unitGoldCost(me,k))} gold.`;
      h+=`<div class="row"><span class="grow">${u.i} <b>${u.n}</b> <span class="dim">(own ${fmt(me.army[k])})</span><br><span class="muted">${u.atk?`atk ${u.atk} / def ${u.def}`:k==='spy'?'covert operations':k==='turret'?`static defense / def ${u.def}`:'destroys enemy buildings'}</span></span>`+
         `<span class="dim">${fmt(unitGoldCost(me,k))}💰 ${u.f*u.batch}🌾</span>`+
         `<button class="btn" data-a="train" data-p="${k}" title="${tip}" ${(!trainCostOk(me,k)||G.actions<1)?'disabled':''}>TRAIN ×${u.batch}</button></div>`;
    }
  }
  else if(UI.tab==='market'){
    const M=CONFIG.market;
    h+=`<div class="sec">BLACK MARKET — 1 action per lot of ${M.lot}</div>`;
    h+=`<div class="muted" style="margin-bottom:6px">On-hand: 🛢️ ${fmt(me.res.oil)} oil · 🌾 ${fmt(me.res.food)} food · 💰 ${fmt(me.res.gold)} gold</div>`;
    for(const res of ['oil','food']){
      const ic=res==='oil'?'🛢️':'🌾';
      h+=`<div class="row"><span class="grow">${ic} <b>${res.toUpperCase()}</b> <span class="dim">buy ${M[res].buy}💰 · sell ${M[res].sell}💰 each</span></span>`+
         `<button class="btn cy" data-a="market" data-p="${res}" data-q="buy" title="Spend ${M.lot*M[res].buy} gold to buy ${M.lot} ${res}. Costs 1 action." ${(me.res.gold<M.lot*M[res].buy||G.actions<1)?'disabled':''}>BUY ${M.lot}</button>`+
         `<button class="btn" data-a="market" data-p="${res}" data-q="sell" title="Sell ${M.lot} ${res} for ${M.lot*M[res].sell} gold. Costs 1 action." ${(me.res[res]<M.lot||G.actions<1)?'disabled':''}>SELL ${M.lot}</button></div>`;
    }
    // IMF loans
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
        h+=`<div class="row"><span class="grow">${fb(x).flag} <b>${nm(x)}</b> <span class="dim">#${rankOf(x)}</span> ${REL_ICON[r]||''}<br>${intelStr(x)}</span>`+
           `<button class="btn warn" data-a="target" data-p="${x.id}" title="${block?`Cannot attack — they are your ${r}`:`Select ${nm(x)} as your attack target`}" ${block?'disabled':''}>${block?(r==='vassal'?'VASSAL':'ALLY'):'ENGAGE ▸'}</button></div>`;
      }
      if(!targetsOf().length) h+=`<div class="muted">No nations left to attack. You are alone among the ruins.</div>`;
    } else {
      h+=`<div class="sec">OFFENSIVE vs ${nm(t).toUpperCase()}</div>`;
      h+=`<div class="row"><span class="grow">${fb(t).flag} <b>${nm(t)}</b> — ${intelStr(t)}</span><button class="btn" data-a="back" title="Go back to the target list">◂ BACK</button></div>`;
      h+=`<div class="row"><span class="grow">Ground assault <span class="dim">(▸2 actions — seizes acres + loot on victory)</span></span>`+
         [25,50,75,100].map(p=>`<button class="btn warn" data-a="attack" data-p="${p}" title="Commit ${p}% of your army. Win → loot gold + seize land. Lose → heavy casualties. Costs 2 actions." ${G.actions<2?'disabled':''}>${p}%</button>`).join('')+`</div>`;
      h+=`<div class="row"><span class="grow">🚀 SCUD strike <span class="dim">(▸1 action, consumes 1 missile · own ${me.army.scud})</span></span>`+
         `<button class="btn warn" data-a="scud" title="Fire a SCUD missile — destroys 1–2 of their buildings. Costs 1 action and 1 missile." ${(me.army.scud<1||G.actions<1)?'disabled':''}>LAUNCH</button></div>`;
      const canNuke=me.army.warhead>0&&hasTech(me,'icbm');
      h+=`<div class="row"><span class="grow">☢️ NUCLEAR STRIKE <span class="dim">(▸2 actions${canNuke?'':' — needs warhead + ICBM Program'})</span></span>`+
         `<button class="btn warn" data-a="nuke" title="${canNuke?'Detonate a nuclear warhead — devastates the target. Win the game if you are ranked #1.':'You need an assembled warhead AND the ICBM Program tech to deploy this.'}" ${(!canNuke||G.actions<2)?'disabled':''}>☢️ DEPLOY</button></div>`;
    }
  }
  else if(UI.tab==='spy'){
    h+=`<div class="sec">COVERT OPS — 1 action · network: ${fmt(me.army.spy)} spies</div>`;
    for(const x of targetsOf()){
      h+=`<div class="row"><span class="grow">${fb(x).flag} <b>${nm(x)}</b><br>${intelStr(x)}</span>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="steal" title="Spies steal 5–15% of ${nm(x)}'s gold and transfer it to you." ${G.actions<1?'disabled':''}>STEAL</button>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="sabotage" title="Saboteurs blow up one of ${nm(x)}'s buildings." ${G.actions<1?'disabled':''}>SABOTAGE</button>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="killpop" title="Poison the water supply — kills 5–13% of ${nm(x)}'s population." ${G.actions<1?'disabled':''}>KILL POP</button>`+
         `<button class="btn cy" data-a="spy" data-p="${x.id}" data-q="intel" title="Get a full report on ${nm(x)}'s army, gold, and buildings. Valid for 5 turns." ${G.actions<1?'disabled':''}>INTEL</button></div>`;
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
      else st=`<span class="muted">[LOCKED — research the previous tier first]</span>`;
      h+=`<div class="row"><span class="grow"><span class="dim">T${t.tier}</span> <b>${t.n}</b><br><span class="muted">${t.d}</span></span>${st}</div>`;
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
      h+=`<div class="row"><span class="grow">${fb(x).flag} <b>${nm(x)}</b> <span class="v">${REL_ICON[r]} ${r.toUpperCase()}</span> <span class="dim">${x.personality||''}</span></span>${btns}</div>`;
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
  h+=`<div class="sec">NETWORTH ($)</div><div class="muted" style="font-size:12px">gold + pop×2 + army×3<br>+ land×40 + buildings×500 + techs×1000</div>`;
  if(G.easy) h+=`<div class="g" style="margin-top:8px;font-size:12px">🎓 EASY MODE GOAL<br>Reach $${fmt(CONFIG.easyTargetNW)} networth as #1,<br>or eliminate every rival nation.</div>`;
  if(G.coalition) h+=`<div class="r" style="margin-top:8px">⚠ COALITION AGAINST YOU ACTIVE</div>`;
  // military sub-ranking
  h+=`<div class="sec">⚔️ MILITARY POWER</div>`;
  const byMil=G.nations.filter(n=>n.alive).slice().sort((a,b)=>rawPower(b)-rawPower(a));
  byMil.forEach((n,i)=>{
    h+=`<div class="rrow${n.isPlayer?' me':''}"><span class="pos">#${i+1}</span>`+
       `<span class="nn">${fb(n).flag} ${nm(n)}${n.isPlayer?' (YOU)':''}</span>`+
       `<span class="sc">${fmt(atkPower(n,n.army))}</span></div>`;
  });
  h+=`<div class="muted" style="font-size:11px;margin-top:2px">raw attack power score</div>`;
  $('rank').innerHTML=h;
}

/* ---------- overlays ---------- */
function renderFactionOverlay(show){
  const o=$('factionOverlay');
  o.classList.toggle('hidden',!show);
  if(!show) return;
  $('overOverlay').classList.add('hidden');
  let cards='';
  for(const k in CONFIG.factions){
    const f=CONFIG.factions[k];
    cards+=`<button class="fcard" data-a="pickFaction" data-p="${k}" title="${f.tip}"><b>${f.flag} ${f.n}</b><br><span class="g">${f.bonus}</span><br><span class="muted">${f.tip}</span></button>`;
  }
  const curTheme=localStorage.getItem('eixo-theme')||'amber';
  o.innerHTML=`<div class="obox">
<div class="eixo-title"><pre>╔══════════════════════════════════════════════════╗
║<span class="et-hi">           ☢  E I X O   D O   M A L  ☢            </span>║
║<span class="et-rule">  ──────────────────────────────────────────────  </span>║
║<span class="et-sub">            2003 · WORLD DOMINATION MMO           </span>║
╚══════════════════════════════════════════════════╝</pre></div>
<div class="muted">Six rogue nations. One throne. Explore for land, build, train, spy, invade — and reach the bomb first.
Win by detonating a warhead as the world's #1 power, or by bending 4 of 6 nations to your will.</div>
<button class="toggle-wrap" data-a="toggleEasy" title="${UI.mode==='easy'?'Switch to full game: land, tech, spies, diplomacy, nukes, AI wars.':'Enable easy mode: peaceful rivals, build/train/attack only, no land or nukes. Great for learning.'}">
  <span class="toggle-track${UI.mode==='easy'?' on':''}"></span>
  <span class="toggle-label">
    <b>🎓 EASY MODE</b>
    <span class="toggle-desc">${UI.mode==='easy'
      ? '✔ ENABLED — peaceful rivals, build/train/attack only, no land or nukes'
      : 'DISABLED — full game: land, tech, spies, diplomacy, nukes, AI wars'}</span>
  </span>
</button>
<div class="theme-pick">
  <button class="tpick${curTheme==='amber'?' on':''}" data-a="setTheme" data-p="amber" title="Classic amber phosphor terminal — the original CRT look.">🟠 AMBER CRT</button>
  <button class="tpick${curTheme==='nasa'?' on':''}" data-a="setTheme" data-p="nasa" title="NASA Mission Control — deep-space starfield with drifting stars behind the start panel.">🚀 NASA</button>
</div>
<div style="margin:4px 0 4px;display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn cy" data-a="firstMoves" title="See the phased 10-turn opening guide — great for your first game.">📋 FIRST MOVES</button>
</div>
<div class="sec">SELECT YOUR NATION${UI.mode==='easy'?' <span class="g">· EASY</span>':''}</div>
<div class="fgrid">${cards}</div>
</div>`;
}

function renderOver(){
  const o=$('overOverlay');
  if(!G.over){ o.classList.add('hidden'); return; }
  $('menuOverlay').classList.add('hidden');
  $('helpOverlay').classList.add('hidden');
  $('keysOverlay').classList.add('hidden');
  $('firstMovesOverlay').classList.add('hidden');
  o.classList.remove('hidden');
  const R=G.result;
  const sorted=G.nations.slice().sort((a,b)=>score(b)-score(a));
  const rows=sorted.map((n,i)=>
    `<div class="rrow${n.isPlayer?' me':''}${n.alive?'':' dead'}"><span class="pos">#${i+1}</span>`+
    `<span class="nn">${fb(n).flag} ${nm(n)}${n.isPlayer?' (YOU)':''}</span>`+
    `<span class="sc">${n.alive?'$'+fmt(score(n)):'FALLEN'}</span></div>`).join('');

  // AoE-style stats table
  const statRows=sorted.map(n=>{
    const isMe=n.isPlayer, isDead=!n.alive;
    return `<tr class="${isMe?'me':''}${isDead?' dead':''}">
      <td>${fb(n).flag} ${nm(n)}${isMe?' (YOU)':''}</td>
      <td>${isDead?'—':'$'+fmt(score(n))}</td>
      <td>${isDead?'—':fmt(n.res.gold)}</td>
      <td>${isDead?'—':fmt(atkPower(n,n.army))}</td>
      <td>${isDead?'—':fmt(n.res.pop)}</td>
      <td>${isDead?'—':fmt(n.land)}</td>
      <td>${isDead?'—':totalBuildings(n)}</td>
      <td>${isDead?'—':n.techs.length}</td>
    </tr>`;
  }).join('');

  o.innerHTML=`<div class="obox">
<pre>${R.win?
`╔═══════════════════════════════════╗
║   ★ ★ ★   V I C T O R Y   ★ ★ ★   ║
╚═══════════════════════════════════╝`:
`╔═══════════════════════════════════╗
║   ☠ ☠ ☠   D E F E A T   ☠ ☠ ☠     ║
╚═══════════════════════════════════╝`}</pre>
<div class="${R.win?'g':'r'}" style="margin-bottom:10px">${R.msg}</div>
<div class="muted">Survived ${G.turn} turns.</div>
<div class="sec">FINAL RANKING</div>${rows}
<div class="sec">FINAL STATISTICS</div>
<table class="statab">
  <thead><tr><th>NATION</th><th>NETWORTH</th><th>💰 GOLD</th><th>⚔ MILITARY</th><th>👥 POP</th><th>🗺 LAND</th><th>🏗 BLDGS</th><th>🔬 TECH</th></tr></thead>
  <tbody>${statRows}</tbody>
</table>
<div style="margin-top:14px"><button class="btn" data-a="newGame" title="Go back to faction select and start a brand new game.">▸ NEW GAME</button></div>
</div>`;
}

/* ---------- boot flavor: staggered teletype lines at game start ---------- */
function bootSequence(){
  const myG=G;
  CONFIG.bootLines.forEach((line,i)=>{
    setTimeout(()=>{ if(G===myG&&!G.over){ log('sys',line); renderLog(); } }, 250+i*420);
  });
}

/* =====================================================================
   Layer 8: wiring — one delegated click listener + keyboard shortcuts
   ===================================================================== */
document.body.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');
  if(!el||el.disabled) return;
  const fn=H[el.dataset.a];
  if(fn) fn(el.dataset.p,el.dataset.q);
});

/* Konami code: ↑↑↓↓←→←→BA → +9999 gold */
const KONAMI=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kbuf=[];
document.addEventListener('keydown',e=>{
  // Konami buffer (always active)
  kbuf.push(e.key.length===1?e.key.toLowerCase():e.key);
  if(kbuf.length>KONAMI.length) kbuf.shift();
  if(G&&G.started&&!G.over&&kbuf.join(',')===KONAMI.join(',')){
    P().res.gold+=9999;
    log('nuke','💾 CHEAT ACCEPTED: a mysterious benefactor wired you 9,999 gold.');
    render();
  }

  // Esc = close any open overlay (always, even on game-over or faction screen)
  if(e.key==='Escape'){
    ['menuOverlay','helpOverlay','keysOverlay','firstMovesOverlay'].forEach(id=>{ const el=$(id); if(el) el.classList.add('hidden'); });
    return;
  }

  // Enter = end turn
  if(e.key==='Enter'&&G&&G.started&&!G.over&&!e.repeat){
    const tag=(e.target&&e.target.tagName)||'';
    if(tag!=='BUTTON'&&tag!=='INPUT') endTurn();
  }

  // Gameplay shortcuts — only when a game is active and no overlay button is focused
  if(!G||!G.started||G.over||e.repeat) return;
  const tag=(e.target&&e.target.tagName)||'';
  if(tag==='BUTTON'||tag==='INPUT') return;

  if(e.key===' '){
    e.preventDefault();
    H.collect();
  } else if(e.key.toLowerCase()==='x'&&!G.easy){
    H.explore();
  } else if(e.key==='?'){
    renderHelp();
  } else if(e.key>='1'&&e.key<='7'){
    const tabList=G.easy
      ?['build','train','attack']
      :['build','train','market','attack','spy','tech','diplo'];
    const idx=parseInt(e.key,10)-1;
    if(idx<tabList.length){ UI.tab=tabList[idx]; render(); }
  }
});

function applyTheme(t){
  document.body.className=document.body.className.replace(/\btheme-\S+/g,'').trim();
  if(t&&t!=='amber') document.body.classList.add('theme-'+t);
  localStorage.setItem('eixo-theme',t||'amber');
}

applyTheme(localStorage.getItem('eixo-theme')||'amber');
render();   // first paint → faction select
