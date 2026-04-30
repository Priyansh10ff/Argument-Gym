import React, { useState } from 'react';

const style = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.75rem', padding: '1.25rem', background: 'var(--gray-mid)',
    border: '1px solid var(--gray-light)',
  },
  label: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    letterSpacing: '0.2em', color: 'var(--text-dim)',
  },
  code: {
    fontFamily: 'var(--font-display)', fontSize: '2.5rem',
    color: 'var(--white)', letterSpacing: '0.25em',
  },
  hint: {
    fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center',
  },
  row: { display: 'flex', gap: '0.5rem' },
  btn: {
    background: 'var(--gray)', color: 'var(--white)',
    padding: '0.45rem 1rem', fontSize: '0.75rem',
    letterSpacing: '0.1em', border: '1px solid var(--gray-light)',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  btnActive: {
    background: '#1D9E75', borderColor: '#1D9E75',
  },
};

export default function InviteLink({ roomCode }) {
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}?join=${roomCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Argument Gym — Join my debate!',
          text: `Join my debate room: ${roomCode}`,
          url: link,
        });
      } catch (_) {}
    } else {
      copyLink();
    }
  };

  return (
    <div style={style.wrap}>
      <span style={style.label}>ROOM CODE</span>
      <div style={style.code}>{roomCode}</div>
      <p style={style.hint}>Share this code or link to invite your opponent</p>
      <div style={style.row}>
        <button
          style={{ ...style.btn, ...(copied ? style.btnActive : {}) }}
          onClick={copyCode}
        >
          {copied ? '✓ COPIED' : 'COPY CODE'}
        </button>
        <button style={style.btn} onClick={copyLink}>COPY LINK</button>
        {navigator.share && (
          <button style={style.btn} onClick={share}>SHARE</button>
        )}
      </div>
    </div>
  );
}
