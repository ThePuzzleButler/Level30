// ============================================================
// LEVEL 30 - CONFIG
// ============================================================

const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyMGgqDngAA4bVvXryioq7RrZbLTMScIPErVuSqRVfJtdGuSJXQxY1UIuO2MNniERNH/exec",

  PLAYERS: ["Carson", "Wyatt", "Chris", "Danny"],

  ROUNDS: [
    "Heroes of Barcadia",
    "Mario Kart",
    "Wall Go",
    "Mario Party",
    "Coup",
    "Wii Golf",
    "Challengers",
    "Fortnite Battle Box",
    "Darts"
  ],

  SABOTAGES: [
    { id: "iced_out",    name: "Iced Out",    icon: "🧊", description: "Target must chug an ice-cold drink before continuing", color: "#00cfff" },
    { id: "spice_it_up", name: "Spice It Up", icon: "🌶️", description: "Target must eat something spicy before starting",      color: "#ff4400" },
    { id: "pull_out",    name: "Pull Out",    icon: "💪", description: "Target must do 25 pull-ups before moving on",          color: "#ffd700" },
    { id: "borat",       name: "Borat",       icon: "🏃", description: "Target must run a lap around the building",           color: "#b400ff" }
  ],

  PENALTIES: [
    { id: "sleep",    name: "Falling Asleep",          icon: "😴", points: 4 },
    { id: "bathroom", name: "Mid-Game Bathroom Break", icon: "🚽", points: 1 },
    { id: "phone",    name: "Touching Phone",          icon: "📱", points: 2 },
    { id: "reels",    name: "Opening Reels",           icon: "📲", points: 2 }
  ]
};

// ============================================================
// LOCAL STATE — always works, even offline
// ============================================================

function initGameState() {
  const state = {
    currentRound: 1,
    players: {},
    sabotageQueue: [],
    usedSabotages: [],
    penalties: []
  };
  CONFIG.PLAYERS.forEach(p => {
    state.players[p] = {
      name: p,
      scores: {},
      totalPoints: 0,
      unlockedSabotage: null,
      sabotagesEarned: [],
      challengesReceived: [],
      bonusPoints: 0
    };
  });
  return state;
}

function getGameState() {
  try {
    const raw = localStorage.getItem("level30_state");
    if (!raw) return initGameState();
    const parsed = JSON.parse(raw);
    // Validate it has the expected structure
    if (!parsed.players || !parsed.players.Carson) return initGameState();
    // Make sure all players exist (in case of old state)
    CONFIG.PLAYERS.forEach(p => {
      if (!parsed.players[p]) {
        parsed.players[p] = initGameState().players[p];
      }
      // Ensure challengesReceived exists
      if (!parsed.players[p].challengesReceived) {
        parsed.players[p].challengesReceived = [];
      }
    });
    if (!Array.isArray(parsed.sabotageQueue)) parsed.sabotageQueue = [];
    if (!Array.isArray(parsed.usedSabotages)) parsed.usedSabotages = [];
    if (!Array.isArray(parsed.penalties)) parsed.penalties = [];
    return parsed;
  } catch(e) {
    return initGameState();
  }
}

function saveGameState(state) {
  try {
    localStorage.setItem("level30_state", JSON.stringify(state));
    pushStateToSheet(state); // fire and forget
  } catch(e) {
    console.warn("Save failed:", e);
  }
}

function getRanking(state) {
  return CONFIG.PLAYERS
    .map(p => ({ name: p, points: state.players[p]?.totalPoints || 0 }))
    .sort((a, b) => a.points - b.points);
}

// ============================================================
// GOOGLE SHEET SYNC — push on every save, poll every 5s
// Page ALWAYS renders from localStorage first.
// Sheet is only used to sync between devices.
// ============================================================

async function pushStateToSheet(state) {
  try {
    const encoded = encodeURIComponent(JSON.stringify(state));
    // Fire and forget — no-cors, we don't wait for response
    fetch(`${CONFIG.APPS_SCRIPT_URL}?action=save&state=${encoded}`, {
      method: "GET",
      mode: "no-cors"
    });
  } catch (e) { /* silent */ }
}

let _lastRemoteHash = "";
let _onStateUpdate = null;

async function pollSheet() {
  try {
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=load&t=${Date.now()}`);
    if (!res.ok) return;

    const text = await res.text();
    if (!text || text.trim() === "" || text.trim() === "OK") return;

    let remote;
    try { remote = JSON.parse(text); } catch(e) { return; }

    // Hard validation — must have proper player structure
    if (!remote || typeof remote !== 'object') return;
    if (!remote.players || typeof remote.players !== 'object') return;
    if (!remote.players.Carson || !remote.players.Wyatt) return;

    const hash = JSON.stringify(remote);
    if (hash === _lastRemoteHash) return; // nothing changed
    _lastRemoteHash = hash;

    // Safe to update localStorage and re-render
    localStorage.setItem("level30_state", JSON.stringify(remote));
    if (typeof _onStateUpdate === "function") _onStateUpdate();

  } catch (e) { /* silent fail — local state keeps working */ }
}

function startPolling(onUpdate) {
  _onStateUpdate = onUpdate;
  // Wait 2 seconds before first poll so page renders locally first
  setTimeout(() => {
    pollSheet();
    setInterval(pollSheet, 5000);
  }, 2000);
}

// Sync helpers (all just push full state)
async function syncScore()   { pushStateToSheet(getGameState()); }
async function syncPenalty() { pushStateToSheet(getGameState()); }
async function syncSabotage(){ pushStateToSheet(getGameState()); }
async function syncRound()   { pushStateToSheet(getGameState()); }
