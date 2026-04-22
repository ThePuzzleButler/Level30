// ============================================================
// LEVEL 30 - CONFIG — Live sync via Google Apps Script
// ============================================================

const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzKQKl390M2sZvsp99qXJw9jhO3ciaL5j_e1jtxTFYR0wXF7TegG9SZ0O2uPwV5rQH_/exec",

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
// SYNC — sends full game state to sheet after every action
// Uses no-cors (Apps Script limitation) but state is always
// embedded in the GET URL as a query param for reading back
// ============================================================

async function pushStateToSheet(state) {
  try {
    // Encode full state as a query param on a GET request
    // This works around no-cors POST limitations
    const encoded = encodeURIComponent(JSON.stringify(state));
    await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=save&state=${encoded}`, {
      method: "GET",
      mode: "no-cors"
    });
  } catch (e) {
    console.warn("Push failed:", e);
  }
}

async function syncScore(player, round, score, total) {
  const state = getGameState();
  await pushStateToSheet(state);
}

async function syncPenalty(player, penaltyName, points) {
  const state = getGameState();
  await pushStateToSheet(state);
}

async function syncSabotage(from, to, sabotageName) {
  const state = getGameState();
  await pushStateToSheet(state);
}

async function syncRound(round) {
  const state = getGameState();
  await pushStateToSheet(state);
}

// ============================================================
// POLL — fetch full game state from sheet every 5 seconds
// ============================================================

let _lastRemoteHash = "";
let _onStateUpdate = null;

async function pollSheet() {
  try {
    // Add timestamp to bust cache
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=load&t=${Date.now()}`);
    const text = await res.text();

    // Apps Script returns JSON string
    let remote;
    try {
      remote = JSON.parse(text);
    } catch(e) {
      return; // not valid JSON yet, sheet may be empty
    }

    if (!remote || !remote.players) return;

    // Only update if something changed
    const hash = JSON.stringify(remote);
    if (hash === _lastRemoteHash) return;
    _lastRemoteHash = hash;

    // Sheet is source of truth — write it to localStorage
    localStorage.setItem("level30_state", JSON.stringify(remote));

    // Trigger re-render
    if (typeof _onStateUpdate === "function") _onStateUpdate();

  } catch (e) {
    // silent fail — works offline
  }
}

function startPolling(onUpdate) {
  _onStateUpdate = onUpdate;
  pollSheet();
  setInterval(pollSheet, 4000); // every 4 seconds
}

// ============================================================
// LOCAL STATE
// ============================================================

function getGameState() {
  const raw = localStorage.getItem("level30_state");
  if (raw) return JSON.parse(raw);
  return initGameState();
}

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
      sabotagesEarned: []
    };
  });
  return state;
}

function saveGameState(state) {
  localStorage.setItem("level30_state", JSON.stringify(state));
  pushStateToSheet(state); // always push to sheet on every save
}

function getRanking(state) {
  return CONFIG.PLAYERS
    .map(p => ({ name: p, points: state.players[p].totalPoints }))
    .sort((a, b) => a.points - b.points);
}
