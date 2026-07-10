import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, ArrowLeft, RefreshCw, BarChart3, Mail, BookOpen, ChevronRight, CornerDownRight } from 'lucide-react';

export default function ResultsView({ paper, answers, report, onBack }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'sentence_completion' | 'passage_recall' | 'email_writing'

  const { sentence_completion_results, passage_recall_results, email_result, summary } = report;

  // Grade color helper
  const getScoreColor = (pct) => {
    if (pct >= 80) return 'var(--success)';
    if (pct >= 55) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreBg = (pct) => {
    if (pct >= 80) return 'var(--success-light)';
    if (pct >= 55) return 'var(--warning-light)';
    return 'var(--danger-light)';
  };

  // Convert summaries to percentages for scaling
  const scScore = sentence_completion_results.reduce((acc, r) => acc + r.score, 0);
  const prScore = passage_recall_results.reduce((acc, r) => acc + r.score, 0);
  const emailScore = email_result.score;

  const scPct = (scScore / 20) * 100;
  const prPct = (prScore / 40) * 100;
  const emailPct = emailScore;
  const overallPct = Math.round((scPct + prPct + emailPct) / 3);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Exam Evaluation Report</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Paper ID: {paper.paper_id}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          Performance Summary
        </button>
        <button className={`tab-btn ${activeTab === 'sentence_completion' ? 'active' : ''}`} onClick={() => setActiveTab('sentence_completion')}>
          Sentence Completion ({scScore}/20)
        </button>
        <button className={`tab-btn ${activeTab === 'passage_recall' ? 'active' : ''}`} onClick={() => setActiveTab('passage_recall')}>
          Passage Recall ({prScore}/40)
        </button>
        <button className={`tab-btn ${activeTab === 'email_writing' ? 'active' : ''}`} onClick={() => setActiveTab('email_writing')}>
          Email Writing ({emailScore}/100)
        </button>
      </div>

      {/* Tab Content: Summary */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Overall score card */}
          <div className="card" style={{
            background: `linear-gradient(135deg, ${getScoreBg(overallPct)}, var(--bg-secondary))`,
            borderColor: getScoreColor(overallPct),
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            padding: '2.5rem 2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              border: `6px solid ${getScoreColor(overallPct)}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: 'var(--card-shadow)'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(overallPct), lineHeight: 1 }}>
                {overallPct}%
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                Overall
              </span>
            </div>

            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
                <Award style={{ color: getScoreColor(overallPct) }} />
                Readiness Assessment
              </h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                "{summary?.overall_note || 'Grading complete. Review individual sections for detailed feedback.'}"
              </p>
            </div>
          </div>

          {/* Section Breakdown Grid */}
          <div className="grid-cols-3">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sentence Completion</h4>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{scScore} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 20</span></div>
              <div className="progress-bar-bg" style={{ margin: '0.25rem 0' }}>
                <div className="progress-bar-fill" style={{ width: `${scPct}%`, backgroundColor: getScoreColor(scPct) }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', color: getScoreColor(scPct), fontWeight: 600 }}>
                {scPct >= 80 ? 'Excellent Grammar/Vocab' : scPct >= 55 ? 'Moderate Proficiency' : 'Requires Grammar Focus'}
              </span>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Passage Recall</h4>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{prScore} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 40</span></div>
              <div className="progress-bar-bg" style={{ margin: '0.25rem 0' }}>
                <div className="progress-bar-fill" style={{ width: `${prPct}%`, backgroundColor: getScoreColor(prPct) }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', color: getScoreColor(prPct), fontWeight: 600 }}>
                {prPct >= 80 ? 'High-fidelity Recall' : prPct >= 55 ? 'Satisfactory Recall' : 'Weak Memory Retention'}
              </span>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Writing</h4>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{emailScore} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span></div>
              <div className="progress-bar-bg" style={{ margin: '0.25rem 0' }}>
                <div className="progress-bar-fill" style={{ width: `${emailPct}%`, backgroundColor: getScoreColor(emailPct) }}></div>
              </div>
              <span style={{ fontSize: '0.75rem', color: getScoreColor(emailPct), fontWeight: 600 }}>
                {emailPct >= 80 ? 'Corporate Ready Structure' : emailPct >= 55 ? 'Needs Formatting/Tone Polish' : 'Weak Email Mechanics'}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Tab Content: Sentence Completion */}
      {activeTab === 'sentence_completion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {paper.sentence_completion.map((q, idx) => {
            const result = sentence_completion_results.find(r => r.id === q.id) || { score: 0, verdict: 'incorrect', reason: 'Unattempted' };
            const isCorrect = result.score === 1;
            const userAnswer = answers.sentence_completion[q.id] || '—';

            return (
              <div key={q.id} className="card" style={{
                borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                padding: '1.25rem 1.5rem',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Question {idx + 1}
                    <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                      {q.topic_tag}
                    </span>
                  </span>
                  
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                    {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <p style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: '1rem' }}>
                  {q.sentence}
                </p>

                <div className="grid-cols-2" style={{ gap: '1rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Your Answer
                    </span>
                    <span style={{ fontWeight: 600, color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>{userAnswer}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Acceptable Answers
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {q.acceptable_answers.join(' / ')}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Feedback: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{result.reason}</span>
                  {q.explanation && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      <strong>Rule:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content: Passage Recall */}
      {activeTab === 'passage_recall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {paper.passage_recall.map((q, idx) => {
            const result = passage_recall_results.find(r => r.id === q.id) || { score: 0, feedback: 'Unattempted' };
            const userAnswer = answers.passage_recall[q.id] || '—';
            const pct = (result.score / 10) * 100;

            return (
              <div key={q.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Passage {idx + 1}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score:</span>
                    <span className="badge" style={{ backgroundColor: getScoreBg(pct), color: getScoreColor(pct), fontWeight: 700, fontSize: '0.85rem' }}>
                      {result.score} / 10
                    </span>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
                  {/* Original Text */}
                  <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '1rem' }}>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BookOpen size={14} /> Original Paragraph
                    </h5>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {q.paragraph}
                    </p>

                    <div style={{ marginTop: '1rem' }}>
                      <h6 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Key Points Required
                      </h6>
                      <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {q.key_points.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Candidate Answer */}
                  <div className="card" style={{ border: '1px solid var(--border-color)', padding: '1rem' }}>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Your Recall Summary
                    </h5>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.6', fontStyle: userAnswer === '—' ? 'italic' : 'normal' }}>
                      {userAnswer}
                    </p>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Evaluator Feedback:
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    {result.feedback}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content: Email Writing */}
      {activeTab === 'email_writing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
            
            {/* Left: Overall score and Rubric Bars */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: getScoreBg(emailPct),
                  border: `4px solid ${getScoreColor(emailPct)}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: getScoreColor(emailPct) }}>
                    {emailScore}
                  </span>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Email Score Details</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Evaluated on NQT parameters
                  </span>
                </div>
              </div>

              {/* Rubric Breakdown Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                    <span>Structure & Formatting (25%)</span>
                    <span>{email_result.breakdown?.structure || 0} / 25</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '4px', margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${((email_result.breakdown?.structure || 0)/25)*100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                    <span>Element Coverage (30%)</span>
                    <span>{email_result.breakdown?.coverage || 0} / 30</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '4px', margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${((email_result.breakdown?.coverage || 0)/30)*100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                    <span>Tone Appropriateness (15%)</span>
                    <span>{email_result.breakdown?.tone || 0} / 15</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '4px', margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${((email_result.breakdown?.tone || 0)/15)*100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                    <span>Grammar & Spelling (15%)</span>
                    <span>{email_result.breakdown?.grammar || 0} / 15</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '4px', margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${((email_result.breakdown?.grammar || 0)/15)*100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                    <span>Clarity & Conciseness (15%)</span>
                    <span>{email_result.breakdown?.clarity || 0} / 15</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '4px', margin: 0 }}>
                    <div className="progress-bar-fill" style={{ width: `${((email_result.breakdown?.clarity || 0)/15)*100}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Feedback bullets */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Key Observations</h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {email_result.feedback_bullets?.map((bullet, idx) => (
                  <li key={idx} style={{ lineHeight: '1.5' }}>{bullet}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Email Text Area & Recommended sentence */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                Your Submitted Email Draft
              </h4>
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {answers.email_writing || '—'}
              </div>
            </div>

            {email_result.improved_example && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                  Targeted Area for Improvement
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(124, 58, 237, 0.04)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--secondary)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    AI-Recommended Alternate Phrasing (Weakest sentence fix):
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                    <CornerDownRight size={16} style={{ shrink: 0, marginTop: '0.25rem', color: 'var(--secondary)' }} />
                    "{email_result.improved_example}"
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Footer controls */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn btn-primary" onClick={onBack} style={{ padding: '0.75rem 2rem' }}>
          Back to Dashboard
        </button>
      </div>

    </div>
  );
}
