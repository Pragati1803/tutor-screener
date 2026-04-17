# Cuemath AI Tutor Screener

An AI-powered voice interview app for screening tutor candidates. Aria (the AI interviewer) conducts a natural voice conversation, then generates a structured scorecard across 5 dimensions.

## Features
- Voice-based interview using browser SpeechRecognition + speechSynthesis (no paid STT/TTS)
- Claude-powered conversational AI that follows up naturally on vague answers
- Live transcript display during the interview
- Structured scorecard with dimension scores, justifications, and candidate quotes
- Pass / Review / Reject recommendation

## Tech Stack
- **Frontend**: React + Vite → deployed on Vercel
- **Backend**: Express (Node.js) → deployed on Render
- **AI**: Claude claude-sonnet-4-20250514 via Anthropic API

---

## Local Development

### Prerequisites
- Node.js 18+
- An Anthropic API key (get one at console.anthropic.com)
- Google Chrome (required for SpeechRecognition API)

### Step 1: Clone and set up the server

```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
# Server runs on http://localhost:3001
```

### Step 2: Set up the client

```bash
cd client
npm install
cp .env.example .env.local
# .env.local already points to http://localhost:3001 — no changes needed for local dev
npm run dev
# Client runs on http://localhost:5173
```

Open http://localhost:5173 in Chrome. Allow microphone access when prompted.

---

## Deployment

### Backend → Render

1. Push your code to a GitHub repo (public or private)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
6. Click **Create Web Service**
7. Wait ~2 min. Copy the URL — it looks like `https://tutor-screener-xxxx.onrender.com`

### Frontend → Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: your Render URL (e.g. `https://tutor-screener-xxxx.onrender.com`)
5. Click **Deploy**
6. Your live URL is ready!

---

## Security Notes
- The Anthropic API key is ONLY stored on the Render backend as an environment variable
- It is never sent to the browser or exposed in the frontend code
- The `VITE_API_URL` env var is just the backend URL — safe to expose

---

## How the Interview Works

1. Candidate enters their name and subject area
2. Aria greets them and asks 4-5 questions covering:
   - Explaining concepts to children
   - Handling frustrated/stuck students
   - Teaching philosophy and motivation
3. If an answer is vague, Aria naturally asks for more detail
4. After all questions, Claude generates a scorecard with:
   - **Clarity** — how clearly they communicate
   - **Warmth** — how caring and patient they sound
   - **Simplification** — ability to explain simply
   - **Fluency** — English language confidence
   - **Handling Confusion** — response to stuck students
5. Each dimension gets a score (1-5), justification, and a quote from the interview
6. Final recommendation: PASS / REVIEW / REJECT

---

## Project Structure

```
tutor-screener/
├── server/
│   ├── index.js          # Express server + Claude API calls
│   ├── package.json
│   └── .env.example
└── client/
    ├── src/
    │   ├── App.jsx           # Root component + page routing
    │   ├── App.css           # All styles
    │   ├── api.js            # fetch wrappers for backend
    │   ├── hooks/
    │   │   └── useSpeech.js  # SpeechRecognition + speechSynthesis
    │   └── pages/
    │       ├── WelcomePage.jsx
    │       ├── InterviewPage.jsx
    │       └── ResultsPage.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## Troubleshooting

**"Speech recognition not supported"** → Use Google Chrome. Safari and Firefox do not support SpeechRecognition.

**Aria speaks but mic doesn't activate** → Check browser microphone permissions in Chrome Settings → Privacy → Microphone.

**Backend connection error** → Make sure VITE_API_URL in your Vercel env vars matches your Render URL exactly (no trailing slash).

**Render backend sleeping** → Free tier Render services sleep after 15 min of inactivity. First request after sleep takes ~30 sec. Upgrade to a paid plan for production use.
