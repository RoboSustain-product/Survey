# RoboSustain — Full-Stack Setup Guide

## Stack
| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 18 + Tailwind (via CSS vars) |
| Animations  | Framer Motion 11              |
| Charts      | Recharts 2                    |
| Icons       | Lucide React                  |
| Backend     | Supabase (Postgres + Realtime)|

---

## Step 1 — Create Supabase Project

1. Go to https://supabase.com → **New Project**
2. Name it `robosustain`, choose a region, set a DB password → **Create project**
3. Wait ~2 minutes for the project to provision

---

## Step 2 — Run the SQL Schema

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `schema.sql`
3. Click **Run** (green button)

You should see: `Success. No rows returned.`

---

## Step 3 — Get your API Keys

1. Supabase sidebar → **Project Settings** → **API**
2. Copy:
   - **Project URL** → e.g. `https://abcdefgh.supabase.co`
   - **anon public** key → long JWT string

---

## Step 4 — Configure Environment

```bash
# In the project root:
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON=your_anon_public_key_here
```

---

## Step 5 — Install Dependencies & Run

```bash
# Install all packages (run once)
npm install

# Start development server
npm start
```

App opens at **http://localhost:3000**

---

## Step 6 — Deploy (optional)

### Vercel (recommended)
```bash
npm install -g vercel
vercel
# Add env vars in Vercel dashboard → Settings → Environment Variables
```

### Netlify
```bash
npm run build
# Drag the build/ folder into Netlify drop zone
# Add env vars in Netlify → Site settings → Environment variables
```

---

## Project File Structure

```
robosustain/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Survey.jsx       # 15-question conversational survey
│   │   └── Dashboard.jsx    # Live Supabase-powered admin dashboard
│   ├── lib/
│   │   └── SupabaseClient.js
│   ├── App.js               # Root app with view routing
│   ├── index.js             # React entry point
│   └── index.css            # Global styles & design tokens
├── schema.sql               # Supabase table definition
├── .env.example             # Template for credentials
└── package.json
```

---

## Dashboard Features

| Module               | Description                                              |
|----------------------|----------------------------------------------------------|
| Zero State           | Pulsing robot animation when no data exists              |
| Total Respondents    | Live counter with real-time subscription                 |
| Sector Distribution  | Donut chart (Engineers / Owners / Researchers / Eco-Tech)|
| Problem Heatmap      | Horizontal bar chart sorted by agreement %, heat-gradient|
| Solutions Agreement  | Blue horizontal bars for all Section 3 questions         |
| Response Timeline    | Line chart grouping submissions by day                   |
| AI Trend Analysis    | Auto-generated insight text from live aggregations       |

---

## Survey Question Map

| Q  | Section          | Type    | Supabase Column |
|----|------------------|---------|-----------------|
| 1  | The Basics       | Choice  | q1              |
| 2  | The Basics       | Slider  | q2              |
| 3  | The Basics       | Choice  | q3              |
| 4  | Reality Check    | Likert  | q4              |
| 5  | Reality Check    | Likert* | q5  (X-Ray)     |
| 6  | Reality Check    | Likert* | q6  (Thermal)   |
| 7  | Reality Check    | Likert  | q7              |
| 8  | Reality Check    | Likert  | q8              |
| 9  | Smart Solutions  | Likert  | q9              |
| 10 | Smart Solutions  | Likert  | q10             |
| 11 | Smart Solutions  | Likert  | q11             |
| 12 | Smart Solutions  | Likert  | q12             |
| 13 | Smart Solutions  | Likert  | q13             |
| 14 | Smart Solutions  | Likert  | q14             |
| 15 | Smart Solutions  | Likert  | q15             |

Likert encoding: **0 = Strongly Agree, 4 = Strongly Disagree**

---

## Realtime Architecture

Supabase Realtime is enabled via `postgres_changes` subscription in `Dashboard.jsx`. Every new `INSERT` on the `responses` table is pushed live to all open dashboard sessions — no polling required.
