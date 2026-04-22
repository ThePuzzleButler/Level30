// ============================================================
// LEVEL 30 - CONFIG
// Google Apps Script Web App — fully connected & live sync!
// ============================================================
 
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyJVQ2TJ-wJonhSpBDDWBER0htkiHDapQQRVgKBsAm8ItqOurDYROmkFQC_788NcDJe/exec",
 
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
// GOOGLE SHEETS SYNC — POST full game state on every change
// ============================================================
 
async function sheetPost(payload) {
  try {
    const state = getGameState();
    payload.gameState = state; // always send full state so sheet is source of truth
    await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Sheet sync failed:", e);
  }
}
 
async function syncScore(player, round, score, total) {
  await sheetPost({ type: "score", player, round, score, total });
}
 
async function syncPenalty(player, penaltyName, points) {
  await sheetPost({ type: "penalty", player, points, text: penaltyName });
}
 
async function syncSabotage(from, to, sabotageName) {
  await sheetPost({ type: "sabotage", player: from, text: `${from} → ${to}: ${sabotageName}` });
}
 
async function syncRound(round) {
  await sheetPost({ type: "round", round });
}
 
async function syncFullState() {
  await sheetPost({ type: "stateOnly" });
}
 
// ============================================================
// LIVE POLL — fetch state from sheet every 5 seconds
// Merges remote state into local, triggers re-render
// ============================================================
 
let _lastRemoteHash = "";
let _onStateUpdate = null; // set by player.html to trigger re-render
 
async function pollSheet() {
  try {
    const res = await fetch(CONFIG.APPS_SCRIPT_URL + "?t=" + Date.now());
    const remote = await res.json();
 
    if (!remote || !remote.players) return;
 
    // Hash to detect changes
    const hash = JSON.stringify(remote);
    if (hash === _lastRemoteHash) return;
    _lastRemoteHash = hash;
 
    // Merge remote state into localStorage
    // Remote is always source of truth for other players' data
    const local = getGameState();
 
    // Merge each player's scores from remote
    CONFIG.PLAYERS.forEach(p => {
      if (remote.players[p]) {
        // Keep local player's own data if newer, use remote for others
        local.players[p] = remote.players[p];
      }
    });
 
    // Always use remote for round, sabotageQueue, usedSabotages, penalties
    local.currentRound    = remote.currentRound    ?? local.currentRound;
    local.sabotageQueue   = remote.sabotageQueue   ?? local.sabotageQueue;
    local.usedSabotages   = remote.usedSabotages   ?? local.usedSabotages;
    local.penalties       = remote.penalties       ?? local.penalties;
 
    localStorage.setItem("level30_state", JSON.stringify(local));
 
    // Trigger re-render in player.html
    if (typeof _onStateUpdate === "function") _onStateUpdate();
 
  } catch (e) {
    // Silent fail — app works offline, just won't sync
  }
}
 
function startPolling(onUpdate) {
  _onStateUpdate = onUpdate;
  pollSheet(); // immediate first poll
  setInterval(pollSheet, 5000); // then every 5 seconds
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
}
 
function getRanking(state) {
  return CONFIG.PLAYERS
    .map(p => ({ name: p, points: state.players[p].totalPoints }))
    .sort((a, b) => a.points - b.points);
}
