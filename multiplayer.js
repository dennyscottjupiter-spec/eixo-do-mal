'use strict';
/* =====================================================================
   EIXO DO MAL — multiplayer.js
   Layer 9: Firebase Realtime Database online multiplayer
   Loaded last (after screens.js). Single-player is fully unaffected —
   MP.enabled stays false until the player opens the lobby.
   ===================================================================== */

/* ---------- Firebase config placeholder ----------
   Replace the values below with your own Firebase project config.
   See FIREBASE-SETUP.md for step-by-step instructions.
   The apiKey is SAFE to commit — it is a public identifier, not a secret.
   Access is governed by Firebase Security Rules, not by key secrecy.
*/
const FIREBASE_CONFIG = {
  apiKey:            "PASTE_YOUR_API_KEY_HERE",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN_HERE",
  databaseURL:       "PASTE_YOUR_DATABASE_URL_HERE",
  projectId:         "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId:             "PASTE_YOUR_APP_ID_HERE"
};

/* ---------- MP state object ---------- */
const MP = {
  enabled: false,   // false = pure single-player; nothing in the base game references MP
  seat: 0,          // which nation index this client controls
  host: false,      // host runs aiMacro + econTick at end of turn
  roomCode: null,
  ref: null,        // Firebase DB reference for current room
  _lastVer: 0,      // ignore echoes: only apply remote updates with a higher version
  _debounceTimer: null,

  /* Is it our turn to act? Always true in single-player. */
  canAct(){
    if(!this.enabled) return true;
    return G && G.activeSeat === this.seat;
  },

  /* Push local G to Firebase (debounced — max one write per 300ms) */
  push(){
    if(!this.enabled || !this.ref) return;
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(()=>{
      G._ver = (G._ver||0)+1;
      G._writer = this.seat;
      this.ref.set({ G: JSON.parse(JSON.stringify(G)), seats: MP._seats });
    }, 300);
  },

  /* Subscribe to room changes */
  subscribe(){
    if(!this.ref) return;
    this.ref.on('value', snap=>{
      const data=snap.val();
      if(!data||!data.G) return;
      const remote=data.G;
      // ignore own echo
      if(remote._writer===this.seat && remote._ver<=this._lastVer) return;
      this._lastVer=remote._ver||0;
      MP._seats=data.seats||{};
      G=remote;
      UI.tab=UI.tab||'build';
      render();
    });
  },

  _seats: {}  // { seatIndex: factionId } — tracks claimed seats
};

/* ---------- Firebase init ---------- */
function mpInit(){
  if(typeof firebase==='undefined'){
    console.warn('[MP] Firebase SDK not loaded — multiplayer unavailable.');
    return false;
  }
  if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  return true;
}

/* ---------- Room helpers ---------- */
function mpGenerateCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
}

function mpJoinRoom(code, seat, faction, onSuccess, onError){
  if(!mpInit()){ onError('Firebase not available'); return; }
  const db=firebase.database();
  MP.roomCode=code.toUpperCase();
  MP.seat=seat;
  MP.ref=db.ref(`rooms/${MP.roomCode}`);
  MP.enabled=true;

  MP.ref.once('value', snap=>{
    const data=snap.val();
    if(!data||!data.G){
      onError('Room not found or game not started. Make sure the host has picked a faction.');
      return;
    }
    MP._seats=data.seats||{};
    // claim the seat
    if(MP._seats[seat]){ onError(`Seat ${seat} is already taken.`); return; }
    MP._seats[seat]=faction;
    G=data.G;
    // mark the nation as player-controlled
    if(G.nations[seat]) G.nations[seat].isPlayer=true;
    G._ver=(G._ver||0)+1;
    G._writer=seat;
    MP.ref.set({ G: JSON.parse(JSON.stringify(G)), seats: MP._seats });
    MP.subscribe();
    onSuccess();
  });
}

function mpHostRoom(code, faction, difficulty, onSuccess){
  if(!mpInit()){ return; }
  const db=firebase.database();
  MP.roomCode=code;
  MP.seat=0;
  MP.host=true;
  MP.ref=db.ref(`rooms/${MP.roomCode}`);
  MP.enabled=true;
  MP._seats={0: faction};
  // initGame writes to G; we then push it
  UI.difficulty=difficulty;
  initGame(faction);
  G._ver=1;
  G._writer=0;
  MP.ref.set({ G: JSON.parse(JSON.stringify(G)), seats: MP._seats });
  MP.subscribe();
  onSuccess();
}

/* Override afterAction and endTurn when MP is active */
const _origAfterAction=afterAction;
const _origEndTurn=endTurn;

function afterAction(){
  _origAfterAction();
  if(MP.enabled) MP.push();
}

