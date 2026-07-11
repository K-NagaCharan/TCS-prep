import React from 'react';
import { Play, Settings, History, BarChart3, HelpCircle, CheckCircle2, AlertCircle, Trash2, Award } from 'lucide-react';

export default function Dashboard({ history, settings, onStartExam, onOpenSettings, onViewAttempt, onClearHistory }) {
  const keysConfigured = settings.keyA && settings.keyB;

  // Calculate averages
  const totalAttempts = history.length;
  
  const getAverage = (key, max) => {
    if (totalAttempts === 0) return 0;
    const sum = history.reduce((acc, attempt) => acc + (attempt.scores[key] || 0), 0);
    return Math.round((sum / totalAttempts) * 10) / 10;
  };

  const avgSC = getAverage('sentence_completion', 20);
  const avgPR = getAverage('passage_recall', 40);
  const avgEmail = getAverage('email', 100);

  // SVG Trend Chart Data Calculation
  const renderTrendChart = () => {
    if (totalAttempts < 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', color: 'var(--text-muted)' }}>
          <BarChart3 size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p style={{ fontSize: '0.875rem' }}>Complete 2 or more attempts to view progress trends.</p>
        </div>
      );
    }

    const width = 500;
    const height = 160;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // We track percentage overall score (SC % + PR % + Email %) / 3
    const getPercent = (attempt) => {
      const scPct = (attempt.scores.sentence_completion / 20) * 100;
      const prPct = (attempt.scores.passage_recall / 40) * 100;
      const emailPct = (attempt.scores.email / 100) * 100;
      return (scPct + prPct + emailPct) / 3;
    };

    const points = history.slice(-7).map((attempt, index) => {
      const x = padding + (index / (Math.min(7, totalAttempts) - 1)) * chartWidth;
      const pct = getPercent(attempt);
      const y = padding + chartHeight - (pct / 100) * chartHeight;
      return { x, y, score: Math.round(pct), date: new Date(attempt.date).toLocaleDateString() };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeDasharray="3,3" />
        <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="var(--border-color)" strokeDasharray="3,3" />
        <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="var(--border-color)" />
        
        {/* Y Axis Labels */}
        <text x={padding - 5} y={padding + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">100%</text>
        <text x={padding - 5} y={padding + chartHeight / 2 + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">50%</text>
        <text x={padding - 5} y={padding + chartHeight + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">0%</text>

        {/* Line Path */}
        <path d={pathData} fill="none" stroke="url(#chartGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Area fill */}
        <path d={`${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`} 
              fill="url(#areaGrad)" />

        {/* Data Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--primary)" stroke="var(--bg-secondary)" strokeWidth="2" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600">
              {p.score}%
            </text>
            <text x={p.x} y={padding + chartHeight + 15} textAnchor="middle" fill="var(--text-muted)" fontSize="8">
              Attempt {history.length - points.length + i + 1}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* API Key Status Notice */}
      {!keysConfigured ? (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--warning-light)',
          border: '1px solid var(--warning)',
          borderRadius: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertCircle style={{ color: 'var(--warning)', shrink: 0, marginTop: '0.125rem' }} />
            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>API Keys Required</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Please configure Key A (Generator) and Key B (Evaluator) in settings before starting an exam.
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ borderColor: 'var(--warning)', color: 'var(--text-primary)' }} onClick={onOpenSettings}>
            <Settings size={16} /> Setup Keys
          </button>
        </div>
      ) : (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--success-light)',
          border: '1px solid var(--success)',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--success)'
        }}>
          <CheckCircle2 size={16} />
          Dual Groq keys (A: Generator & B: Evaluator) active. Ready to practice!
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(124, 58, 237, 0.08))',
        border: '1px solid var(--primary-light)',
        padding: '2.5rem 2rem',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ flex: '1 1 500px' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
            Master TCS NQT Verbal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '580px', marginBottom: '1.5rem' }}>
            Simulate the exact 2026 NQT Verbal Ability exam interface. Get graded by an independent AI evaluator with strict corporate rubrics.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={onStartExam} disabled={!keysConfigured} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              <Play size={18} fill="white" /> Start Practice Exam
            </button>
            <button className="btn btn-secondary" onClick={onOpenSettings} style={{ padding: '0.75rem 1.25rem' }}>
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', width: '120px', height: '120px', boxShadow: 'var(--card-shadow)' }}>
          <Award size={64} style={{ color: 'var(--primary)', opacity: 0.8 }} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-3">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Mock Exams</span>
          <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>{totalAttempts}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>completed attempts</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sentence Completion Avg</span>
          <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>{totalAttempts > 0 ? `${avgSC}/20` : '—'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {totalAttempts > 0 ? `${Math.round((avgSC/20)*100)}% average score` : 'no attempts yet'}
          </span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Passage & Email Avg</span>
          <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>
            {totalAttempts > 0 ? `${avgPR}/40 | ${avgEmail}/100` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {totalAttempts > 0 ? 'recall & email writing stats' : 'no attempts yet'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="grid-cols-2">
        {/* Historical Attempts Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <History size={18} style={{ color: 'var(--primary)' }} />
              Attempt History
            </h3>
            {totalAttempts > 0 && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--danger-light)', color: 'var(--danger)' }}
                onClick={onClearHistory}
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '250px' }}>
            {totalAttempts === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '2rem 0' }}>
                <History size={24} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.875rem' }}>No practice history found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...history].reverse().map((attempt, index) => {
                  const scPct = (attempt.scores.sentence_completion / 20) * 100;
                  const prPct = (attempt.scores.passage_recall / 40) * 100;
                  const emailPct = (attempt.scores.email / 100) * 100;
                  const scorePct = Math.round((scPct + prPct + emailPct) / 3);

                  return (
                    <div 
                      key={attempt.id} 
                      className="card card-hover" 
                      style={{ 
                        padding: '0.75rem 1rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                      onClick={() => onViewAttempt(attempt)}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Attempt #{totalAttempts - index}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(attempt.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                          {attempt.overall_note || 'No notes generated.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {scorePct}%
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {attempt.scores.sentence_completion}/20 | {attempt.scores.passage_recall}/40 | {attempt.scores.email}/100
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Progress Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', margin: 0 }}>
            <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
            Progress Trend
          </h3>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderTrendChart()}
          </div>
        </div>
      </div>

    </div>
  );
}
