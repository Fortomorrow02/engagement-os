// REFERENCE IMPLEMENTATION — generate your own with the Phase 5B prompt first.
// Use this to debug or compare if your generated version isn't working.

import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { dealTitle, clientName, contactName, contactEmail, valueInr, brief, sendEmail = true } = req.body
    const voice = fs.readFileSync(path.join(process.cwd(), 'voice.md'), 'utf8')

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
            content: `You are a senior partner writing a client proposal email. Apply this writing style exactly: ${voice}\nWrite with confidence and specificity. Never use generic consulting filler phrases. The proposal must reference the specific deliverables and client situation provided — do not invent scope that was not mentioned.\nIMPORTANT: Write plain text only — no markdown, no asterisks, no bold markers, no bullet symbols. Use plain paragraphs separated by blank lines.`,
          },
          {
            role: 'user',
            content: `Write a proposal email for:
Client: ${clientName}
Contact: ${contactName}
Engagement: ${dealTitle}
Investment: ₹${(valueInr / 100000).toFixed(1)}L

Client brief (use this to write specific deliverables — do not generalise):
${brief || 'No brief provided — write a general capabilities introduction.'}

Format exactly as:
Subject: [subject line — specific to this engagement, not generic]

[email body — under 320 words]
[reference at least 2 specific deliverables from the brief by name]
[end with a clear, specific call to action and proposed next step]`,
          },
        ],
      }),
    })

    const data = await response.json()
    const text = data.choices[0].message.content

    const lines = text.split('\n')
    const subjectLine = lines.find(l => l.startsWith('Subject:'))
    const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : `Proposal: ${dealTitle}`
    const blankIndex = lines.findIndex(l => l.trim() === '')
    const rawBody = lines.slice(blankIndex + 1).join('\n').trim()
    const body = rawBody.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')

    const htmlBody = '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#1a1a1a;max-width:600px">' +
      body.split(/\n\n+/).map(p => `<p style="margin:0 0 16px 0">${p.replace(/\n/g, '<br>')}</p>`).join('') +
      '</div>'

    if (sendEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Meridian Advisory <onboarding@resend.dev>',
        to: contactEmail,
        subject,
        text: body,
        html: htmlBody,
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY
    await fetch(`${supabaseUrl}/rest/v1/activity_log`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        entity_type: 'deal',
        action: sendEmail ? 'proposal_sent' : 'proposal_generated',
        notes: sendEmail ? `Emailed to ${contactEmail}` : 'Generated without sending',
      }),
    })

    return res.status(200).json({ success: true, subject, body })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
