// REFERENCE IMPLEMENTATION — generate your own with the Phase 4B prompt first.
// Use this to debug or compare if your generated version isn't working.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { query } = req.body
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    }

    const [deals, projects, tasks] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/deals?select=title,stage,value_inr,last_activity_at,clients(name)`, { headers }).then(r => r.json()),
      fetch(`${supabaseUrl}/rest/v1/projects?select=title,status,start_date,end_date,clients(name)`, { headers }).then(r => r.json()),
      fetch(`${supabaseUrl}/rest/v1/tasks?select=title,status,due_date,assignee,projects(title)`, { headers }).then(r => r.json()),
    ])

    const context = [
      '=== DEALS ===',
      deals.map(d =>
        `- ${d.clients?.name} | ${d.title} | ${d.stage} | ₹${(d.value_inr / 100000).toFixed(1)}L | last active: ${new Date(d.last_activity_at).toLocaleDateString('en-IN')}`
      ).join('\n'),
      '\n=== PROJECTS ===',
      projects.map(p =>
        `- ${p.clients?.name} | ${p.title} | ${p.status} | ends ${p.end_date}`
      ).join('\n'),
      '\n=== TASKS ===',
      tasks.map(t =>
        `- ${t.projects?.title} | ${t.title} | ${t.status} | ${t.assignee} | due ${t.due_date}`
      ).join('\n'),
    ].join('\n')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.6',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for Engagement OS, used by Meridian Advisory — a boutique strategy consulting firm.

Answer questions about their deals, projects, tasks, and pipeline. Be direct and specific. Flag urgency when relevant.

Choose the right response format based on the question:

For tabular data (lists of deals, tasks, contacts, stale items):
  Return a brief intro sentence, then a [TABLE] block with CSV headers and rows.
  Example:
  Here are the stale proposals:
  [TABLE]Client,Deal,Value,Days Stale
  Infosys,Digital Transformation Advisory,₹18L,12[/TABLE]

For comparisons or aggregations (stage breakdown, progress by project, task completion):
  Return a brief intro sentence, then a [CHART:bar] block with JSON.
  Example:
  [CHART:bar]{"labels":["Prospect","Proposal Sent","Won","Lost"],"values":[1,2,2,1],"title":"Pipeline by Stage"}[/CHART:bar]

For conversational or summary questions: plain text only.

Today is ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          },
          {
            role: 'user',
            content: `${context}\n\nQuestion: ${query}`,
          },
        ],
      }),
    })

    const data = await response.json()
    return res.status(200).json({ answer: data.choices[0].message.content })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
