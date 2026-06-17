'use strict';
/* =====================================================================
   EIXO DO MAL — screens.js
   Layer 8: overlays, start screen, wiring, keyboard, boot
   Loaded after render.js — shares global scope.
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
  <button class="btn" data-a="helpFromMenu" title="Read the full how-to-play guide — combat, economy, espionage, diplomacy.">❔ HOW TO PLAY</button>
  <button class="btn cy" data-a="firstMovesFromMenu" title="See the phased 10-turn opening guide.">📋 FIRST MOVES</button>
  <button class="btn cy" data-a="openLobby" title="Host or join an online multiplayer game via Firebase. See FIREBASE-SETUP.md for one-time setup.">🌍 ONLINE MULTIPLAYER</button>
  <button class="btn cy" data-a="statsFromMenu" title="See live standings and statistics for all nations — same view as end-of-game." ${(!G||!G.started||G.over)?'disabled':''}>📊 STATISTICS</button>
  <button class="btn cy" data-a="setBroadcast" data-p="${UI.broadcast!==false?'off':'on'}" title="Toggle the World News broadcast reel that plays after each turn.">${UI.broadcast!==false?'📺 BROADCAST: ON (click to turn off)':'⚡ BROADCAST: OFF (click to turn on)'}</button>
  <button class="btn" data-a="restartGame" title="Abandon this game and start fresh — you will pick a new faction.">🔄 RESTART (new game)</button>
  <button class="btn warn" data-a="resignGame" title="Give up and end the game in defeat." ${(!G||!G.started||G.over)?'disabled':''}>🏳️ RESIGN (forfeit)</button>
  <button class="btn" data-a="closeOverlay" title="Close this menu and return to the game." style="margin-top:6px">✖ CLOSE</button>
</div></div>`;
  $('menuOverlay').classList.remove('hidden');
}

function renderHelp(){
  $('keysOverlay').classList.add('hidden');
  $('firstMovesOverlay').classList.add('hidden');
  $('helpOverlay').innerHTML=`<div class="obox" style="max-width:600px">
<div class="sec">HOW TO PLAY — EIXO DO MAL</div>
<div class="sec">GOAL</div>
<div class="muted">Dominate the world — either by bending 4 of the 6 nations to your will, or by detonating a nuclear warhead while ranked #1. Six rogue states, one throne.</div>
<div class="sec">EACH TURN</div>
<div class="muted">You get <b>10 actions</b>. Spend them on the 7 tabs. Most cost 1 action; ground assaults cost 2. Press <b>Enter</b> (or END TURN) when done. Then all rivals act simultaneously.</div>
<div class="sec">TABS AT A GLANCE</div>
<div class="muted">
🏗 <b>BUILD</b>   — construct buildings that earn resources every turn<br>
🎖 <b>TRAIN</b>   — recruit infantry, tanks, jets, spies, turrets, missiles<br>
🏷 <b>MARKET</b>  — buy/sell oil and food for gold; borrow from the IMF<br>
⚔️ <b>ATTACK</b>  — ground assault, SCUD strike, or nuclear detonation<br>
🕶️ <b>SPY</b>     — steal gold, destroy buildings, kill population, or gather intel<br>
🔬 <b>TECH</b>    — research upgrades; tier 3-4 leads to the nuclear path<br>
🤝 <b>DIPLO</b>   — alliances count toward Domination; vassals pay tribute
</div>
<div class="sec">COMBAT BASICS</div>
<div class="muted">
Three attack doctrines — all cost 2 actions:<br>
• <b>⚔️ GROUND INVASION</b> — infantry + tanks seize land (12%) and loot gold (10%). The standard assault; countered by turrets, bunkers, and high defense nations.<br>
• <b>✈️ AIR STRIKE</b> — jets bomb 2–4 enemy buildings. <i>No land seized</i>, but destroys infrastructure. Jets risk interception by the defender's jets — the more enemy jets, the higher your losses.<br>
• <b>⚓ MARINE ASSAULT</b> — amphibious troops bypass half of the defender's turrets and bunker bonuses. Great for cracking fortress nations. Seizes land (10%) and loots gold (8%).<br>
• <b>Oil shortage</b> cuts tank and jet attack power by 50% — always keep oil positive.<br>
• <b>Morale</b> multiplies attack (max 150%). It rises slowly in peacetime and drops from defeats, famine, or nuclear strikes.<br>
• You can run at most <b>${CONFIG.maxOpsPerTarget} hostile ops</b> on the same nation per turn (attacks + spy ops combined) — after that they are on HIGH ALERT until next turn.
</div>
<div class="sec">ECONOMY &amp; GROWTH</div>
<div class="muted">
• <b>Gold</b> = pop × 0.5/turn + banks × 60/turn × factory multiplier.<br>
• <b>Factory industry</b> multiplies ALL building output up to 2× — build factories early and stack them.<br>
• <b>COLLECT</b> (Space) grabs part of your turn's income instantly (first use: 100%, second: 75%, third: 50%, fourth: 25%). Diminishing returns reset each turn — use it when tight on gold but don't spam it.<br>
• <b>Famine</b> (food &lt; 0) kills 5% of your population and collapses morale every turn — build Farms first.<br>
• <b>IMF loans</b> (MARKET tab) give instant gold but accrue compound interest every turn. Rates drift 4-16%. Debt lowers your net-worth score — repay before it snowballs.<br>
• EXPLORE claims new land (you need free acres to build). Yield falls as your nation grows.
</div>
<div class="sec">ESPIONAGE &amp; INTEL</div>
<div class="muted">
• Spy ops: <b>STEAL</b> (5-15% of their gold), <b>SABOTAGE</b> (blow up a building), <b>KILL POP</b> (5-13% population), <b>INTEL</b> (reveals army/gold/buildings for 5 turns).<br>
• Run <b>INTEL first</b> — ??? means you have no data. Without intel you're flying blind on attack and spy missions.<br>
• Your success rate = your spies ÷ (their spies × 1.5). More spies = more reliable ops.<br>
• Their <b>Encryption</b> tech adds 15% to their spy defense — train extra spies to compensate.<br>
• Max ${CONFIG.maxOpsPerTarget} ops per target per turn — after that they go on HIGH ALERT.
</div>
<div class="sec">DIPLOMACY &amp; THE BLOC</div>
<div class="muted">
• <b>Alliances</b> cost ${CONFIG.diploCost.ally} gold (envoy fee) + 1 action, but can't attack allies. Peace offers cost ${CONFIG.diploCost.peace} gold + 1 action. Nations are wary early — far more likely to ally after turn 8.<br>
• <b>Betrayal warning:</b> once the coalition activates, allies may tear up their pact under political pressure — watch the Event Log.<br>
• <b>Vassals</b> pay you 10% gold tribute each turn. To vassalize: beat them in a war until their score drops below 25% of yours, then click VASSALIZE.<br>
• <b>Coalition</b>: stay ranked #1 for 5 consecutive turns and rivals unite against you. Win fast or avoid holding #1 for too long.<br>
• AI–AI wars, pacts, and peace treaties happen on their own — watch the EVENT LOG for intel on their moves.
</div>
<div class="sec">WIN CONDITIONS</div>
<div class="muted">
☢ <b>Nuclear</b>    — deploy a warhead while ranked #1 (needs Nuclear Physics → Nuclear Facility → research 50 steps → assemble → ICBM → deploy)<br>
♟  <b>Domination</b> — ranked #1 + control 4 of 6 (allies + vassals), with at least 1 conquered vassal
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
  ['X',         'Explore new land (1 action)'],
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
  ['💰 COLLECT (Space) when low','Grabs your income now (100% first use, 75% second, 50% third, 25% fourth — resets each turn). Use it when tight on gold, but don\'t spam it: diminishing returns kick in fast.'],
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

/* ---------- Start screen — retro console boot menu ---------- */
function renderFactionOverlay(show){
  const o=$('factionOverlay');
  o.classList.toggle('hidden',!show);
  if(!show) return;
  $('overOverlay').classList.add('hidden');

  const curTheme=localStorage.getItem('eixo-theme')||'amber';
  const curDiff=UI.difficulty||'medium';
  const DC=CONFIG.difficulty[curDiff];

  const diffBtns=Object.entries(CONFIG.difficulty).map(([k,d])=>
    `<button class="btn blink diff-btn${curDiff===k?' on':''}" data-a="setDifficulty" data-p="${k}"
      title="${d.blurb}">${d.label}</button>`).join('');

  const themeBtns=[
    ['amber','🟠 AMBER','Classic amber phosphor terminal — the original CRT look.'],
    ['nasa','🚀 SPACE','NASA Mission Control — deep-space starfield with drifting stars.'],
    ['vscode','💚 NEON','VSCode-inspired dark theme — cool neon syntax-color palette.'],
  ].map(([k,l,tip])=>
    `<button class="tpick blink${curTheme===k?' on':''}" data-a="setTheme" data-p="${k}" title="${tip}">${l}</button>`).join('');
  const bcOn=UI.broadcast!==false;
  const broadcastBtns=
    `<button class="tpick${bcOn?' on':''}" data-a="setBroadcast" data-p="on" title="Show a full-screen highlight reel of rival actions at the end of each turn — attacks, nukes, betrayals, alliances.">📺 BROADCAST ON</button>`+
    `<button class="tpick${!bcOn?' on':''}" data-a="setBroadcast" data-p="off" title="Skip the broadcast; rival events go straight to the Event Log.">⚡ INSTANT</button>`;

  let cards='';
  for(const k in CONFIG.factions){
    const f=CONFIG.factions[k];
    cards+=`<button class="fcard blink" data-a="pickFaction" data-p="${k}" title="${f.tip}"><b>${f.flag} ${f.n}</b><br><span class="g">${f.bonus}</span><br><span class="muted">${f.tip}</span></button>`;
  }

  o.innerHTML=`<div class="obox">
<div class="eixo-title"><pre class="et-art">    .  *  .  .  *  .  .  *  .  .  *  .  .
               |          |
    . . . . .  -+-  . . . -+-  . . . . .
               |          |
    .  *  .  .  *  .  .  *  .  .  *  .  .</pre><div class="et-wordmark"><span class="et-hi">~ ~  E I X O   D O   M A L  ~ ~</span></div><div class="et-sub-line"><span class="et-rule">──────────────────────────────────</span></div><div class="et-tagline"><span class="et-sub">2003  ·  WORLD DOMINATION MMO</span></div></div>

<div class="boot-section">
  <div class="boot-label">// DIFFICULTY</div>
  <div class="boot-row">${diffBtns}</div>
  <div class="boot-blurb">${DC.blurb}</div>
</div>

<div class="boot-section">
  <div class="boot-label">// BACKGROUND</div>
  <div class="boot-row">${themeBtns}</div>
</div>

<div class="boot-section">
  <div class="boot-label">// WORLD NEWS</div>
  <div class="boot-row">${broadcastBtns}</div>
  <div class="boot-blurb">${bcOn?'Full-screen highlight reel plays after each turn — one dramatic event at a time.':'Instant mode — rival events appear directly in the Event Log.'}</div>
</div>

<div class="insert-prompt blink" title="Select a nation below to begin">▶ &nbsp; I N S E R T &nbsp; N A T I O N &nbsp; ◀</div>

<div style="margin:4px 0 4px;display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn cy" data-a="firstMoves" title="See the phased 10-turn opening guide — great for your first game.">📋 FIRST MOVES</button>
  <button class="btn cy" data-a="openLobby" title="Host or join an online multiplayer game via Firebase. See FIREBASE-SETUP.md for one-time setup.">🌍 ONLINE</button>
</div>

<div class="sec">SELECT YOUR NATION</div>
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
  $('statsOverlay').classList.add('hidden');
  $('broadcastOverlay').classList.add('hidden');
  $('lobbyOverlay').classList.add('hidden');
  o.classList.remove('hidden');
  const R=G.result;
  const sorted=G.nations.slice().sort((a,b)=>score(b)-score(a));
  const rows=sorted.map((n,i)=>
    `<div class="rrow${n.isPlayer?' me':''}${n.alive?'':' dead'}"><span class="pos">#${i+1}</span>`+
    `<span class="nn">${fb(n).flag} ${nm(n)}${n.isPlayer?' (YOU)':''}</span>`+
    `<span class="sc">${n.alive?'$'+fmt(score(n)):'FALLEN'}</span></div>`).join('');

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

