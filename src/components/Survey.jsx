// src/components/Survey.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/SupabaseClient';

/* ── Questions definition ─────────────────────────────────── */
const SECTIONS = ['The Basics', 'Reality Check', 'Smart Solutions'];

const QUESTIONS = [
  // ── Section 1: The Basics ─────────────────────────────────
  {
    id: 1, section: 0, type: 'choice',
    text: 'What is your primary connection to the building or tech world?',
    visual: { icon: '🏗️', label: 'Select your role below' },
    options: [
      { icon: '🔧', label: 'Engineer / Contractor' },
      { icon: '🏠', label: 'Property Owner / Manager' },
      { icon: '🎓', label: 'Researcher / Student' },
      { icon: '🌿', label: 'Eco-Tech Enthusiast' },
    ],
  },
  {
    id: 2, section: 0, type: 'slider',
    text: 'How familiar are you with "Green & Sustainable Building" concepts?',
    visual: { icon: '🌱', label: 'Drag the slider to rate your knowledge' },
    min: 1, max: 5,
    sliderLabels: ['Newbie 🌱', 'Expert 🌳'],
    valueLabels: ['Just getting started', 'Some basic knowledge', 'Fairly knowledgeable', 'Very experienced', 'Domain expert'],
  },
  {
    id: 3, section: 0, type: 'choice',
    text: 'Have you ever used smart apps to monitor energy or building maintenance?',
    visual: { icon: '📱', label: 'Smart monitoring apps on mobile' },
    options: [
      { icon: '📊', label: 'Regularly' },
      { icon: '🔔', label: 'Occasionally' },
      { icon: '💡', label: 'Never, but interested' },
      { icon: '✖️', label: 'Not interested' },
    ],
  },
  // ── Section 2: Reality Check ──────────────────────────────
  {
    id: 4, section: 1, type: 'likert',
    text: 'Periodic building inspections are a major financial burden.',
    visual: { icon: '💰', label: 'Financial burden of periodic inspections' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 5, section: 1, type: 'likert', special: 'xray',
    text: '"Hidden leaks or structural cracks are nearly impossible to find early with traditional methods."',
    visual: { icon: '🔍', label: 'Hidden structural cracks behind walls — hover to reveal' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 6, section: 1, type: 'likert', special: 'thermal',
    text: 'The lack of real-time monitoring leads to massive energy waste.',
    visual: { icon: '🌡️', label: 'Heat escaping from windows (thermal view)' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 7, section: 1, type: 'likert',
    text: 'High costs of thermal cameras prevent regular building check-ups.',
    visual: { icon: '📷', label: 'Expensive thermal imaging equipment' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 8, section: 1, type: 'likert',
    text: '"It\'s hard to find high-quality, eco-friendly repair materials locally."',
    visual: { icon: '🌿', label: 'Eco-friendly materials are hard to find' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  // ── Section 3: Smart Solutions ────────────────────────────
  {
    id: 9, section: 2, type: 'likert',
    text: 'How important is a low-cost alternative for thermal building diagnostics?',
    visual: { icon: '🤖', label: 'Low-cost robot vs expensive thermal camera' },
    scale: ['Crucial', 'Not Important'],
  },
  {
    id: 10, section: 2, type: 'likert',
    text: '"A real-time dashboard for building health would speed up my maintenance decisions."',
    visual: { icon: '📈', label: 'Real-time building health dashboard' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 11, section: 2, type: 'likert',
    text: 'Automated fault diagnosis (AI) is a major leap in facility management.',
    visual: { icon: '🧠', label: 'AI brain connected to building blueprint' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 12, section: 2, type: 'likert',
    text: 'A report identifying the exact location and distance of a defect would be valuable.',
    visual: { icon: '📍', label: 'Defect location with distance measurement' },
    scale: ['Very Helpful', 'Not Helpful'],
  },
  {
    id: 13, section: 2, type: 'likert',
    text: '"I prefer clear, step-by-step DIY guidance for fixing building issues correctly."',
    visual: { icon: '📋', label: 'Step-by-step DIY repair guidance' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
  {
    id: 14, section: 2, type: 'likert',
    text: 'Would you like to see localized recommendations for green repair materials?',
    visual: { icon: '🗺️', label: 'Nearby verified eco-material stores' },
    scale: ['Yes, definitely', 'Not really'],
  },
  {
    id: 15, section: 2, type: 'likert',
    text: 'Using solar-powered robots makes the inspection system more reliable.',
    visual: { icon: '☀️', label: 'Solar-powered inspection robot' },
    scale: ['Strongly Agree', 'Strongly Disagree'],
  },
];

const LIKERT_LABELS = ['SA', 'A', 'N', 'D', 'SD'];
const LIKERT_FULL   = ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }),
};

/* ── X-Ray Visual ─────────────────────────────────────────── */
function XRayVisual() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', background: '#0d1f35', border: '1px dashed #1e3a5a',
        borderRadius: 10, padding: '14px', cursor: 'crosshair', overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        🔍 Hover to reveal hidden structural cracks
      </div>
      <svg viewBox="0 0 320 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="320" height="90" fill="#0d1a2e"/>
        <rect x="10" y="8" width="90" height="74" fill="#112240" rx="3" stroke="#1e3a5a" strokeWidth="1"/>
        <rect x="115" y="8" width="90" height="74" fill="#112240" rx="3" stroke="#1e3a5a" strokeWidth="1"/>
        <rect x="220" y="8" width="90" height="74" fill="#112240" rx="3" stroke="#1e3a5a" strokeWidth="1"/>
        {hovered && (
          <g style={{ transition: 'opacity 0.5s' }}>
            <polyline points="42,14 38,34 46,42 36,74" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeDasharray="4,2" strokeLinecap="round"/>
            <text x="50" y="45" fill="#ef4444" fontSize="9" fontFamily="monospace">CRACK</text>
            <polyline points="158,18 162,38 154,50 160,78" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="3,2" strokeLinecap="round"/>
            <text x="166" y="42" fill="#f59e0b" fontSize="9" fontFamily="monospace">LEAK</text>
            <polyline points="258,22 255,42 263,55 258,76" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeDasharray="4,2" strokeLinecap="round"/>
            <text x="266" y="52" fill="#ef4444" fontSize="9" fontFamily="monospace">CRACK</text>
          </g>
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: hovered ? 'rgba(239,68,68,0.04)' : 'transparent', borderRadius: 10, transition: 'background 0.4s', pointerEvents: 'none' }}/>
    </div>
  );
}

/* ── Thermal Visual ───────────────────────────────────────── */
function ThermalVisual() {
  return (
    <div style={{
      background: 'linear-gradient(90deg,#0d1b2a,#1a3a5c,#1e6091,#5c4a1e,#8b3a1e,#c0392b,#f39c12)',
      borderRadius: 10, padding: '14px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        background: 'rgba(5,13,26,0.55)', borderRadius: 7, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'radial-gradient(circle, #f39c12 30%, #c0392b 70%)',
          boxShadow: '0 0 12px rgba(243,156,18,0.6)',
        }}/>
        <span style={{ fontSize: 12, color: '#fef3c7' }}>Heat escaping from windows (thermal view)</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8, padding: '0 4px' }}>
        {['#1a3a5c','#1e6091','#5c4a1e','#8b3a1e','#c0392b','#f39c12'].map((c,i) => (
          <div key={i} style={{ flex: 1, height: 4, background: c, borderRadius: 2 }}/>
        ))}
        <span style={{ fontSize: 9, color: '#fef3c7', alignSelf: 'center', marginLeft: 4 }}>°C</span>
      </div>
    </div>
  );
}

/* ── Slider Input ─────────────────────────────────────────── */
function SliderInput({ q, value, onChange }) {
  const leaves = ['🌱', '🌿', '🍀', '🌳', '🌲'];
  const sizes  = [18, 22, 26, 30, 34];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: sizes[value - 1], transition: 'font-size 0.3s ease', lineHeight: 1 }}>
          {leaves[value - 1]}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lime)', fontSize: 20, fontWeight: 700 }}>
          {value}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {q.valueLabels[value - 1]}
        </span>
      </div>
      <input
        type="range" min={q.min} max={q.max} step="1" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--lime)', height: 6, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{q.sliderLabels[0]}</span>
        <span>{q.sliderLabels[1]}</span>
      </div>
    </div>
  );
}

