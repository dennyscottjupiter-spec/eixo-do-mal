# FIREBASE SETUP — EIXO DO MAL ONLINE MULTIPLAYER

5-minute guide. You only do this once. After that, friends can play with you on any device, anywhere, with no server to manage.

---

## Step 1 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it anything (e.g. `eixo-do-mal`)
4. Disable Google Analytics (not needed) → **"Create project"**

---

## Step 2 — Enable Realtime Database

1. In the left sidebar: **Build → Realtime Database**
2. Click **"Create Database"**
3. Choose any region → click **"Next"**
4. Select **"Start in test mode"** (we'll lock it down in Step 4) → **"Enable"**

---

## Step 3 — Get your web config

1. Go to **Project Overview** (gear icon ⚙️ → Project settings)
2. Scroll to **"Your apps"** → click the `</>` icon to add a web app
3. Give it a nickname (e.g. `eixo-web`) → click **"Register app"**
4. Firebase shows you a `firebaseConfig` object like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "eixo-do-mal.firebaseapp.com",
  databaseURL: "https://eixo-do-mal-default-rtdb.firebaseio.com",
  projectId: "eixo-do-mal",
  storageBucket: "eixo-do-mal.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. **Copy all 7 values** and paste them into `multiplayer.js` in the `FIREBASE_CONFIG` block (replace each `PASTE_YOUR_*_HERE` placeholder).

---

## Step 4 — Set Security Rules (important!)

In Firebase Console → Realtime Database → **Rules** tab, paste this and click **Publish**:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['G', 'seats'])"
      }
    }
  }
}
```

This allows anyone who knows a room code to read/write that room, but nothing else in the DB.

---

## Step 5 — Test it

1. Open `http://localhost:8080/` (run `python3 -m http.server 8080` in the project folder)
2. On the start screen: click **🌍 ONLINE** (or in the game menu)
3. Click **HOST GAME** — you'll see a 6-letter room code in the Event Log
4. Open a second browser tab, same URL → **ONLINE → JOIN** → paste the code → **JOIN GAME**
5. Take a turn in tab 1, end it — tab 2 should update live 🎉

---

## Notes

- **The `apiKey` is safe to commit** — Firebase web configs are public identifiers. Access is controlled by Security Rules, not by keeping the key secret.
- **Free Spark plan limits:** 1 GB storage, 10 GB/month transfer, 100 simultaneous connections. More than enough for personal/group play.
- **Room codes expire** when nobody writes for 24h (no cleanup needed — Firebase auto-purges empty nodes in test mode).
- **To lock it down further** after going public, add per-room expiry rules or Firebase Authentication.
