import React, { useState } from 'react';
import styles from './MarketingPage.module.css';
import { useAuth } from '../lib/auth';

const STEPS = [
  { n: '01', title: 'Pick your fight', desc: 'Choose a topic, take a stance, set the difficulty — casual, rigorous, or brutal.' },
  { n: '02', title: 'Make your case', desc: 'Write your opening argument. The AI extracts 3 core claims — each with its own health bar.' },
  { n: '03', title: 'Survive the rounds', desc: 'The AI argues the opposite. Hard. It targets your weakest claim every round. Health bars deplete in real time.' },
  { n: '04', title: 'Face the verdict', desc: 'Scored across logic, evidence, and originality. ELO rating updated. Weakness profile refined.' },
];

const MODES = [
  {
    icon: '🥊',
    name: 'STANDARD GYM',
    tag: 'CLASSIC',
    desc: 'Pure adversarial debate. The AI argues the opposite of whatever you say and never lets you slide.',
    points: ['Adaptive opponent that learns your patterns', 'Health bar system — 3 claims, 3 lives', 'ELO rating against difficulty tiers'],
  },
  {
    icon: '⚖️',
    name: 'COURT GYM',
    tag: 'LEGAL TRAINING',
    desc: 'Two AI voices: opposing counsel cross-examines you and a judge rules on every exchange.',
    points: ['Dual-role: Counsel + live Judge rulings', 'Case file injection — practice your real cases', 'Precedent pressure and procedural challenges'],
  },
  {
    icon: '💼',
    name: 'SALES GYM',
    tag: 'PITCH TRAINING',
    desc: 'Four distinct buyer personas. Objection memory. Paste your actual product and get objections that match your pitch.',
    points: ['Skeptical CFO · Enthusiastic VP · Technical Buyer · Procurement', 'Objection memory — AI knows what you fail on', 'Scenario injection — use your real pitch'],
  },
];

