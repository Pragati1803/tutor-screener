import { useState } from 'react';
import WelcomePage from './pages/WelcomePage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

const VIEWS = { WELCOME: 'welcome', INTERVIEW: 'interview', RESULTS: 'results' };

export default function App() {
  const [view, setView] = useState(VIEWS.WELCOME);
  const [candidate, setCandidate] = useState(null);
  const [assessment, setAssessment] = useState(null);

  function handleStart(info) {
    setCandidate(info);
    setView(VIEWS.INTERVIEW);
  }

  function handleComplete(assessmentData, cand) {
    setAssessment(assessmentData);
    setCandidate(cand);
    setView(VIEWS.RESULTS);
  }

  function handleRestart() {
    setView(VIEWS.WELCOME);
    setCandidate(null);
    setAssessment(null);
  }

  return (
    <div className="app">
      {view === VIEWS.WELCOME && <WelcomePage onStart={handleStart} />}
      {view === VIEWS.INTERVIEW && (
        <InterviewPage candidate={candidate} onComplete={handleComplete} />
      )}
      {view === VIEWS.RESULTS && (
        <ResultsPage assessment={assessment} candidate={candidate} onRestart={handleRestart} />
      )}
    </div>
  );
}
