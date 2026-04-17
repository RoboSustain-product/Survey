-- ============================================================
-- RoboSustain Research Survey — Supabase SQL Schema
-- Run this in your Supabase project → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Section 1: The Basics
  q1           smallint NOT NULL CHECK (q1 BETWEEN 0 AND 3),   -- role: 0=Engineer,1=Owner,2=Researcher,3=Enthusiast
  q2           smallint NOT NULL CHECK (q2 BETWEEN 1 AND 5),   -- sustainability knowledge slider
  q3           smallint NOT NULL CHECK (q3 BETWEEN 0 AND 3),   -- smart-app usage

  -- Section 2: Reality Check (Likert 0=SA,1=A,2=N,3=D,4=SD)
  q4           smallint NOT NULL CHECK (q4 BETWEEN 0 AND 4),   -- inspection cost burden
  q5           smallint NOT NULL CHECK (q5 BETWEEN 0 AND 4),   -- hidden leaks/cracks
  q6           smallint NOT NULL CHECK (q6 BETWEEN 0 AND 4),   -- energy waste / no monitoring
  q7           smallint NOT NULL CHECK (q7 BETWEEN 0 AND 4),   -- thermal camera cost
  q8           smallint NOT NULL CHECK (q8 BETWEEN 0 AND 4),   -- eco-material availability

  -- Section 3: Smart Solutions (Likert 0=SA,1=A,2=N,3=D,4=SD)
  q9           smallint NOT NULL CHECK (q9 BETWEEN 0 AND 4),   -- low-cost thermal alternative
  q10          smallint NOT NULL CHECK (q10 BETWEEN 0 AND 4),  -- real-time dashboard value
  q11          smallint NOT NULL CHECK (q11 BETWEEN 0 AND 4),  -- AI fault diagnosis
  q12          smallint NOT NULL CHECK (q12 BETWEEN 0 AND 4),  -- defect location report
  q13          smallint NOT NULL CHECK (q13 BETWEEN 0 AND 4),  -- DIY guidance preference
  q14          smallint NOT NULL CHECK (q14 BETWEEN 0 AND 4),  -- localized eco-material recs
  q15          smallint NOT NULL CHECK (q15 BETWEEN 0 AND 4),  -- solar-powered robots

  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (anonymous survey)
CREATE POLICY "Public insert" ON responses
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to SELECT (dashboard reads)
CREATE POLICY "Public read" ON responses
  FOR SELECT TO anon USING (true);

-- Index for chronological dashboard queries
CREATE INDEX IF NOT EXISTS responses_created_at_idx ON responses (created_at DESC);
