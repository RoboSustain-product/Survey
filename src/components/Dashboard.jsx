// src/components/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  LineChart, Line,
} from 'recharts';
import { supabase } from '../lib/SupabaseClient';

/* ── Palette ──────────────────────────────────────────────── */
const LIME   = '#32ff7e';
const LIME2  = '#1acd5f';
const BLUE   = '#3b82f6';
const SLATE  = '#475569';
const AMBER  = '#f59e0b';

const PIE_COLORS   = [LIME, '#06b6d4', '#a78bfa', '#fb923c'];
const HEATMAP_LOW  = '#1e3a5a';   // cool slate
const HEATMAP_HIGH = LIME;

/* ── Helpers ──────────────────────────────────────────────── */
const ROLES   = ['Engineer / Contractor', 'Property Owner / Manager', 'Researcher / Student', 'Eco-Tech Enthusiast'];
const BARRIERS = [
  { key: 'q4', label: 'Inspection Cost Burden' },
  { key: 'q5', label: 'Hidden Leaks & Cracks' },
  { key: 'q6', label: 'Energy Waste (No Monitoring)' },
  { key: 'q7', label: 'Thermal Camera Cost' },
  { key: 'q8', label: 'Eco-Material Availability' },
];
const SOLUTIONS = [
  { key: 'q9',  label: 'Low-Cost Thermal Alt.' },
  { key: 'q10', label: 'Real-Time Dashboard' },
  { key: 'q11', label: 'AI Fault Diagnosis' },
  { key: 'q12', label: 'Defect Location Report' },
  { key: 'q13', label: 'DIY Guidance' },
  { key: 'q14', label: 'Eco-Material Recs' },
  { key: 'q15', label: 'Solar-Powered Robots' },
];

function lerp(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff; const ag = (ah >> 8) & 0xff; const ab_ = ah & 0xff;
  const br = (bh >> 16) & 0xff; const bg = (bh >> 8) & 0xff; const bb_ = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b_ = Math.round(ab_ + (bb_ - ab_) * t);
  return `rgb(${r},${g},${b_})`;
}

function agreementScore(rows, key) {
  // SA=4pts, A=3, N=2, D=1, SD=0 — normalized 0-100
  const vals = rows.filter(r => r[key] !== undefined && r[key] !== null);
  if (!vals.length) return 0;
  const total = vals.reduce((s, r) => s + (4 - r[key]), 0);
  return Math.round((total / (vals.length * 4)) * 100);
}

/* ── Custom Tooltip ───────────────────────────────────────── */
function EcoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0d2040', border: '1px solid rgba(50,255,126,0.25)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: LIME, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {p.name}: <span style={{ color: '#e2f0ff' }}>{p.value}{p.unit || ''}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#0d2040', border: '1px solid rgba(50,255,126,0.25)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: d.payload.fill, fontWeight: 700 }}>{d.name}</p>
      <p style={{ color: '#e2f0ff', fontFamily: 'var(--font-mono)' }}>{d.value} respondents</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{d.payload.pct}% of total</p>
    </div>
  );
}

/* ── Zero State ───────────────────────────────────────────── */
function ZeroState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(50,255,126,0.2)', animation: 'ping 2s ease-out infinite' }}/>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(50,255,126,0.08)', border: '1px solid rgba(50,255,126,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          🤖
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Waiting for first response...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Complete the survey to see live data populate here.</p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: LIME, opacity: 0.4, animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

