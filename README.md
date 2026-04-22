# Level 30 — No Sleep No Mercy 🎮

> Four players. Nine rounds. Zero mercy.

A live scoreboard web app for the ultimate game night on **Saturday, May 2nd | 11PM – 8AM**

---

## 🚀 Files in This Repo

| File | Description |
|------|-------------|
| `index.html` | Invite screen — "Join If You Dare" |
| `select.html` | Player select screen |
| `player.html` | Individual player HQ (scores, sabotages, leaderboard) |
| `admin.html` | Admin panel (advance rounds, apply penalties) |
| `js/config.js` | All game config — edit player names, rounds, sabotages here |

---

## ⚙️ Setup Instructions

### Step 1: Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `level30`)
2. Upload all these files to the root of the repo
3. Go to **Settings → Pages → Source → Main branch → / (root)**
4. Your site will be live at: `https://yourusername.github.io/level30/`

### Step 2: Set Up Google Sheets (Optional — for cross-device sync)

The app uses **localStorage** by default (works great on a single device or if everyone is on the same browser session). For full multi-device live sync via Google Sheets:

#### Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new sheet
2. Name the first tab: `Level30`
3. Set up **Row 1** as headers exactly like this:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Player | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | Total | Penalties | Sabotages |

4. Add player names in **A2:A5**:
   - A2: `Carson`
   - A3: `Wyatt`
   - A4: `Chris`
   - A5: `Danny`

5. In **K2** add formula: `=SUM(B2:J2)+L2` — copy down to K3:K5 for auto-totals

#### Get Your Spreadsheet ID

From your sheet URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit
```

#### Get a Google Sheets API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → Enable **Google Sheets API**
3. Go to **Credentials → Create API Key**
4. Restrict to Google Sheets API only
5. Copy the key

#### Configure the App

Open `js/config.js` and replace:
```javascript
SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE",
API_KEY: "YOUR_GOOGLE_SHEETS_API_KEY_HERE",
```

> **Note:** Make your sheet **publicly viewable** (Share → Anyone with link → Viewer) for the API key to work without OAuth.

---

## 🎮 How to Play

### Before the Night
- Open `index.html` — send the link to all players
- Each player taps **Enter If You Dare**, then picks their name on the select screen
- Each player bookmarks their own `player.html?player=NAME` page

### During the Night
1. **After each round**, each player goes to their screen and taps their placement (1–4)
2. Scores update live on the leaderboard
3. **If a player gets 1st place**, they can unlock a sabotage
4. They choose which sabotage and who to target — the target sees an alert on their next screen load
5. **Danny** controls round advancement from his player screen (Commissioner Controls section at the bottom)

### Sabotages 💣
| Sabotage | Effect |
|----------|--------|
| 🧊 Iced Out | Target chugs an ice-cold drink |
| 🌶️ Spice It Up | Target eats something spicy |
| 💪 Pull Out | Target does 25 pull-ups |
| 🏃 Borat | Target runs a lap around the building |

### Penalties ⚠️
| Penalty | Points |
|---------|--------|
| 😴 Falling Asleep | +4 pts |
| 🚽 Mid-Game Bathroom Break | +1 pt |
| 📱 Touching Phone | +2 pts |
| 📲 Opening Reels | +2 pts |

### Scoring
- 1st place = **1 point**
- 2nd place = **2 points**
- 3rd place = **3 points**
- 4th place = **4 points**
- **Lowest score wins!**

---

## 🗓️ The 9 Rounds

1. Heroes of Barcadia
2. Mario Kart
3. Wall Go
4. Mario Party
5. Coup
6. Wii Golf
7. Challengers
8. Fortnite Battle Box
9. Darts

---

## 📱 Sharing Player Links

Send each player their direct link:
```
https://yourusername.github.io/level30/player.html?player=Carson
https://yourusername.github.io/level30/player.html?player=Wyatt
https://yourusername.github.io/level30/player.html?player=Chris
https://yourusername.github.io/level30/player.html?player=Danny
```

Or just send everyone: `https://yourusername.github.io/level30/` and they pick their name!

---

*No Sleep. No Mercy. May 2nd.*