function endTurn(){
  if(MP.enabled){
    // only the active seat can end the turn
    if(!MP.canAct()) return;
    // host resolves AI; non-host just hands off seat
    if(!MP.host){
      // hand off to next human or to host for AI resolution
      G.activeSeat=0;  // always give turn back to host first for AI resolution
      G._ver=(G._ver||0)+1; G._writer=MP.seat;
      MP.push();
      render();
      return;
    }
  }
  _origEndTurn();
  if(MP.enabled){
    // advance activeSeat to next human seat (or stay at 0 for single-player)
    const humanSeats=Object.keys(MP._seats).map(Number).sort();
    const curIdx=humanSeats.indexOf(G.activeSeat||0);
    G.activeSeat=humanSeats[(curIdx+1)%humanSeats.length];
    MP.push();
  }
}

/* ---------- Lobby overlay (rendered by renderLobby below) ---------- */
H.openLobby=()=>renderLobby();
H.hostGame=(p)=>{
  const code=mpGenerateCode();
  const faction=p||'iran';
  mpHostRoom(code, faction, UI.difficulty||'medium', ()=>{
    $('lobbyOverlay').classList.add('hidden');
    render();
    log('sys',`🌍 Room created! Share code <b>${code}</b> with your friends. They click ONLINE → JOIN and paste this code.`);
  });
};
H.joinGame=(p,q)=>{
  const code=p, faction=q||'usa';
  if(!code||code.length!==6){ log('sys','Enter a 6-character room code.'); render(); return; }
  const seat=Object.keys(MP._seats||{}).length||1;  // claim next open seat
  mpJoinRoom(code, seat, faction, ()=>{
    $('lobbyOverlay').classList.add('hidden');
    render();
    log('sys',`🌍 Joined room ${code} as ${CONFIG.factions[faction].n}. Waiting for the host to act.`);
  }, (err)=>{
    alert('Join failed: '+err);
  });
};
H.closeLobby=()=>{ $('lobbyOverlay').classList.add('hidden'); };

function renderLobby(){
  const o=$('lobbyOverlay');
  if(!o) return;
  const fOpts=Object.entries(CONFIG.factions).map(([k,f])=>
    `<option value="${k}">${f.flag} ${f.n} — ${f.bonus}</option>`).join('');
  o.innerHTML=`<div class="obox" style="max-width:480px">
<div class="sec">🌍 ONLINE MULTIPLAYER</div>
<div class="muted" style="margin:8px 0 14px">
  Play with up to 5 friends in real time. One player hosts and picks a faction; others join with the room code.<br>
  Unclaimed seats are filled by the AI. Requires a Firebase config — see <b>FIREBASE-SETUP.md</b>.
</div>
<div class="sec">HOST A NEW GAME</div>
<div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:10px">
  <span class="grow dim">Your faction:</span>
  <select id="mp-host-faction" style="font:inherit;background:var(--panel);color:var(--amber);border:1px solid var(--amber-dim);padding:2px 6px">${fOpts}</select>
  <button class="btn gr" onclick="H.hostGame(document.getElementById('mp-host-faction').value)">🎖 HOST GAME</button>
</div>
<div class="sec">JOIN EXISTING GAME</div>
<div class="row" style="flex-wrap:wrap;gap:8px">
  <input id="mp-code" placeholder="6-letter room code" maxlength="6" style="font:inherit;background:var(--panel);color:var(--amber);border:1px solid var(--amber-dim);padding:3px 8px;width:140px;letter-spacing:3px;text-transform:uppercase">
  <select id="mp-join-faction" style="font:inherit;background:var(--panel);color:var(--amber);border:1px solid var(--amber-dim);padding:2px 6px">${fOpts}</select>
  <button class="btn cy" onclick="H.joinGame(document.getElementById('mp-code').value.toUpperCase(),document.getElementById('mp-join-faction').value)">🌐 JOIN GAME</button>
</div>
<div class="muted" style="margin-top:12px;font-size:12px">
  ⚠️ <b>First-time setup required:</b> you need to paste your Firebase config into <code>multiplayer.js</code>.<br>
  See <b>FIREBASE-SETUP.md</b> in this folder for the 5-minute step-by-step guide.
</div>
<div style="margin-top:14px"><button class="btn" onclick="H.closeLobby()">✖ CLOSE</button></div>
</div>`;
  o.classList.remove('hidden');
}

/* Register lobby overlay in Esc handler additions */
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    const lo=$('lobbyOverlay');
    if(lo) lo.classList.add('hidden');
  }
}, true);

/* Waiting-room banner injected into renderCmd when it's not your turn */
const _origRenderCmd = typeof renderCmd === 'function' ? renderCmd : null;
// We patch render() to show the "waiting" state for non-active clients
const _origRender = render;
// (render is re-declared in render.js; we hook it via endTurn/afterAction paths above)
