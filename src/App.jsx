import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, AlertTriangle, RefreshCw, Sparkles, ClipboardCheck } from 'lucide-react';

import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import ExamEngine from './components/ExamEngine';
import ResultsView from './components/ResultsView';

import { generatePaper, evaluatePaper } from './utils/groq';

export default function App() {
  // --- Persistent Settings State ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tcs_nqt_settings');
    const defaultSettings = {
      keyA: import.meta.env.VITE_GROQ_KEY_A || '',
      keyB: import.meta.env.VITE_GROQ_KEY_B || '',
      modelA: import.meta.env.VITE_GROQ_MODEL_A || 'llama-3.3-70b-versatile',
      modelB: import.meta.env.VITE_GROQ_MODEL_B || 'llama-3.3-70b-versatile'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        keyA: parsed.keyA || defaultSettings.keyA,
        keyB: parsed.keyB || defaultSettings.keyB,
        modelA: parsed.modelA || defaultSettings.modelA,
        modelB: parsed.modelB || defaultSettings.modelB
      };
    }
    return defaultSettings;
  });

  // --- Historical Attempts State ---
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('tcs_nqt_history');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Theme State ---
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('tcs_nqt_theme');
    return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  // --- Core Navigation View State ---
  // 'dashboard' | 'settings' | 'generating_paper' | 'exam' | 'grading_exam' | 'results'
  const [currentView, setCurrentView] = useState('dashboard');
  
  // --- Active Exam / Review States ---
  const [activePaper, setActivePaper] = useState(null);
  const [activeAnswers, setActiveAnswers] = useState({
    sentence_completion: {},
    passage_recall: {},
    email_writing: ''
  });
  
  // Exam Engine steps state
  const [examState, setExamState] = useState({
    activeSection: 'sentence_completion', // 'sentence_completion' | 'passage_recall' | 'email_writing'
    activeIndex: 0,
    activePhase: null, // 'reading' | 'writing'
    endTimestamp: null
  });

  // Results Review State
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // --- Error Handling State ---
  const [apiError, setApiError] = useState(null); // { message, type: 'generation' | 'grading' }

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tcs_nqt_theme', theme);
  }, [theme]);

  // Load In-Progress Exam (Crash Recovery) on mount
  useEffect(() => {
    const inProgress = localStorage.getItem('tcs_nqt_in_progress');
    if (inProgress === 'true') {
      try {
        const paper = JSON.parse(localStorage.getItem('tcs_nqt_active_paper'));
        const answers = JSON.parse(localStorage.getItem('tcs_nqt_active_answers'));
        const examState = JSON.parse(localStorage.getItem('tcs_nqt_active_state'));
        
        if (paper && answers && examState) {
          // If the timer is still valid or it's email, restore it
          // Note: If the timestamp has passed, the ExamEngine will handle it instantly on load.
          setActivePaper(paper);
          setActiveAnswers(answers);
          setExamState(examState);
          setCurrentView('exam');
        }
      } catch (err) {
        console.error('Failed to restore in-progress exam state:', err);
        clearInProgressExam();
      }
    }
  }, []);

  // Save in-progress details on changes to prevent work loss
  const saveInProgressExam = (paper, answers, state) => {
    localStorage.setItem('tcs_nqt_in_progress', 'true');
    localStorage.setItem('tcs_nqt_active_paper', JSON.stringify(paper));
    localStorage.setItem('tcs_nqt_active_answers', JSON.stringify(answers));
    localStorage.setItem('tcs_nqt_active_state', JSON.stringify(state));
  };

  const clearInProgressExam = () => {
    localStorage.removeItem('tcs_nqt_in_progress');
    localStorage.removeItem('tcs_nqt_active_paper');
    localStorage.removeItem('tcs_nqt_active_answers');
    localStorage.removeItem('tcs_nqt_active_state');
  };

  // Save Settings Helper
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('tcs_nqt_settings', JSON.stringify(newSettings));
  };

  // Toggle Theme Helper
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- Step 1: Start Exam (Call Key A) ---
  const handleStartExam = async () => {
    setApiError(null);
    setCurrentView('generating_paper');
    
    // Gather last 5 attempts vocabulary words and email recipient roles to avoid repeating
    const exclusions = [];
    history.slice(-5).forEach(attempt => {
      if (attempt.paper?.sentence_completion) {
        attempt.paper.sentence_completion.forEach(q => {
          if (q.acceptable_answers) {
            q.acceptable_answers.forEach(word => {
              const lowerWord = word.trim().toLowerCase();
              if (lowerWord && !exclusions.includes(lowerWord)) {
                exclusions.push(lowerWord);
              }
            });
          }
        });
      }
      if (attempt.paper?.email_writing?.recipient_role && !exclusions.includes(attempt.paper.email_writing.recipient_role.toLowerCase())) {
        exclusions.push(attempt.paper.email_writing.recipient_role.toLowerCase());
      }
    });

    try {
      const paper = await generatePaper(settings.keyA, settings.modelA, exclusions);
      
      const initialAnswers = {
        sentence_completion: {},
        passage_recall: {},
        email_writing: ''
      };
      
      const initialExamState = {
        activeSection: 'sentence_completion',
        activeIndex: 0,
        activePhase: null,
        endTimestamp: Date.now() + 25 * 1000 // 25s for Q1
      };

      setActivePaper(paper);
      setActiveAnswers(initialAnswers);
      setExamState(initialExamState);
      
      saveInProgressExam(paper, initialAnswers, initialExamState);
      setCurrentView('exam');
    } catch (err) {
      console.error('Paper generation failed:', err);
      setApiError({
        message: err.message || 'Network connectivity loss or invalid API Key A.',
        type: 'generation'
      });
    }
  };

  // --- Step 2: Handle Answer Updates (Keystroke Auto-Save) ---
  const handleAnswerChange = (section, questionId, value) => {
    setActiveAnswers(prev => {
      const updated = { ...prev };
      if (section === 'email_writing') {
        updated.email_writing = value;
      } else {
        updated[section] = {
          ...updated[section],
          [questionId]: value
        };
      }
      // Write to LocalStorage directly on keypress
      saveInProgressExam(activePaper, updated, examState);
      return updated;
    });
  };

  // --- Step 3: Handle Exam UI Navigation changes (Timer ticks, phase changes) ---
  const handleExamStateChange = (updatedStateFields) => {
    setExamState(prev => {
      const updated = { ...prev, ...updatedStateFields };
      saveInProgressExam(activePaper, activeAnswers, updated);
      return updated;
    });
  };

  // --- Step 4: Submit Exam (Call Key B) ---
  const handleSubmitExam = async () => {
    setApiError(null);
    setCurrentView('grading_exam');

    try {
      // Evaluate paper using Key B
      const report = await evaluatePaper(settings.keyB, settings.modelB, activePaper, activeAnswers);
      
      // Calculate final scores
      const scScore = report.sentence_completion_results.reduce((acc, r) => acc + r.score, 0);
      const prScore = report.passage_recall_results.reduce((acc, r) => acc + r.score, 0);
      const emailScore = report.email_result.score;

      const newAttempt = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        scores: {
          sentence_completion: scScore,
          passage_recall: prScore,
          email: emailScore
        },
        overall_note: report.summary?.overall_note || 'Grading completed.',
        paper: activePaper,
        answers: activeAnswers,
        report: report
      };

      const updatedHistory = [...history, newAttempt];
      setHistory(updatedHistory);
      localStorage.setItem('tcs_nqt_history', JSON.stringify(updatedHistory));
      
      // Select for display on the results screen
      setSelectedAttempt(newAttempt);
      clearInProgressExam();
      setCurrentView('results');
    } catch (err) {
      console.error('Paper evaluation failed:', err);
      setApiError({
        message: err.message || 'Evaluation failed. Please double check Key B or connectivity.',
        type: 'grading'
      });
    }
  };

  // Clear History
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire practice exam history? This cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem('tcs_nqt_history');
    }
  };

  // View Historical Report
  const handleViewAttempt = (attempt) => {
    setSelectedAttempt(attempt);
    setCurrentView('results');
  };

  // Data Sanitation: Strip correct answers, required points, and explanations before passing paper props
  const getSanitizedPaper = () => {
    if (!activePaper) return null;
    
    return {
      paper_id: activePaper.paper_id,
      sentence_completion: activePaper.sentence_completion.map(q => ({
        id: q.id,
        sentence: q.sentence,
        difficulty: q.difficulty
      })),
      passage_recall: activePaper.passage_recall.map(q => ({
        id: q.id,
        paragraph: q.paragraph
      })),
      email_writing: activePaper.email_writing
    };
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-group">
          <ClipboardCheck className="logo-icon" size={24} />
          <h1 className="logo-text">TCS NQT Verbal Practice Portal</h1>
        </div>
        <div className="nav-controls">
          <button className="btn-icon-only" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {currentView === 'dashboard' && (
            <button className="btn btn-secondary" onClick={() => setCurrentView('settings')}>
              <SettingsIcon size={16} /> Settings
            </button>
          )}
        </div>
      </header>

      {/* Main Routing Views */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {currentView === 'dashboard' && (
          <Dashboard
            history={history}
            settings={settings}
            onStartExam={handleStartExam}
            onOpenSettings={() => setCurrentView('settings')}
            onViewAttempt={handleViewAttempt}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {/* Paper Generator Loading Screen */}
        {currentView === 'generating_paper' && (
          <div className="card text-center animate-fade-in" style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            {!apiError ? (
              <>
                <Sparkles size={48} className="logo-icon spin" style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'inline-block' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Generating Custom Exam Paper...</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Calling Key A to create a fresh set of sentence completions, passage recall items, and email scenarios. This takes 10-15 seconds...
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--danger)', marginBottom: '1rem', alignItems: 'center' }}>
                  <AlertTriangle size={32} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Generation Failed</h3>
                </div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  An error occurred while compiling your mock exam:
                </p>
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  {apiError.message}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>
                    Return to Dashboard
                  </button>
                  <button className="btn btn-primary" onClick={handleStartExam}>
                    <RefreshCw size={14} /> Retry Generation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exam Running Engine */}
        {currentView === 'exam' && activePaper && (
          <ExamEngine
            paper={getSanitizedPaper()} // Sanitized fields passed!
            answers={activeAnswers}
            activeSection={examState.activeSection}
            activeIndex={examState.activeIndex}
            activePhase={examState.activePhase}
            endTimestamp={examState.endTimestamp}
            onAnswerChange={handleAnswerChange}
            onStateChange={handleExamStateChange}
            onSubmitExam={handleSubmitExam}
          />
        )}

        {/* Evaluator Grading Loading Screen */}
        {currentView === 'grading_exam' && (
          <div className="card text-center animate-fade-in" style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            {!apiError ? (
              <>
                <RefreshCw size={48} className="logo-icon spin" style={{ color: 'var(--secondary)', marginBottom: '1.5rem', display: 'inline-block' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Assessing Your Answers...</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Calling Key B to run structured rubrics on spelling, paragraph recall metrics, and corporate email structure. This takes 10-15 seconds...
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--danger)', marginBottom: '1rem', alignItems: 'center' }}>
                  <AlertTriangle size={32} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Evaluation Failed</h3>
                </div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  An error occurred during evaluation of your answers:
                </p>
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                  {apiError.message}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => {
                    // Let them go back to the exam state which is saved in local storage
                    setCurrentView('exam');
                  }}>
                    Back to Exam
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmitExam}>
                    <RefreshCw size={14} /> Retry Evaluation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {currentView === 'results' && selectedAttempt && (
          <ResultsView
            paper={selectedAttempt.paper}
            answers={selectedAttempt.answers}
            report={selectedAttempt.report}
            onBack={() => {
              setSelectedAttempt(null);
              setCurrentView('dashboard');
            }}
          />
        )}

      </main>

      <footer style={{ marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        TCS NQT Verbal Ability Prep Tool &bull; Powered by Groq APIs (Dual Key Setup)
      </footer>
    </div>
  );
}