function renderStats(){
  ['menuOverlay','helpOverlay','keysOverlay','firstMovesOverlay'].forEach(id=>$(id).classList.add('hidden'));
  const o=$('statsOverlay');
  const sorted=G.nations.slice().sort((a,b)=>score(b)-score(a));
  const rows=sorted.map((n,i)=>
    `<div class="rrow${n.isPlayer?' me':''}${n.alive?'':' dead'}"><span class="pos">#${i+1}</span>`+
    `<span class="nn">${fb(n).flag} ${nm(n)}${n.isPlayer?' (YOU)':''}</span>`+
    `<span class="sc">${n.alive?'$'+fmt(score(n)):'FALLEN'}</span></div>`).join('');
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
<div class="sec">📊 LIVE STANDINGS · TURN ${G.turn}</div>
<div class="muted" style="margin-bottom:8px">Net worth = gold + pop×2 + army×3 + land×40 + buildings×500 + techs×1,000 − debt</div>
${rows}
<div class="sec">COMPARATIVE STATISTICS</div>
<table class="statab">
  <thead><tr><th>NATION</th><th>NETWORTH</th><th>💰 GOLD</th><th>⚔ MILITARY</th><th>👥 POP</th><th>🗺 LAND</th><th>🏗 BLDGS</th><th>🔬 TECH</th></tr></thead>
  <tbody>${statRows}</tbody>
</table>
<div style="margin-top:14px"><button class="btn" data-a="closeOverlay" title="Close statistics and return to the game">✖ CLOSE</button></div>
</div>`;
  o.classList.remove('hidden');
}

/* ---------- boot flavor: staggered teletype lines at game start ---------- */
function bootSequence(){
  const myG=G;
  CONFIG.bootLines.forEach((line,i)=>{
    setTimeout(()=>{ if(G===myG&&!G.over){ log('sys',line); renderLog(); } }, 250+i*420);
  });
}

/* =====================================================================
   Wiring — one delegated click listener + keyboard shortcuts
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
  kbuf.push(e.key.length===1?e.key.toLowerCase():e.key);
  if(kbuf.length>KONAMI.length) kbuf.shift();
  if(G&&G.started&&!G.over&&kbuf.join(',')===KONAMI.join(',')){
    P().res.gold+=9999;
    log('nuke','💾 CHEAT ACCEPTED: a mysterious benefactor wired you 9,999 gold.');
    render();
  }

  if(e.key==='Escape'){
    ['menuOverlay','helpOverlay','keysOverlay','firstMovesOverlay','statsOverlay','broadcastOverlay','lobbyOverlay'].forEach(id=>{ const el=$(id); if(el) el.classList.add('hidden'); });
    return;
  }

  if(e.key==='Enter'&&G&&G.started&&!G.over&&!e.repeat){
    const tag=(e.target&&e.target.tagName)||'';
    const reelOpen=!$('broadcastOverlay').classList.contains('hidden');
    if(tag!=='BUTTON'&&tag!=='INPUT'&&!reelOpen) endTurn();
  }

  if(!G||!G.started||G.over||e.repeat) return;
  const tag=(e.target&&e.target.tagName)||'';
  if(tag==='BUTTON'||tag==='INPUT') return;

  if(e.key===' '){
    e.preventDefault();
    H.collect();
  } else if(e.key.toLowerCase()==='x'){
    H.explore();
  } else if(e.key==='?'){
    renderHelp();
  } else if(e.key>='1'&&e.key<='7'){
    const tabList=['build','train','market','attack','spy','tech','diplo'];
    const idx=parseInt(e.key,10)-1;
    if(idx<tabList.length) H.tab(tabList[idx]);
  }
});

function applyTheme(t){
  document.body.className=document.body.className.replace(/\btheme-\S+/g,'').trim();
  if(t&&t!=='amber') document.body.classList.add('theme-'+t);
  localStorage.setItem('eixo-theme',t||'amber');
}

applyTheme(localStorage.getItem('eixo-theme')||'amber');
UI.broadcast = localStorage.getItem('eixo-broadcast')!=='off';  // default ON
render();   // first paint → faction select