export default function MarketingPage({ onEnter }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const auth = useAuth();

  const handleEnterClick = () => {
    if (auth.isGuest) {
      setShowAuthModal(true);
    } else {
      onEnter();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.noise} />

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>ENTER THE GYM</h2>
            <p className={styles.modalSub}>How do you want to play?</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnGoogle} onClick={auth.signInWithGoogle}>
                Sign in with Google
              </button>
              <button className={styles.modalBtnGuest} onClick={onEnter}>
                Play as Guest
              </button>
            </div>
            <p className={styles.modalNote}>
              Google accounts save your ELO, match history, and weakness profile.
            </p>
            <button className={styles.modalClose} onClick={() => setShowAuthModal(false)}>✕</button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>OPEN SOURCE · MIT LICENSE</div>
          <h1 className={styles.heroTitle}>ARGUMENT<br />GYM</h1>
          <div className={styles.heroRule} />
          <p className={styles.heroTagline}>Your arguments are weaker than you think.</p>
          <p className={styles.heroSub}>
            An AI that fights back. Scores your logic. Remembers your weaknesses.<br />
            Gets harder to beat the better you get.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={handleEnterClick}>
              ENTER THE GYM →
            </button>
            <a
              className={styles.ctaSecondary}
              href="https://github.com/Priyansh10ff/Argument-Gym"
              target="_blank"
              rel="noopener noreferrer"
            >
              VIEW ON GITHUB ↗
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <p className={styles.sectionLabel}>HOW IT WORKS</p>
          <div className={styles.stepsGrid}>
            {STEPS.map(s => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modes ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <p className={styles.sectionLabel}>TRAINING MODES</p>
          <div className={styles.modesGrid}>
            {MODES.map(m => (
              <div key={m.name} className={styles.modeCard}>
                <div className={styles.modeCardTop}>
                  <span className={styles.modeCardIcon}>{m.icon}</span>
                  <span className={styles.modeCardTag}>{m.tag}</span>
                </div>
                <h3 className={styles.modeCardName}>{m.name}</h3>
                <p className={styles.modeCardDesc}>{m.desc}</p>
                <ul className={styles.modeCardPoints}>
                  {m.points.map(p => (
                    <li key={p} className={styles.modeCardPoint}>
                      <span className={styles.bullet}>—</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* HvH banner */}
          <div className={styles.hvhBanner}>
            <div className={styles.hvhLeft}>
              <span className={styles.hvhIcon}>👥</span>
              <div>
                <p className={styles.hvhName}>HUMAN vs HUMAN</p>
                <p className={styles.hvhDesc}>Debate a real opponent. AI monitors every exchange, scores it live, and delivers the final verdict.</p>
              </div>
            </div>
            <span className={styles.hvhTag}>AI-MONITORED</span>
          </div>
        </div>
      </section>

      {/* ── Adaptive AI ── */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.container}>
          <p className={styles.sectionLabel}>ADAPTIVE OPPONENT</p>
          <h2 className={styles.bigStatement}>
            The more you debate,<br />the harder it gets.
          </h2>
          <p className={styles.adaptiveSub}>
            Argument Gym builds a weakness fingerprint across every debate you run.
            It tracks what you fail on and deploys those exact weaknesses against you next time.
          </p>
          <div className={styles.adaptiveGrid}>
            <div className={styles.adaptiveCard}>
              <span className={styles.adaptiveNum}>01</span>
              <p className={styles.adaptiveTitle}>WEAKNESS FINGERPRINT</p>
              <p className={styles.adaptiveDesc}>Tracks your average logic, evidence, and originality scores across every debate. The opponent targets your weakest dimension from round one.</p>
            </div>
            <div className={styles.adaptiveCard}>
              <span className={styles.adaptiveNum}>02</span>
              <p className={styles.adaptiveTitle}>FALLACY MEMORY</p>
              <p className={styles.adaptiveDesc}>If you repeat the same logical fallacies — hasty generalisation, appeal to authority, straw man — the AI names them explicitly and deploys pressure on those patterns.</p>
            </div>
            <div className={styles.adaptiveCard}>
              <span className={styles.adaptiveNum}>03</span>
              <p className={styles.adaptiveTitle}>OBJECTION MEMORY</p>
              <p className={styles.adaptiveDesc}>In Sales Gym, every objection you fail to handle gets recorded. Next session, those objections come up earlier, harder, and more frequently.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OSS block ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.ossBlock}>
            <div className={styles.ossLeft}>
              <p className={styles.sectionLabel}>OPEN SOURCE</p>
              <h2 className={styles.ossTitle}>Self-host it.<br />Own your data.</h2>
              <p className={styles.ossSub}>
                MIT licensed. Bring your own API key — OpenRouter, OpenAI, Groq, or any
                OpenAI-compatible endpoint. Your debate history stays on your machine.
              </p>
              <div className={styles.ossPoints}>
                <div className={styles.ossPoint}><span>—</span> Node.js 18+ · React 18 · Socket.IO</div>
                <div className={styles.ossPoint}><span>—</span> SQLite database, zero external services</div>
                <div className={styles.ossPoint}><span>—</span> Docker support included</div>
                <div className={styles.ossPoint}><span>—</span> MIT licence — fork, modify, distribute</div>
              </div>
            </div>
            <div className={styles.ossRight}>
              <div className={styles.codeBlock}>
                <p className={styles.codeComment}># clone and run in 3 commands</p>
                <p className={styles.codeLine}><span className={styles.codePrompt}>$</span> git clone https://github.com/Priyansh10ff/Argument-Gym</p>
                <p className={styles.codeLine}><span className={styles.codePrompt}>$</span> npm run install:all</p>
                <p className={styles.codeLine}><span className={styles.codePrompt}>$</span> npm run dev</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>READY TO LOSE THE FIRST ROUND?</h2>
          <p className={styles.ctaSub}>Most people are. That's the point.</p>
          <button className={styles.ctaPrimary} onClick={handleEnterClick}>
            ENTER THE GYM →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <span className={styles.footerBrand}>🥊 ARGUMENT GYM</span>
          <span className={styles.footerMeta}>Open Source · MIT License</span>
        </div>
      </footer>
    </div>
  );
}