/* ── Metric Card ──────────────────────────────────────────── */
function MetricCard({ label, value, sub, color = LIME, icon }) {
  return (
    <div className="rs-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 48, opacity: 0.06, pointerEvents: 'none' }}>{icon}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard({ onShowSurvey }) {
  const [rows, setRows]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from('responses').select('*').order('created_at', { ascending: true });
    if (!error && data) setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Real-time subscription
    const channel = supabase
      .channel('responses-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' }, (payload) => {
        setRows(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  /* ── Compute chart data ─────────────────────────────────── */
  const n = rows.length;

  // Sector distribution
  const sectorCounts = ROLES.map((label, i) => ({
    name: label, value: rows.filter(r => r.q1 === i).length,
    fill: PIE_COLORS[i],
    pct: n ? Math.round((rows.filter(r => r.q1 === i).length / n) * 100) : 0,
  }));

  // Problem heatmap — sorted descending
  const barrierData = BARRIERS.map(({ key, label }) => ({
    label, score: agreementScore(rows, key),
  })).sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...barrierData.map(d => d.score), 1);
  const barrierWithColor = barrierData.map(d => ({
    ...d,
    color: lerp(HEATMAP_LOW, HEATMAP_HIGH, d.score / maxScore),
  }));

  // Solutions sentiment
  const solutionData = SOLUTIONS.map(({ key, label }) => ({
    label, score: agreementScore(rows, key),
  })).sort((a, b) => b.score - a.score);

  // Avg knowledge level
  const avgKnowledge = n ? (rows.reduce((s, r) => s + (r.q2 || 1), 0) / n).toFixed(1) : '—';

  // Responses over time (group by date)
  const byDate = rows.reduce((acc, r) => {
    const d = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const timelineData = Object.entries(byDate).map(([date, count]) => ({ date, count })).slice(-14);

  // Top barrier
  const topBarrier = barrierData[0];

  // AI Verdict
  const engPct = n ? Math.round((rows.filter(r => r.q1 === 0).length / n) * 100) : 0;
  const dashScore = agreementScore(rows, 'q10');
  const costScore = agreementScore(rows, 'q7');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column' }} className="grid-bg">

      {/* Nav */}
      <nav style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: LIME, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#050d1a' }}>RS</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
            <span style={{ color: 'var(--text-primary)' }}>Robo</span><span style={{ color: LIME }}>Sustain</span>
          </span>
          <div className="rs-badge rs-badge-blue" style={{ marginLeft: 4 }}>Admin Dashboard</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live pulse indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 7, height: 7, background: LIME, borderRadius: '50%', animation: 'pulse 1.4s infinite' }}/>
            Live · {n} {n === 1 ? 'response' : 'responses'}
          </div>
          <button className="rs-btn rs-btn-ghost" onClick={onShowSurvey} style={{ fontSize: 13, padding: '8px 16px' }}>
            ← Back to Survey
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, padding: '2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading data…
          </div>
        )}

        {!loading && n === 0 && <ZeroState />}

        {!loading && n > 0 && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* ── Metric Cards ────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <MetricCard icon="👥" label="Total Respondents" value={n} sub="Real submissions" color={LIME}/>
                <MetricCard icon="📊" label="Avg. Knowledge Score" value={`${avgKnowledge}/5`} sub="Sustainability literacy" color="#a78bfa"/>
                <MetricCard icon="🔥" label="Top Barrier" value="" sub={topBarrier?.label || '—'} color={AMBER}/>
                <MetricCard icon="📈" label="Dashboard Agreement" value={`${dashScore}%`} sub="Real-time dashboard need" color={BLUE}/>
              </div>

              {/* ── Row 1: Pie + Heatmap ────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Donut Chart */}
                <div className="rs-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                    Sector Distribution
                  </h3>
                  {/* Custom legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
                    {sectorCounts.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, flexShrink: 0 }}/>
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: d.fill, fontWeight: 600 }}>{d.value}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, width: 32, textAlign: 'right' }}>{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: 'relative', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="limePie" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={LIME}/>
                            <stop offset="100%" stopColor={LIME2}/>
                          </linearGradient>
                        </defs>
                        <Pie
                          data={sectorCounts} cx="50%" cy="50%"
                          innerRadius={60} outerRadius={95}
                          paddingAngle={3} dataKey="value"
                          animationBegin={0} animationDuration={800}
                        >
                          {sectorCounts.map((d, i) => (
                            <Cell key={i} fill={i === 0 ? 'url(#limePie)' : d.fill} stroke="#0d2040" strokeWidth={2}/>
                          ))}
                        </Pie>
                        <ReTooltip content={<PieTooltip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: LIME, lineHeight: 1 }}>{n}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>total</div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Heatmap Bar Chart */}
                <div className="rs-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    Problem Heatmap — Top Barriers
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: '1.25rem' }}>
                    Agreement score (SA=100%, SD=0%) · sorted by intensity
                  </p>
                  <div style={{ position: 'relative', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barrierWithColor} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                        <CartesianGrid horizontal={false} stroke="rgba(50,100,160,0.1)" strokeDasharray="3 3"/>
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                          tick={{ fill: '#4a6583', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="label" width={130}
                          tick={{ fill: '#8facc8', fontSize: 11 }} axisLine={false} tickLine={false}/>
                        <ReTooltip content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div style={{ background: '#0d2040', border: '1px solid rgba(50,255,126,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                              <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
                              <p style={{ fontFamily: 'var(--font-mono)', color: LIME, fontWeight: 700 }}>
                                Agreement: {payload[0].value}%
                              </p>
                            </div>
                          ) : null
                        }/>
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} animationBegin={200} animationDuration={900}>
                          {barrierWithColor.map((d, i) => (
                            <Cell key={i} fill={d.color}/>
                          ))}
                          <LabelList dataKey="score" position="right"
                            formatter={v => `${v}%`}
                            style={{ fill: '#8facc8', fontSize: 10, fontFamily: 'var(--font-mono)' }}/>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Gradient legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Low</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${HEATMAP_LOW}, ${HEATMAP_HIGH})` }}/>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>High</span>
                  </div>
                </div>
              </div>

              {/* ── Row 2: Solutions + Timeline ──────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Solutions Agreement Bar */}
                <div className="rs-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: '0.25rem' }}>
                    Smart Solutions — Agreement
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: '1.25rem' }}>Feature appetite by agreement score</p>
                  <div style={{ position: 'relative', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={solutionData} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                        <CartesianGrid horizontal={false} stroke="rgba(50,100,160,0.1)" strokeDasharray="3 3"/>
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                          tick={{ fill: '#4a6583', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="label" width={130}
                          tick={{ fill: '#8facc8', fontSize: 11 }} axisLine={false} tickLine={false}/>
                        <ReTooltip content={<EcoTooltip/>}/>
                        <Bar dataKey="score" name="Agreement" fill={BLUE} radius={[0, 4, 4, 0]} animationBegin={300} animationDuration={900}>
                          <LabelList dataKey="score" position="right"
                            formatter={v => `${v}%`}
                            style={{ fill: '#8facc8', fontSize: 10, fontFamily: 'var(--font-mono)' }}/>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Response timeline */}
                <div className="rs-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: '0.25rem' }}>
                    Response Timeline
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: '1.25rem' }}>Daily submission count (last 14 days)</p>
                  <div style={{ position: 'relative', height: 200 }}>
                    {timelineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={LIME2}/>
                              <stop offset="100%" stopColor={LIME}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(50,100,160,0.1)" strokeDasharray="3 3"/>
                          <XAxis dataKey="date" tick={{ fill: '#4a6583', fontSize: 10 }} axisLine={false} tickLine={false}/>
                          <YAxis allowDecimals={false} tick={{ fill: '#4a6583', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false}/>
                          <ReTooltip content={<EcoTooltip/>}/>
                          <Line type="monotone" dataKey="count" name="Responses" stroke="url(#lineGrad)" strokeWidth={2.5} dot={{ fill: LIME, r: 4 }} activeDot={{ r: 6, stroke: '#0d2040', strokeWidth: 2 }}/>
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Not enough data yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── AI Verdict ────────────────────────────────────── */}
              <div style={{ background: 'linear-gradient(135deg, #071a0d 0%, #0d2040 100%)', border: '1px solid rgba(50,255,126,0.18)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                  <div style={{ width: 38, height: 38, background: 'rgba(50,255,126,0.1)', border: '1px solid rgba(50,255,126,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: LIME, fontSize: 15 }}>AI Trend Analysis</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Auto-generated from live response patterns</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span className="rs-badge rs-badge-lime">Live</span>
                  </div>
                </div>
                <div style={{ borderLeft: `3px solid ${LIME}`, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  <p>
                    <strong style={{ color: LIME }}>{engPct}%</strong> of respondents are engineers or property owners — confirming RoboSustain's primary addressable market.
                  </p>
                  <p>
                    Cost barriers dominate concern: <strong style={{ color: LIME }}>{costScore}% agreement</strong> on thermal camera affordability validates strong demand for the low-cost robotic alternative.
                  </p>
                  <p>
                    <strong style={{ color: LIME }}>{dashScore}%</strong> agreement on real-time dashboard value — prioritize this in the next product sprint.
                  </p>
                  {topBarrier && (
                    <p>
                      Top barrier identified: <strong style={{ color: AMBER }}>"{topBarrier.label}"</strong> with a <strong style={{ color: AMBER }}>{topBarrier.score}%</strong> agreement score — lead with this pain point in all marketing messaging.
                    </p>
                  )}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
