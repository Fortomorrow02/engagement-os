// Returns the public Supabase config to the browser.
// The anon key is designed to be public — Supabase's security model relies on RLS, not key secrecy.
// The service key never leaves the server (see api/chat.js, api/agent.js etc.).

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  res.json({
    supabaseUrl:     process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  })
}
