import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors());
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
  * "Can you walk me through how you'd explain fractions to a 9-year-old who's never heard the term before?"
  * "A student has been stuck on the same problem for 5 minutes and starts to look frustrated. What do you do?"
  * "Tell me about a time you had to explain something difficult to someone. How did you approach it?"
  * "Why do you want to teach math to young kids specifically?"
  * "How do you keep a student engaged when they find a topic boring or too hard?"
- Follow up naturally if an answer is vague — ask for a specific example
- If someone gives a one-word answer, gently probe: "Could you tell me a bit more about that?"
- Keep your questions short and spoken — you are speaking aloud, not writing
- After all questions, warmly wrap up: say the interview is complete and they did great

TONE: Warm, professional, human. Not robotic. Sound like a real interviewer.
FORMAT: Keep all your responses SHORT — 1-3 sentences max. You are speaking out loud. No bullet points, no lists.`;

const ASSESSMENT_PROMPT = `You are an expert hiring assessor for Cuemath, an online math tutoring platform. You have just reviewed a full interview transcript of a tutor candidate.

Assess the candidate on exactly these 5 dimensions. For EACH dimension, give:
- A score from 1-5 (1=poor, 3=adequate, 5=excellent)
- 1-2 sentence justification
- One direct quote from the transcript as evidence (keep it short, under 15 words)

Then give:
- An overall recommendation: PASS, REVIEW, or REJECT
- A 2-sentence summary of the candidate's strengths and weaknesses

Respond ONLY in this exact JSON format:
{
  "dimensions": {
    "clarity": { "score": 0, "justification": "", "quote": "" },
    "warmth": { "score": 0, "justification": "", "quote": "" },
    "simplification": { "score": 0, "justification": "", "quote": "" },
    "fluency": { "score": 0, "justification": "", "quote": "" },
    "handling_confusion": { "score": 0, "justification": "", "quote": "" }
  },
  "recommendation": "",
  "summary": ""
}`;

// Chat endpoint - send a message and get Aria's response
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    res.json({ reply: text, stopReason: response.stop_reason });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'AI service error' });
  }
});

// Assessment endpoint - score the full transcript
app.post('/api/assess', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript required' });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: ASSESSMENT_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is the full interview transcript:\n\n${transcript}\n\nPlease assess this candidate.`,
        },
      ],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const assessment = JSON.parse(clean);
    res.json(assessment);
  } catch (err) {
    console.error('Assessment error:', err);
    res.status(500).json({ error: 'Assessment failed' });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
