import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Aria, a warm and professional AI interviewer for Cuemath — an online math tutoring company. You are conducting a 4-5 question screening interview to assess whether a tutor candidate has the right soft skills for teaching children.

Your job is NOT to test math knowledge. You are assessing:
1. Communication clarity — Can they explain things simply?
2. Warmth & patience — Do they sound caring and encouraging?
3. Ability to simplify — Can they break down complex ideas for a child?
4. English fluency — Is their communication clear and confident?
5. Handling confusion — How do they respond when a student is stuck?

INTERVIEW FLOW:
- Start by warmly introducing yourself and the process
- Ask 4-5 questions from this list (adapt naturally, don't sound robotic):
  * "Can you walk me through how you'd explain fractions to a 9-year-old?"
  * "A student has been stuck on the same problem for 5 minutes and looks frustrated. What do you do?"
  * "Tell me about a time you explained something difficult to someone."
  * "Why do you want to teach math to young kids?"
  * "How do you keep a student engaged when they find a topic boring?"
- Follow up naturally if an answer is vague
- If someone gives a one-word answer, gently probe for more
- Keep responses short — you are speaking aloud
- After all questions, warmly wrap up and say the interview is complete

TONE: Warm, professional, human. Not robotic.
FORMAT: 1-3 sentences max. No bullet points or lists.`;

const ASSESSMENT_PROMPT = `You are an expert hiring assessor for Cuemath. Review this interview transcript and assess the candidate.

For each of these 5 dimensions give a score 1-5, a 1-2 sentence justification, and one short quote from the transcript as evidence:
- clarity (communication clarity)
- warmth (warmth and patience)
- simplification (ability to simplify)
- fluency (English fluency)
- handling_confusion (how they handle confused students)

Also give an overall recommendation: PASS, REVIEW, or REJECT, and a 2-sentence summary.

Respond ONLY in this exact JSON format with no extra text:
{"dimensions":{"clarity":{"score":0,"justification":"","quote":""},"warmth":{"score":0,"justification":"","quote":""},"simplification":{"score":0,"justification":"","quote":""},"fluency":{"score":0,"justification":"","quote":""},"handling_confusion":{"score":0,"justification":"","quote":""}},"recommendation":"","summary":""}`;

console.log('Server starting. API key set:', !!process.env.ANTHROPIC_API_KEY, '| prefix:', process.env.ANTHROPIC_API_KEY?.slice(0,12));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    res.json({ reply: text, stopReason: response.stop_reason });
  } catch (err) {
    console.error('Chat error:', err?.message, '| status:', err?.status);
    res.status(500).json({ error: 'AI service error', detail: err?.message || String(err), status: err?.status });
  }
});

app.post('/api/assess', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript required' });
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: ASSESSMENT_PROMPT,
      messages: [{ role: 'user', content: `Interview transcript:\n\n${transcript}\n\nAssess this candidate.` }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const assessment = JSON.parse(clean);
    res.json(assessment);
  } catch (err) {
    console.error('Assessment error:', err?.message);
    res.status(500).json({ error: 'Assessment failed', detail: err?.message || String(err) });
  }
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', keySet: !!process.env.ANTHROPIC_API_KEY, keyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0,12) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
