const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function sendMessage(messages) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function assessInterview(transcript) {
  const res = await fetch(`${BASE}/api/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) throw new Error('Assessment request failed');
  return res.json();
}
