# 🔐 Escape the Query Room

### 🎮 [Play it live →](https://escape-the-query-room.vercel.app)

**Escape the Query Room** is an interactive escape room game that teaches SQL through storytelling. Each room presents a narrative, a real database and a series of challenges, and the only way forward is to write the right query. Stuck? Ask for a regular hint, or get a strategic hint generated in real time by **Google Gemini**.

---

## ✨ Features

- **3 escape rooms, 5 stages each**: every room has its own storyline, database and increasing difficulty.
- **Built-in SQL editor**: write and run queries against a real SQLite database and see the results in a table.
- **Smart answer validation**: the server checks the actual result set (columns, row count and values), not just the query text, and returns targeted feedback.
- **AI-powered hints**: `gemini-2.5-flash` receives the challenge, the table schema, the player's last query and their error, and returns a strategic hint that guides the thinking process without giving away the answer.
- **Scoring system**: points are based on solve time, with penalties for using hints.
- **Leaderboard**: a separate leaderboard for each room.
- **Audio-visual experience**: cyberpunk styling, animations, background videos and sound effects.

---

## 🗺️ Rooms

| Room | Story | Tables |
|---|---|---|
| ⚽ **Football Stadium** | Infiltrate the UEFA database to expose corruption | `teams`, `players`, `matches` |
| 🎰 **Casino Heist** | Hack into the casino's rigged system and expose the fraud | `slot_machines`, `players`, `games` and more |
| 🚀 **Space Station** | Stabilise the ISS Helios after a cascade of system failures | `modules`, `crew_members`, `system_alerts`, `sensor_readings`, `maintenance_logs` |

Stages progress from a simple `SELECT *`, through filtering with `WHERE`, up to `JOIN`, `GROUP BY`, `HAVING` and subqueries.

---

## 🏆 Scoring

| Action | Points |
|---|---|
| Solve a stage within 30 seconds | 100 |
| Every 2 extra seconds | −1 (minimum 20 per stage) |
| Regular hint | −20 |
| AI hint | −30 |

When a room is completed, the total score and time are saved to the leaderboard.

---

## 🛠️ Tech Stack

**Frontend**

- React 19
- React Router
- styled-components + Tailwind CSS
- Axios, lucide-react

**Backend**

- Python + Flask
- Flask-SQLAlchemy (users, progress and leaderboard)
- SQLite (a separate database for each room)
- Google Gemini API (`google-generativeai`)

**Deployment**

- Vercel (frontend and backend served from the same domain)

---

## 📁 Project Structure

```
├── backend/
│   ├── app.py                 # Flask server: API, room config, validation and AI hints
│   ├── requirements.txt
│   ├── database/              # Room databases (football / casino / space)
│   ├── test_ai_hints.py       # Tests for the AI hint endpoint
│   └── test_gemini.py         # Gemini connection test
│
└── frontend/
    ├── public/
    │   ├── audio/             # Sound effects
    │   └── videos/            # Background videos
    └── src/
        ├── App.js             # Game entry and username selection
        ├── MainMenu.js        # Room selection and leaderboard
        ├── RouterWrapper.js
        └── components/
            ├── FootballRoom.js
            ├── CasinoRoom.js
            ├── SpaceStationRoom.js
            ├── SQLEditor.js
            └── DatabaseViewer.js

vercel.json                    # Vercel deployment config (routes /api to the backend)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- A Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the repository

```bash
git clone https://github.com/Lavie-Zanzuri/Escape-the-Query-Room.git
cd Escape-the-Query-Room
```

### 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the server:

```bash
python app.py
```

The server runs at `http://localhost:5000`. The room databases are included in `backend/database`, and any missing one is recreated automatically on launch.

> 💡 The game works without a Gemini key. Only AI hints will be unavailable; regular hints keep working.

### 3. Run the frontend

The frontend calls the API with relative paths (`/api/...`), which works as-is on Vercel. For local development, make sure `frontend/package.json` includes this line so requests are forwarded to the Flask server:

```json
"proxy": "http://localhost:5000",
```

Then, in a second terminal:

```bash
cd frontend
npm install
npm start
```

The game opens in your browser at `http://localhost:3000`.

---

## ☁️ Deployment

The game is deployed on **Vercel** as two services under one domain, configured in `vercel.json`:

- Requests to `/api/*` are routed to the Flask backend.
- All other requests are routed to the React frontend.

Because both run on the same domain, the frontend calls the API with relative paths (`/api/...`) and no CORS setup is needed.

To deploy your own copy:

1. Import the repository into [Vercel](https://vercel.com/new).
2. Add `GEMINI_API_KEY` under **Settings → Environment Variables**.
3. Deploy.

> ℹ️ On Vercel the leaderboard is read-only, since the serverless file system doesn't allow writing to SQLite. Run the game locally for a fully working leaderboard (stored in `backend/instance/sql_quest.db`).

---

## 🔌 Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/test` | Server health check |
| `GET` | `/api/rooms` | List of rooms |
| `GET` | `/api/rooms/<room_id>/stage/<stage_id>` | Stage data (story, task, tables, hints) |
| `POST` | `/api/execute-sql/<room_id>` | Run a query against the room's database |
| `POST` | `/api/validate-query/<room_id>/<stage>` | Check whether the query solves the stage |
| `POST` | `/api/ai-hint/<room_id>/<stage_id>` | Generate a strategic hint with Gemini |
| `POST` | `/api/users` | Create a user |
| `POST` | `/api/leaderboard/run` | Save a completed run |
| `GET` | `/api/leaderboard/<room_id>` | Get a room's leaderboard |

---

## 🤖 How the AI Hints Work

When a player requests an AI hint, the frontend sends the server their last query, the error they got and the regular hints already available for the stage. The server builds a prompt that instructs Gemini to act as an SQL tutor: give a one-to-two sentence hint that is completely different from the existing hints, focuses on **how to think** about the problem rather than syntax, and never reveals column names, values or keywords. The player gets a direction without getting the solution.

---

## 🔒 Security

The server only allows **`SELECT` queries**. Any other statement (such as `DROP`, `DELETE` or `UPDATE`) is blocked, so players cannot modify or delete the room databases.

---

## 👤 Author

**Lavie Zanzuri** – [GitHub](https://github.com/Lavie-Zanzuri)