/* ── Choice Input ─────────────────────────────────────────── */
function ChoiceInput({ q, value, onChange }) {
  return (
    <div className="choice-grid">
      {q.options.map((opt, i) => {
        const sel = value === i;
        return (
          <button
            key={i} onClick={() => onChange(i)}
            style={{
              background: sel ? 'rgba(50,255,126,0.1)' : 'var(--bg-card-2)',
              border: `1.5px solid ${sel ? 'var(--lime)' : 'var(--border)'}`,
              color: sel ? 'var(--lime)' : 'var(--text-primary)',
              padding: '14px 16px', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontFamily: 'var(--font-body)', textAlign: 'left',
              cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
            onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--slate)'; }}
            onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <span style={{ fontSize: 18 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Likert Input ─────────────────────────────────────────── */
function LikertInput({ q, value, onChange }) {
  const colors = ['#32ff7e', '#7dd87e', '#64748b', '#f97316', '#ef4444'];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{q.scale[0]}</span>
        <span>{q.scale[1]}</span>
      </div>
      <div className="likert-grid">
        {LIKERT_LABELS.map((label, i) => {
          const sel = value === i;
          return (
            <button
              key={i} onClick={() => onChange(i)}
              style={{
                padding: '12px 4px', borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13,
                background: sel ? `${colors[i]}1a` : 'var(--bg-card-2)',
                border: `1.5px solid ${sel ? colors[i] : 'var(--border)'}`,
                color: sel ? colors[i] : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.18s ease',
              }}
              title={LIKERT_FULL[i]}
              onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = colors[i] + '77'; e.currentTarget.style.color = colors[i] + 'aa'; } }}
              onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {value !== undefined && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--lime)', fontFamily: 'var(--font-mono)' }}>
          Selected: {LIKERT_FULL[value]}
        </div>
      )}
    </div>
  );
}

/* ── Main Survey Component ────────────────────────────────── */
export default function Survey({ onShowDashboard }) {
  const [screen, setScreen]   = useState('welcome'); // welcome | survey | thankyou
  const [qIdx, setQIdx]       = useState(0);
  const [dir, setDir]         = useState(1);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState(null);

  const q = QUESTIONS[qIdx];
  const pct = Math.round((Object.keys(answers).length / 15) * 100);
  const answered = answers[q?.id] !== undefined;

  const goNext = useCallback(async () => {
    if (qIdx < QUESTIONS.length - 1) {
      setDir(1); setQIdx(i => i + 1);
    } else {
      // Submit to Supabase
      setSubmitting(true); setError(null);
      const payload = {};
      QUESTIONS.forEach(q => { payload[`q${q.id}`] = answers[q.id] ?? 0; });
      const { error: err } = await supabase.from('responses').insert([payload]);
      setSubmitting(false);
      if (err) { setError('Submission failed. Please try again.'); return; }
      setScreen('thankyou');
    }
  }, [qIdx, answers]);

  const goPrev = useCallback(() => {
    if (qIdx > 0) { setDir(-1); setQIdx(i => i - 1); }
  }, [qIdx]);

  const setAnswer = (val) => setAnswers(prev => ({ ...prev, [q.id]: val }));

  const sectionIdx = q?.section ?? 0;

  /* ── Welcome Screen ─────────────────────────────────────── */
  if (screen === 'welcome') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }} className="grid-bg">

      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(50,255,126,0.07) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      {/* Nav */}
      <nav style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#050d1a' }}>RS</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
            <span style={{ color: 'var(--text-primary)' }}>Robo</span>
            <span style={{ color: 'var(--lime)' }}>Sustain</span>
          </span>
        </div>
        <button className="rs-btn rs-btn-ghost" onClick={onShowDashboard} style={{ fontSize: 13, padding: '8px 16px' }}>
          Admin Dashboard →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '3rem 2rem', maxWidth: 1100, margin: '0 auto', width: '100%', gap: '3rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <motion.div style={{ flex: 1, minWidth: 280 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="rs-badge rs-badge-lime" style={{ marginBottom: '1.5rem' }}>
            <span style={{ width: 6, height: 6, background: 'var(--lime)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
            Research Survey 2026
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Help us Shape the<br/>
            <span style={{ color: 'var(--lime)' }}>Future</span> of Smart &<br/>
            <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--lime)', textUnderlineOffset: 6 }}>Sustainable Buildings</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: 480, fontSize: 15 }}>
            Buildings that <strong style={{ color: 'var(--text-primary)' }}>think, save, and protect.</strong> Your insights power the next generation of AI-driven eco-tech diagnostics.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>⏱ ~1 minute</span><span>·</span><span>15 questions</span><span>·</span><span>Anonymous</span>
          </div>
          <motion.button
            className="rs-btn rs-btn-primary"
            onClick={() => { setScreen('survey'); setQIdx(0); setAnswers({}); }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            style={{ fontSize: 16, padding: '14px 32px' }}
          >
            Let's Start (1 Min) →
          </motion.button>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>★ No sign-up required</span>
            <span>🔒 100% anonymous</span>
            <span>📊 Research purposes only</span>
          </div>
        </motion.div>

        {/* Illustration card */}
        <motion.div
          style={{ flex: '0 0 340px', maxWidth: 360 }}
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rs-card-lime"
        >
          <div style={{ padding: '1.75rem' }}>
            <svg viewBox="0 0 300 200" width="100%" xmlns="http://www.w3.org/2000/svg">
              {/* Building */}
              <rect x="70" y="80" width="160" height="115" fill="#0d2040" stroke="#1e3a5a" strokeWidth="1.5" rx="2"/>
              <polygon points="70,80 150,25 230,80" fill="#112240" stroke="#32ff7e" strokeWidth="1.5"/>
              {/* Windows */}
              {[[82,95],[120,95],[158,95],[82,128],[120,128],[158,128]].map(([x,y],i)=>(
                <rect key={i} x={x} y={y} width="28" height="20" fill={i%2===0?'#0d2a40':'rgba(50,255,126,0.12)'} stroke={i%2===0?'#1e3a5a':'#32ff7e'} strokeWidth="1" rx="1"/>
              ))}
              {/* Door */}
              <rect x="121" y="158" width="38" height="37" fill="#0a1a2e" stroke="#1e3a5a" strokeWidth="1" rx="1"/>
              {/* Solar panels */}
              <rect x="95" y="40" width="36" height="16" fill="#0d2a4a" stroke="#2563eb" strokeWidth="1" rx="1"/>
              <rect x="136" y="33" width="36" height="16" fill="#0d2a4a" stroke="#2563eb" strokeWidth="1" rx="1"/>
              <rect x="177" y="40" width="30" height="14" fill="#0d2a4a" stroke="#2563eb" strokeWidth="1" rx="1"/>
              {/* Robot */}
              <rect x="16" y="140" width="34" height="36" fill="#0d2040" stroke="#32ff7e" strokeWidth="1.5" rx="5"/>
              <rect x="20" y="128" width="26" height="17" fill="#0d2040" stroke="#32ff7e" strokeWidth="1.5" rx="4"/>
              <circle cx="28" cy="136" r="3.5" fill="#32ff7e"/>
              <circle cx="38" cy="136" r="3.5" fill="#32ff7e"/>
              <rect x="8"  y="148" width="10" height="3.5" fill="#32ff7e" rx="1.5"/>
              <rect x="52" y="148" width="10" height="3.5" fill="#32ff7e" rx="1.5"/>
              <rect x="22" y="176" width="10" height="12" fill="#32ff7e" rx="1.5"/>
              <rect x="38" y="176" width="10" height="12" fill="#32ff7e" rx="1.5"/>
              {/* Signal */}
              <circle cx="33" cy="118" r="2.5" fill="#32ff7e" opacity="0.8"/>
              <circle cx="33" cy="109" r="2.5" fill="#32ff7e" opacity="0.5"/>
              <circle cx="33" cy="100" r="2.5" fill="#32ff7e" opacity="0.3"/>
              {/* Scan lines */}
              <line x1="260" y1="95" x2="230" y2="105" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
              <line x1="265" y1="115" x2="230" y2="120" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.65"/>
              <line x1="260" y1="135" x2="230" y2="132" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
            </svg>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: '1rem' }}>
              {[['847+','Responses'],['94%','Completion'],['23','Countries'],['4.8/5','Satisfaction']].map(([v,l])=>(
                <div key={l} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-lime)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--lime)', fontSize: 18, fontWeight: 700 }}>{v}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features strip */}
      <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: '1.25rem' }}>Why Your Input Matters</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
            {[
              { e: '🤖', t: 'AI Thermal Diagnostics', d: 'Low-cost robotic scanning replaces expensive thermal cameras for building health checks.' },
              { e: '📊', t: 'Real-Time Dashboard', d: 'Live PWA tracks building health, defect locations, and maintenance schedules.' },
              { e: '🌿', t: 'Eco-Material Finder', d: 'Localized recommendations for verified green repair materials near your building.' },
              { e: '☀️', t: 'Solar-Powered Robots', d: 'Autonomous inspection robots that run on solar energy for uninterrupted operation.' },
            ].map(({ e, t, d }) => (
              <div key={t} style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{e}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Thank You Screen ────────────────────────────────────── */
  if (screen === 'thankyou') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} className="grid-bg">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 64, marginBottom: '1rem', animation: 'floatY 3s ease-in-out infinite' }}>🤖</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1rem', fontSize: 28 }}>🌍 🤖</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3 }}>
          Thank you! You've just helped<br/>RoboSustain build a <span style={{ color: 'var(--lime)' }}>smarter, greener world.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
          Your 15 responses have been recorded and will directly shape the future of AI-powered sustainable building diagnostics.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[['15','Answers given'],['100%','Anonymous'],['✓','Impact made']].map(([v,l])=>(
            <div key={l} className="rs-card" style={{ padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--lime)' }}>{v}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button className="rs-btn rs-btn-primary" onClick={onShowDashboard} whileHover={{ scale: 1.04 }}>
            View Live Dashboard
          </motion.button>
          <button className="rs-btn rs-btn-ghost" onClick={() => { setScreen('welcome'); setAnswers({}); setQIdx(0); }}>
            Take Again
          </button>
        </div>
      </motion.div>
    </div>
  );

  /* ── Survey Screen ────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column' }} className="grid-bg">

      {/* Progress header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <span>{Object.keys(answers).length} of 15 answered</span>
            <span style={{ color: 'var(--lime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pct}% complete</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
            <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #1acd5f, #32ff7e)', borderRadius: 2 }}/>
          </div>
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SECTIONS.map((s, i) => {
              const done = i < sectionIdx;
              const active = i === sectionIdx;
              return (
                <span key={s} style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: active ? 'var(--lime)' : done ? 'transparent' : 'transparent',
                  color: active ? '#050d1a' : done ? 'var(--lime)' : 'var(--text-muted)',
                  border: active ? 'none' : done ? '1px solid var(--lime-border)' : '1px solid var(--border)',
                }}>
                  {done ? '✓ ' : ''}{s}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={q.id}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ width: '100%', maxWidth: 680 }}
          >
            <div className="rs-card" style={{ padding: '2rem' }}>
              {/* Section badge */}
              <div className="rs-badge rs-badge-blue" style={{ marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, marginRight: 2 }}>{q.id}</span>
                {SECTIONS[q.section]}
              </div>

              {/* Question text */}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem,3vw,1.4rem)', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                {q.text}
              </h2>

              {/* Visual cue */}
              <div style={{ marginBottom: '1.5rem' }}>
                {q.special === 'xray'    && <XRayVisual />}
                {q.special === 'thermal' && <ThermalVisual />}
                {!q.special && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '8px 14px',
                  }}>
                    <span style={{ fontSize: 20 }}>{q.visual.icon}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{q.visual.label}</span>
                  </div>
                )}
              </div>

              {/* Input */}
              {q.type === 'choice' && <ChoiceInput q={q} value={answers[q.id]} onChange={setAnswer}/>}
              {q.type === 'slider' && <SliderInput q={q} value={answers[q.id] ?? 1} onChange={setAnswer}/>}
              {q.type === 'likert' && <LikertInput q={q} value={answers[q.id]} onChange={setAnswer}/>}

              {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 13 }}>{error}</p>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {qIdx > 0 ? (
            <button className="rs-btn rs-btn-ghost" onClick={goPrev} style={{ fontSize: 13, padding: '10px 18px' }}>
              <ChevronLeft size={16}/> Back
            </button>
          ) : (
            <button className="rs-btn rs-btn-ghost" onClick={() => setScreen('welcome')} style={{ fontSize: 13, padding: '10px 18px' }}>
              ← Home
            </button>
          )}

          {/* Dot progress */}
          <div className="dot-track">
            {QUESTIONS.map((qq, i) => (
              <div key={qq.id} className="dot" style={{
                width: i === qIdx ? 20 : 6,
                background: i === qIdx ? 'var(--lime)' : answers[qq.id] !== undefined ? 'var(--lime-dim)' : 'var(--border)',
              }}/>
            ))}
          </div>

          <motion.button
            className="rs-btn rs-btn-primary"
            onClick={goNext}
            disabled={!answered && q.type !== 'slider'}
            style={{ fontSize: 13, padding: '10px 22px', opacity: (!answered && q.type !== 'slider') ? 0.45 : 1 }}
            whileHover={answered || q.type === 'slider' ? { scale: 1.04 } : {}}
            whileTap={answered || q.type === 'slider' ? { scale: 0.97 } : {}}
          >
            {submitting ? 'Submitting…' : qIdx === 14 ? <><Check size={15}/> Submit</> : <>Next <ChevronRight size={15}/></>}
          </motion.button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          Press <kbd style={{ background: 'var(--bg-highlight)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Enter</kbd> to continue
        </div>
      </div>
    </div>
  );
}
