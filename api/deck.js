// REFERENCE IMPLEMENTATION — generate your own with the Phase 5C prompt first.
// Use this to debug or compare if your generated version isn't working.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { dealTitle, clientName, contactName, valueInr, proposalBody } = req.body

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
            content: 'You are structuring a consulting proposal into presentation slides. Return ONLY valid JSON. No markdown fences, no explanation, no preamble.',
          },
          {
            role: 'user',
            content: `Structure this proposal into exactly 5 slides. Return this exact JSON shape:
{
  "slides": [
    { "number": 1, "type": "title", "title": "...", "subtitle": "...", "presenter": "..." },
    { "number": 2, "type": "content", "title": "The Situation", "bullets": ["...","...","..."] },
    { "number": 3, "type": "content", "title": "Our Approach", "bullets": ["...","...","..."] },
    { "number": 4, "type": "content", "title": "Team & Timeline", "bullets": ["...","...","..."] },
    { "number": 5, "type": "cta", "title": "Investment & Next Steps", "bullets": ["...","..."], "closing": "..." }
  ]
}

Client: ${clientName} | Contact: ${contactName}
Engagement: ${dealTitle} | Value: ₹${(valueInr / 100000).toFixed(1)}L
${proposalBody}`,
          },
        ],
      }),
    })

    const data = await response.json()
    const raw = data.choices[0].message.content
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const { slides } = JSON.parse(cleaned)

    return res.status(200).json({ success: true, slides })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
