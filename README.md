<div align="center">
  <img src="https://raw.githubusercontent.com/Priyansh10ff/Argument-Gym/main/frontend/public/favicon.ico" alt="Argument Gym Logo" width="120" />
  <h1>🥊 Argument Gym</h1>
  <p><strong>Your arguments are weaker than you think.</strong></p>
  <p>An AI-powered sparring arena designed to sharpen your logic, improve your sales objections, and prepare you for high-stakes debates.</p>

  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![Convex](https://img.shields.io/badge/Convex-Black?style=flat&logo=convex&logoColor=white)](https://convex.dev/)
  [![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-red)](https://openrouter.ai/)

  <br />
  <a href="#-features">Features</a> ·
  <a href="#-modes">Modes</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-setup">Setup</a> ·
  <a href="#-how-it-works">How It Works</a>
</div>

---

## 🌟 Why Argument Gym?

Most AI tools are built to agree with you. **Argument Gym** is built to challenge you. 

Whether you're preparing for a critical debate, training for sales objections, or practicing courtroom cross-examinations, Argument Gym forces you to articulate your points clearly and defends against them relentlessly. It's the only platform that scores your logic in real-time and adapts its difficulty as you get stronger.

---

## ✨ Features

### 🎮 Gamified Experience
- **ELO Rating System:** Gain and lose points based on your performance. Rise through the global ranks.
- **Achievements:** Unlock badges like *Flawless Victory*, *Unstoppable*, and *Veteran* as you master the art of persuasion.
- **Global Leaderboard:** Compete for the #1 spot globally or today's top delta.

### 🧠 Intelligent Sparring
- **Adaptive Weakness Memory:** The AI tracks your recurring logical fallacies and weakest arguments across sessions to proactively target them.
- **Custom Personas:** Don't just fight an AI—fight a *Technical Buyer*, a *Skeptical CFO*, or even a *Grumpy 19th Century Philosopher* using custom persona injection.
- **Daily Challenge:** A synchronized daily topic for the entire community to debate.

### 🎙️ Modern Interface
- **Voice Integration:** Speak your arguments using Speech-to-Text (STT) and hear the AI respond with Text-to-Speech (TTS).
- **Match Replays:** Every debate is saved. Generate a shareable link to show off your winning arguments to colleagues or friends.
- **Real-time Scoring:** AI judges your logic, evidence, and originality on every turn.

---

## 🎭 Modes

| Mode | AI Persona | Goal |
| :--- | :--- | :--- |
| **Standard** | Logical Socratic | Broad intellectual sparring and logic testing. |
| **Sales** | Skeptical Buyer | Practice overcoming objections and closing deals. |
| **Courtroom** | Opposing Counsel | Defend your claims against aggressive cross-examination. |
| **Human vs Human** | None | Private lobby matchmaking to debate friends directly. |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, CSS Modules (Custom Design System)
- **Backend:** [Convex](https://convex.dev) (Real-time Database, Functions, Cron)
- **AI Intelligence:** OpenRouter (Claude/Llama) with custom streaming prompts.
- **Auth:** Convex Auth (Guest Sessions & Google OAuth).
- **Voice:** Web Speech API (STT/TTS).

---

## 🚀 Setup

### 1. Clone the repository
```bash
git clone https://github.com/Priyansh10ff/Argument-Gym.git
cd argument-gym
```

### 2. Install Dependencies
```bash
npm install
cd frontend && npm install
```

### 3. Environment Setup
Create a `.env.local` in the `frontend` directory:
```env
VITE_CONVEX_URL=your_convex_url
PRIMARY_LLM_API_KEY=your_openrouter_key
```

### 4. Run Locally
```bash
# In the root directory
npm run dev
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Built with ❤️ for better arguments.
</div>
