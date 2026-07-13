import React, { useState, useEffect, useRef } from 'react';
import { Timer, ArrowRight, EyeOff, BookOpen, Mail, AlertTriangle, Play } from 'lucide-react';

export default function ExamEngine({
  paper,
  answers,
  activeSection, // 'sentence_completion' | 'passage_recall' | 'email_writing'
  activeIndex, // index within that section
  activePhase, // 'reading' | 'writing' (only for passage_recall)
  endTimestamp, // absolute date timestamp for active timer
  onAnswerChange,
  onStateChange, // to sync navigation states to App (which saves to localStorage)
  onSubmitExam
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const handleTimeoutRef = useRef(null);

  // Keep ref up to date on every render
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  });

  // Timer self-correcting sync
  useEffect(() => {
    if (!endTimestamp) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (handleTimeoutRef.current) {
          handleTimeoutRef.current();
        }
      }
    };

    tick(); // run once immediately
    timerRef.current = setInterval(tick, 200);

    return () => clearInterval(timerRef.current);
  }, [endTimestamp]);

  // Handle auto-submit on timeout
  const handleTimeout = () => {
    if (activeSection === 'sentence_completion') {
      handleNextSentence();
    } else if (activeSection === 'passage_recall') {
      if (activePhase === 'reading') {
        // Transition reading -> writing
        const duration = 90; // 90 seconds writing
        onStateChange({
          activePhase: 'writing',
          endTimestamp: Date.now() + duration * 1000
        });
      } else {
        // Transition writing -> next paragraph reading or next section
        handleNextRecall();
      }
    } else if (activeSection === 'email_writing') {
      // Auto-submit the entire exam on email timeout
      onSubmitExam();
    }
  };

  // Navigations
  const handleNextSentence = () => {
    if (activeIndex < 19) {
      const nextIdx = activeIndex + 1;
      const duration = 25; // 25 seconds per question
      onStateChange({
        activeIndex: nextIdx,
        endTimestamp: Date.now() + duration * 1000
      });
    } else {
      // Move to passage recall Q21 (index 0)
      const duration = 30; // 30 seconds reading for first recall paragraph
      onStateChange({
        activeSection: 'passage_recall',
        activeIndex: 0,
        activePhase: 'reading',
        endTimestamp: Date.now() + duration * 1000
      });
    }
  };

  const handleNextRecall = () => {
    if (activeIndex < 3) {
      const nextIdx = activeIndex + 1;
      const duration = 30; // 30 seconds reading
      onStateChange({
        activeIndex: nextIdx,
        activePhase: 'reading',
        endTimestamp: Date.now() + duration * 1000
      });
    } else {
      // Move to email writing Q25 (index 0)
      const duration = 540; // 9 minutes (540 seconds)
      onStateChange({
        activeSection: 'email_writing',
        activeIndex: 0,
        activePhase: null,
        endTimestamp: Date.now() + duration * 1000
      });
    }
  };

  const startWritingRecall = () => {
    const duration = 90; // 90s writing
    onStateChange({
      activePhase: 'writing',
      endTimestamp: Date.now() + duration * 1000
    });
  };

  // Timer style calculation
  const getTimerClass = (totalDuration) => {
    const percent = timeLeft / totalDuration;
    if (percent <= 0.15 || timeLeft < 5) return 'timer-danger';
    if (percent <= 0.3) return 'timer-warning';
    return 'timer-normal';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Inputs
  const handleTextChange = (e) => {
    if (activeSection === 'sentence_completion') {
      const q = paper.sentence_completion[activeIndex];
      onAnswerChange('sentence_completion', q.id, e.target.value);
    } else if (activeSection === 'passage_recall') {
      const q = paper.passage_recall[activeIndex];
      onAnswerChange('passage_recall', q.id, e.target.value);
    } else if (activeSection === 'email_writing') {
      onAnswerChange('email_writing', paper.email_writing.id, e.target.value);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && activeSection === 'sentence_completion') {
      e.preventDefault();
      handleNextSentence();
    }
  };

  // Redirection/Sections Renderers
  const renderSentenceCompletion = () => {
    const question = paper.sentence_completion[activeIndex];
    const userAnswer = answers.sentence_completion[question.id] || '';
    
    return (
      <div className="card animate-fade-in" style={{ padding: '2rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span className="badge badge-indigo">Question {activeIndex + 1} of 20</span>
          <span className="badge" style={{ textTransform: 'capitalize', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            Difficulty: {question.difficulty}
          </span>
        </div>

        <p style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2rem', lineHeight: '1.8' }}>
          {question.sentence}
        </p>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="sc-answer">Type your answer below:</label>
          <input
            id="sc-answer"
            type="text"
            className="form-input"
            style={{ fontSize: '1.1rem', padding: '0.8rem 1rem' }}
            placeholder="Type single word or short phrase..."
            value={userAnswer}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleNextSentence}>
            {activeIndex < 19 ? 'Next Question' : 'Next Section'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderPassageRecall = () => {
    const paragraphData = paper.passage_recall[activeIndex];
    const userAnswer = answers.passage_recall[paragraphData.id] || '';
    
    if (activePhase === 'reading') {
      return (
        <div className="card animate-fade-in" style={{ padding: '2.5rem 2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span className="badge badge-indigo">Passage {activeIndex + 1} of 4 (Reading Phase)</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
              <BookOpen size={14} /> Read carefully. Will hide in {timeLeft}s
            </span>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderLeft: '4px solid var(--primary)',
            padding: '1.5rem',
            borderRadius: '0 0.5rem 0.5rem 0',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            color: 'var(--text-primary)',
            marginBottom: '2rem'
          }}>
            {paragraphData.paragraph}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Recall details, names, roles, figures, and logic.
            </span>
            <button className="btn btn-primary" onClick={startWritingRecall}>
              Start Writing Now <ArrowRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    // Writing Phase
    return (
      <div className="card animate-fade-in" style={{ padding: '2rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span className="badge badge-indigo" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
            Passage {activeIndex + 1} of 4 (Recall Phase)
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <EyeOff size={14} /> Passage Hidden
          </span>
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="pr-answer">
            Reconstruct the meaning and key details of the paragraph in your own words:
          </label>
          <textarea
            id="pr-answer"
            className="form-input form-textarea"
            style={{ fontSize: '1.05rem', minHeight: '150px' }}
            placeholder="Type your summary from memory..."
            value={userAnswer}
            onChange={handleTextChange}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleNextRecall}>
            {activeIndex < 3 ? 'Next Passage' : 'Next Section'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderEmailWriting = () => {
    const emailData = paper.email_writing;
    const userAnswer = answers.email_writing || '';
    
    return (
      <div className="card animate-fade-in" style={{ padding: '2rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span className="badge badge-indigo">Section 3: Email Writing (Question 25)</span>
          <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', textTransform: 'capitalize' }}>
            Tone: {emailData.tone}
          </span>
        </div>

        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Prompt details panel (Stays visible) */}
          <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Scenario
              </h4>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {emailData.scenario}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Recipient
                </h4>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {emailData.recipient_role}
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Tone
                </h4>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {emailData.tone}
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Required Elements
              </h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {emailData.required_elements.map((el, i) => (
                  <li key={i}>{el}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Length Constraint
              </h4>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                Write between 100 to 150 words.
              </p>
            </div>
          </div>

          {/* Typing Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ flexGrow: 1, margin: 0 }}>
              <label className="form-label" htmlFor="email-editor" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={16} /> Compose Email</span>
              </label>
              <textarea
                id="email-editor"
                className="form-input form-textarea"
                style={{ fontSize: '1rem', flexGrow: 1, minHeight: '300px', height: '100%', fontFamily: 'Courier New, Courier, monospace' }}
                placeholder="To: [Recipient]&#10;Subject: [Clear, concise subject line]&#10;&#10;Dear Sir/Madam,&#10;&#10;[Body of the email...]&#10;&#10;Sincerely,&#10;[Name]"
                value={userAnswer}
                onChange={handleTextChange}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                {(() => {
                  const getWordCount = (text) => {
                    const trimmed = text.trim();
                    if (!trimmed) return 0;
                    return trimmed.split(/\s+/).filter(w => w.length > 0).length;
                  };
                  const count = getWordCount(userAnswer);
                  const isOptimal = count >= 100 && count <= 150;
                  return (
                    <>
                      <span style={{ color: isOptimal ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                        Word Count: {count} / Required 100-150 words
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {count < 100 ? `${100 - count} more words required` : count > 150 ? `${count - 150} words over limit` : 'Length criteria met!'}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
            Ensure you include all required elements before submitting.
          </span>
          <button className="btn btn-primary" onClick={onSubmitExam} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, var(--success), var(--secondary))' }}>
            Submit Exam
          </button>
        </div>
      </div>
    );
  };

  // Section durations for class calculations
  const getSectionDuration = () => {
    if (activeSection === 'sentence_completion') return 25;
    if (activeSection === 'passage_recall') return activePhase === 'reading' ? 30 : 90;
    return 540; // email writing (9 mins)
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header Info Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            {activeSection === 'sentence_completion' && 'Sentence Completion'}
            {activeSection === 'passage_recall' && `Passage Recall (${activePhase === 'reading' ? 'Reading' : 'Writing'})`}
            {activeSection === 'email_writing' && 'Email Writing'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            TCS NQT Verbal Ability Practice Mock
          </span>
        </div>

        {/* Global/Section Timer */}
        <div className={`timer-container ${getTimerClass(getSectionDuration())}`}>
          <Timer size={20} className={timeLeft <= 5 ? 'spin' : ''} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '1.25rem' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Main Section Content Area */}
      <div>
        {activeSection === 'sentence_completion' && renderSentenceCompletion()}
        {activeSection === 'passage_recall' && renderPassageRecall()}
        {activeSection === 'email_writing' && renderEmailWriting()}
      </div>
    </div>
  );
}
