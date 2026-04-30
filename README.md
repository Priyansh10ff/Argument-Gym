<div align="center">
  <img src="https://raw.githubusercontent.com/Priyansh10ff/Argument-Gym/main/frontend/public/favicon.ico" alt="Argument Gym Logo" width="120" />
  <h1>🥊 Argument Gym</h1>
  <p><strong>Your arguments are weaker than you think.</strong></p>
  <p>An AI sparring partner that fights back, scores your logic, remembers your weaknesses, and gets harder to beat the better you get.</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![Convex](https://img.shields.io/badge/Convex-Black?style=flat&logo=convex&logoColor=white)](https://convex.dev/)

  <br />
  <a href="#features">Features</a> ·
  <a href="#demo">Live Demo</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#contributing">Contributing</a>
</div>

---

## 🌟 Why Argument Gym?

Most AI tools are built to agree with you. **Argument Gym** is built to challenge you. 
Whether you're preparing for a debate, training for sales objections, or practicing courtroom cross-examinations, Argument Gym forces you to articulate your points clearly and defends against them relentlessly.

Built with **React**, **Vite**, and **Convex**, Argument Gym features real-time multiplayer lobbies, an adaptive ELO rating system, and lightning-fast AI streaming via OpenRouter.

## ✨ Features

- **🧠 Adaptive AI Opponent**: The AI tracks your logic, evidence, and originality. It remembers your logical fallacies across sessions and targets your weakest points.
- **🏆 Gamified Profile (Chess.com Style)**: Earn ELO points, maintain win streaks, and climb the global leaderboard.
- **🤝 Human vs Human (HvH) Mode**: Debate a real opponent in real-time while an AI judge monitors the exchange, scores it live, and delivers a final verdict.
- **👀 Spectator Mode**: Join live HvH debates just to watch the drama unfold.
- **🔄 Multiple Training Modes**:
  - `Standard Gym`: Pure adversarial debate.
  - `Court Gym`: Dual-role AI (opposing counsel + live judge rulings).
  - `Sales Gym`: Practice pitching against skeptical personas (CFO, VP, Technical Buyer).
- **☁️ Modern Cloud Stack**: Fully reactive backend powered by **Convex**, with `@convex-dev/auth` for seamless Guest & Google authentication.
- **🤖 Bring Your Own Model**: Switch between GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and Llama 3 via OpenRouter.

---

## 🚀 Getting Started (Local Development)

Argument Gym is designed to be easily self-hosted. 

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- An [OpenRouter API Key](https://openrouter.ai/) for the AI models.
- A [Convex](https://convex.dev/) account (Free tier is perfectly fine!).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Priyansh10ff/Argument-Gym.git
   cd Argument-Gym/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize Convex:**
   ```bash
   npx convex dev
   ```
   *This will prompt you to log into Convex and create a new project. It will automatically create your `.env.local` file with your `VITE_CONVEX_URL`.*

4. **Set your Environment Variables:**
   You need to set your secrets securely in your Convex dashboard. Run the following commands:
   ```bash
   npx convex env set PRIMARY_LLM_API_KEY="your-openrouter-key"
   npx convex env set PRIMARY_LLM_BASE_URL="https://openrouter.ai/api/v1"
   
   # For Google Auth (Optional, but required for persistent login)
   npx convex env set GOOGLE_CLIENT_ID="your-google-client-id"
   npx convex env set GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

5. **Start the Frontend Development Server:**
   In a new terminal window (keep `npx convex dev` running):
   ```bash
   npm run dev
   ```

6. **Open your browser!** Navigate to `http://localhost:5173`.

---

## 🕹️ How It Works

1. **Pick your fight:** Choose a topic, take a stance, and set the difficulty (Casual, Rigorous, or Brutal).
2. **Make your case:** Write your opening argument. The AI extracts 3 core claims, assigning each a "health bar."
3. **Survive the rounds:** The AI argues the opposite. It targets your weakest claim every round. Health bars deplete in real time as the AI dismantle your points.
4. **Face the verdict:** You are scored across logic, evidence, and originality. Your ELO rating is updated, and your weakness profile is refined for the next match.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, CSS Modules
- **Backend & Database:** Convex (Serverless reactive database, queries, mutations, and actions)
- **Authentication:** Convex Auth (Guest Sessions & Google OAuth)
- **AI Integration:** OpenRouter (OpenAI-compatible API format) using Server-Sent Events (SSE) for streaming.

---

## 🤝 Contributing

Contributions are always welcome! If you have ideas for new game modes, better UI/UX, or more robust AI prompts, please feel free to open an issue or submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Priyansh10ff">Priyansh</a>.</p>
</div>
