# Engagement OS

## What this is
Engagement OS — a full-stack internal tool for Meridian Advisory, a boutique strategy
consulting firm. Manages the full client lifecycle: deals (CRM) → won deals become
projects → project tasks tracked → proposals sent → autonomous morning agent monitors.

## Tech stack
- Frontend: single index.html (vanilla JS + Supabase JS SDK + Chart.js + jsPDF + PptxGenJS, all from CDN)
- API routes: Vercel serverless functions in /api/ directory
  - api/intake.js — deal intake chatbot (AI interviews salesperson, produces structured brief)
  - api/chat.js — NLP queries via OpenRouter
  - api/proposal.js — proposal generation using the brief + Resend email
  - api/deck.js — PowerPoint deck structuring via OpenRouter
  - api/agent.js — morning triage agent + Telegram alert
- Database: Supabase (PostgreSQL)
- Email: Resend
- NLP / LLM: OpenRouter (claude-sonnet-4.6 for all LLM calls)
- Deployment: Vercel (static frontend + serverless functions + cron job)

## Database schema
Tables: clients, contacts, deals, projects, tasks, activity_log
Key relationship: when a deal is marked Won, a project row is created client-side
using the Supabase JS SDK — no server endpoint needed for this operation.

## Voice
When generating proposals or client-facing content: read voice.md for the writing style.

## Environment variables
SUPABASE_URL, SUPABASE_ANON_KEY — returned to the browser via api/config.js (public by design; never hardcoded in index.html)
SUPABASE_SERVICE_KEY — api/ routes only, never in index.html
OPENROUTER_API_KEY — api/ routes only
RESEND_API_KEY — api/proposal.js only
TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID — api/agent.js only

## Important
process.env.* must NEVER appear in index.html — the browser cannot read it.
index.html fetches /api/config on boot to get the Supabase URL and anon key.
All secrets live in .env.local locally and in Vercel environment variables in production.
