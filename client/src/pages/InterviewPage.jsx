import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { sendMessage, assessInterview } from '../api';

const PHASES = {
  LOADING: 'loading',
  ARIA_SPEAKING: 'aria_speaking',
  WAITING: 'waiting',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  DONE: 'done',
};

export default function InterviewPage({ candidate, onComplete }) {
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [statusText, setStatusText] = useState('Starting your interview…');
  const [liveText, setLiveText] = useState('');
  const [pulseLevel, setPulseLevel] = useState(0);
  const { isListening, isSpeaking, speak, startListening } = useSpeech();
  const isInterviewDone = useRef(false);
  const pulseRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Animate pulse while listening
  useEffect(() => {
    if (isListening) {
      pulseRef.current = setInterval(() => {
        setPulseLevel(Math.random());
      }, 120);
    } else {
      clearInterval(pulseRef.current);
      setPulseLevel(0);
    }
    return () => clearInterval(pulseRef.current);
  }, [isListening]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const ariaSpeak = useCallback((text, afterSpeak) => {
    setPhase(PHASES.ARIA_SPEAKING);
    setStatusText('Aria is speaking…');
    speak(text, afterSpeak);
  }, [speak]);

  const listenToCandidate = useCallback(() => {
    setPhase(PHASES.LISTENING);
    setStatusText('Your turn — speak your answer');
    setLiveText('');

    startListening(
      (result) => {
        setLiveText(result);
      },
      async () => {
        // After recognition ends, get the live text and process
        setPhase(PHASES.PROCESSING);
        setStatusText('Processing…');
      }
    );
  }, [startListening]);

  // When liveText is captured and phase becomes processing
  useEffect(() => {
    if (phase !== PHASES.PROCESSING || !liveText) return;

    const candidateText = liveText;
    setLiveText('');

    const userMsg = { role: 'user', content: candidateText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setTranscript(prev => [...prev, { speaker: 'You', text: candidateText }]);
    setQuestionCount(q => q + 1);

    (async () => {
      try {
        const { reply } = await sendMessage(updatedMessages);
        const assistantMsg = { role: 'assistant', content: reply };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        setTranscript(prev => [...prev, { speaker: 'Aria', text: reply }]);

        const isDone =
          reply.toLowerCase().includes('interview is complete') ||
          reply.toLowerCase().includes('that concludes') ||
          reply.toLowerCase().includes('thank you for your time') ||
          questionCount >= 5;

        if (isDone && !isInterviewDone.current) {
          isInterviewDone.current = true;
          ariaSpeak(reply, async () => {
            setPhase(PHASES.DONE);
            setStatusText('Generating your assessment…');
            const fullTranscript = finalMessages
              .map(m => `${m.role === 'user' ? candidate.name : 'Aria'}: ${m.content}`)
              .join('\n');
            const assessment = await assessInterview(fullTranscript);
            onComplete(assessment, candidate);
          });
        } else {
          ariaSpeak(reply, listenToCandidate);
        }
      } catch (err) {
        console.error(err);
        setStatusText('Something went wrong. Please refresh and try again.');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, liveText]);

  // Initial greeting
  useEffect(() => {
    const initMessages = [
      {
        role: 'user',
        content: `My name is ${candidate.name} and I want to teach ${candidate.role}. Please start the interview with a warm introduction and your first question.`,
      },
    ];

    (async () => {
      try {
        const { reply } = await sendMessage(initMessages);
        const aiMsg = { role: 'assistant', content: reply };
        setMessages([...initMessages, aiMsg]);
        setTranscript([{ speaker: 'Aria', text: reply }]);
        ariaSpeak(reply, listenToCandidate);
      } catch {
        setStatusText('Could not connect to interview server. Check your connection.');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phaseIcon = {
    [PHASES.LOADING]: '⏳',
    [PHASES.ARIA_SPEAKING]: '🔊',
    [PHASES.WAITING]: '💬',
    [PHASES.LISTENING]: '🎙',
    [PHASES.PROCESSING]: '⚙️',
    [PHASES.DONE]: '✅',
  }[phase];

  return (
    <div className="interview-page">
      {/* Left: Aria avatar + status */}
      <div className="aria-panel">
        <div className={`aria-avatar ${isSpeaking ? 'speaking' : ''} ${isListening ? 'dim' : ''}`}>
          <div className="aria-inner">A</div>
          {isSpeaking && (
            <>
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3" />
            </>
          )}
        </div>
        <div className="aria-name">Aria</div>
        <div className="aria-title">AI Interviewer · Cuemath</div>

        <div className="status-pill">
          <span className="status-icon">{phaseIcon}</span>
          <span>{statusText}</span>
        </div>

        {phase === PHASES.LISTENING && (
          <div className="mic-viz">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="mic-bar"
                style={{
                  height: `${12 + Math.random() * pulseLevel * 40}px`,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min((questionCount / 5) * 100, 100)}%` }} />
        </div>
        <div className="progress-label">Question {Math.min(questionCount + 1, 5)} of 5</div>
      </div>

      {/* Right: live transcript */}
      <div className="transcript-panel">
        <div className="transcript-header">Live Transcript</div>
        <div className="transcript-scroll">
          {transcript.map((entry, i) => (
            <div key={i} className={`transcript-entry ${entry.speaker === 'Aria' ? 'aria' : 'candidate'}`}>
              <div className="entry-speaker">{entry.speaker}</div>
              <div className="entry-text">{entry.text}</div>
            </div>
          ))}
          {liveText && (
            <div className="transcript-entry candidate live">
              <div className="entry-speaker">You (live)</div>
              <div className="entry-text">{liveText}<span className="cursor">|</span></div>
            </div>
          )}
          {phase === PHASES.DONE && (
            <div className="transcript-entry system">
              <div className="entry-text">Interview complete. Generating assessment…</div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}
