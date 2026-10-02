import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, FlaskConical, Leaf, Lightbulb, ListChecks, Sparkles, Trash2, Waves } from 'lucide-react';
import { accuracy, createFollowUpSession, createLesson, presets, readSessions, saveSession, type StudySession } from './data/lessons';

const queryClient = new QueryClient();

function Shell({ children, current }: { children: ReactNode; current: 'study' | 'progress' }) {
  return <div className="app-shell">
    <aside className="side-rail">
      <div className="brand"><div className="brand-mark"><BookOpen size={17} /></div><span className="brand-name">Study room</span></div>
      <div className="side-label">Your workspace</div>
      <nav aria-label="Main navigation">
        <Link href="/" data-testid="link-study" className={`nav-link ${current === 'study' ? 'active' : ''}`}><BookOpen size={16} />Study session</Link>
        <Link href="/progress" data-testid="link-progress" className={`nav-link ${current === 'progress' ? 'active' : ''}`}><ListChecks size={16} />Your progress</Link>
      </nav>
      <div className="rail-note"><strong>A note on this version</strong>Sessions use a small set of carefully prepared sample lessons. Live AI explanations are not connected.</div>
      <div className="rail-foot">A little understanding, every day.</div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="topbar-caption"><span className="dot" /> Your quiet corner to learn</div><div className="topbar-right"><span>Study at your pace</span><div className="avatar-mark">S</div></div></header>
      {children}
    </div>
  </div>;
}

function Home() {
  const [chosen, setChosen] = useState('');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Just getting started');
  const [session, setSession] = useState<StudySession | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [reviewedConcepts, setReviewedConcepts] = useState<string[]>([]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const knownTopic = presets.some((preset) => preset.topic.toLowerCase() === topic.trim().toLowerCase());
  const startStudy = () => {
    const next = createLesson(chosen || presets.find((preset) => preset.topic.toLowerCase() === topic.trim().toLowerCase())?.topic || '', level);
    if (!next) return;
    setLoading(true);
    window.setTimeout(() => {
      setSession(next);
      setQuestionIndex(0);
      setSelected(null);
      setHasAnswered(false);
      setComplete(false);
      setReviewedConcepts([]);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 380);
  };
  const pickPreset = (name: string) => { setChosen(name); setTopic(name); };
  const saveAnswer = () => {
    if (!session || selected === null) return;
    const answer = { questionIndex, selectedIndex: selected, correct: selected === session.questions[questionIndex].correctIndex };
    const updated = { ...session, answers: [...session.answers.filter((item) => item.questionIndex !== questionIndex), answer] };
    setSession(updated);
    setHasAnswered(true);
  };
  const nextQuestion = () => {
    if (!session) return;
    if (questionIndex === session.questions.length - 1) {
      saveSession(session);
      setComplete(true);
      setToast('Your session is saved on this device.');
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setHasAnswered(false);
  };
  const restart = () => { setSession(null); setComplete(false); setChosen(''); setTopic(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startFollowUp = () => {
    if (!session) return;
    const weakConcepts = session.answers.filter((answer) => !answer.correct).map((answer) => session.questions[answer.questionIndex].concept);
    const next = createFollowUpSession(session, weakConcepts);
    if (!next) return;
    setSession(next);
    setQuestionIndex(0);
    setSelected(null);
    setHasAnswered(false);
    setComplete(false);
    setReviewedConcepts([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const currentQuestion = session?.questions[questionIndex];
  const correctCount = session?.answers.filter((answer) => answer.correct).length ?? 0;

  return <Shell current="study">
    {!session ? <main className="content">
      <div className="intro-row">
        <div><div className="eyebrow">A thoughtful way to study</div><h1 className="page-title">Make sense of<br />something new.</h1><p className="lead">Get a clear explanation, see the idea in action, then try a few questions. No pressure to get it all at once.</p></div>
        <div className="sample-tag"><b>Sample lessons</b>&nbsp; · &nbsp;Prepared, not AI-generated</div>
      </div>
      <div className="notice"><div className="notice-icon"><CircleHelp size={15} /></div><div><strong>Live AI study sessions are not connected yet.</strong>We can’t create a lesson for any topic just yet. Choose one of the prepared sample lessons below to explore the complete study flow.</div></div>
      <div className="section-heading"><h2>Choose a starting point</h2><span>Three sample topics to explore</span></div>
      <div className="preset-grid">
        {presets.map((preset) => {
          const Icon = preset.symbol === 'leaf' ? Leaf : preset.symbol === 'math' ? FlaskConical : Waves;
          return <button type="button" key={preset.topic} data-testid={`button-preset-${preset.topic.toLowerCase().replaceAll(' ', '-')}`} className={`preset-card ${chosen === preset.topic ? 'selected' : ''}`} onClick={() => pickPreset(preset.topic)}>
            <span className="preset-icon"><Icon size={17} /></span><span className="preset-level">{preset.level}</span><span className="preset-title">{preset.topic}</span><span className="preset-desc">{preset.subtitle}</span>
          </button>;
        })}
      </div>
      <div className="entry-panel">
        <div className="entry-copy"><label htmlFor="topic">Topic</label><input id="topic" data-testid="input-topic" className="topic-input" value={topic} onChange={(event) => { setTopic(event.target.value); setChosen(''); }} placeholder="Choose one of the sample topics above" list="topic-options" /><datalist id="topic-options">{presets.map((preset) => <option key={preset.topic} value={preset.topic} />)}</datalist></div>
        <div className="select-wrap"><label htmlFor="level" className="hint" style={{ display: 'block', margin: '0 0 7px', fontWeight: 700, color: '#454b5c' }}>Your level</label><select id="level" data-testid="select-level" className="level-select" value={level} onChange={(event) => setLevel(event.target.value)}><option>Just getting started</option><option>Know a little</option><option>Ready for a challenge</option></select></div>
        <button type="button" className="primary-btn" data-testid="button-start-study" disabled={!knownTopic || loading} onClick={startStudy}>{loading ? 'Preparing lesson…' : <>Start learning <ArrowRight size={15} /></>}</button>
      </div>
      <p className="hint">{topic && !knownTopic ? 'That topic isn’t in the sample set yet. Pick one of the three prepared lessons above.' : 'Your level helps frame the lesson. The sample content stays the same.'}</p>
    </main> : <main className="content">
      <div className="study-layout">
        <section className="study-main">
          <div className="study-heading"><div><div className="eyebrow">{session.followUp ? 'Focused practice' : 'Your study session'} <span style={{ color: '#9a968e' }}>· prepared sample</span></div><h1>{session.topic}</h1><div className="study-meta"><span>{session.level}</span><span>About 5 minutes</span></div></div><button className="text-btn" onClick={restart} data-testid="button-back-to-topics"><ArrowLeft size={14} /> Choose another topic</button></div>
          <article className="study-card"><div className="card-kicker"><span className="card-kicker-icon"><Lightbulb size={15} /></span> The big picture</div><h2>Let’s start with the idea</h2><p>{session.explanation}</p></article>
          <article className="study-card"><div className="card-kicker"><span className="card-kicker-icon"><BookOpen size={15} /></span> Keep these in mind</div><h2>Key concepts</h2><div className="concept-list">{session.keyConcepts.map((concept, index) => <div className="concept-item" key={concept.title}><span className="concept-num">{String(index + 1).padStart(2, '0')}</span><div><strong>{concept.title}</strong><p>{concept.detail}</p></div></div>)}</div></article>
          <article className="study-card"><div className="card-kicker"><span className="card-kicker-icon"><Sparkles size={15} /></span> See it in context</div><h2>A couple of examples</h2><div className="example-grid">{session.examples.map((example) => <div className="example-tile" key={example.title}><strong>{example.title}</strong><p>{example.detail}</p></div>)}</div></article>
          {!complete && currentQuestion && <article className="study-card" id="practice"><div className="card-kicker"><span className="card-kicker-icon"><ListChecks size={15} /></span> Try it yourself</div>
            <div className="quiz-progress">Question {questionIndex + 1} of {session.questions.length}</div><p className="quiz-question">{currentQuestion.prompt}</p>
            <div className="options">{currentQuestion.options.map((option, index) => {
              const isCorrect = hasAnswered && index === currentQuestion.correctIndex;
              const isWrong = hasAnswered && selected === index && !isCorrect;
              return <button type="button" key={option} disabled={hasAnswered} onClick={() => setSelected(index)} className={`option-btn ${selected === index ? 'chosen' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`} data-testid={`button-answer-${index}`}><span className="option-letter">{isCorrect ? <Check size={13} /> : String.fromCharCode(65 + index)}</span>{option}</button>;
            })}</div>
            {hasAnswered && <div className={`feedback ${selected !== currentQuestion.correctIndex ? 'wrong' : ''}`} data-testid="text-answer-feedback"><strong>{selected === currentQuestion.correctIndex ? 'That’s right.' : 'Not quite — and that’s okay.'}</strong> {currentQuestion.explanation}</div>}
            <div className="quiz-footer"><span className="quiz-progress">{hasAnswered ? 'Take a moment with the explanation.' : 'Choose the answer that makes the most sense.'}</span>{!hasAnswered ? <button className="primary-btn" disabled={selected === null} onClick={saveAnswer} data-testid="button-check-answer">Check answer <ChevronRight size={14} /></button> : <button className="primary-btn" onClick={nextQuestion} data-testid="button-next-question">{questionIndex === session.questions.length - 1 ? 'Finish session' : 'Next question'} <ArrowRight size={14} /></button>}</div>
          </article>}
          {complete && <article className="study-card" data-testid="status-session-complete"><div className="card-kicker"><span className="card-kicker-icon"><CheckCircle2 size={15} /></span> Session complete</div><h2>You made space to understand.</h2><p>You got {correctCount} of {session.questions.length} questions right. The explanations are here whenever you want to revisit them; progress is a useful clue, not a grade.</p><div className="completion"><strong>{accuracy(session)}% correct this time</strong>{session.answers.some((answer) => !answer.correct) ? 'A little more practice will help the ideas settle in. We’ve marked the concepts to revisit in your progress.' : 'Every answer landed. Keep building on what you understand.'}</div>
            {session.answers.some((answer) => !answer.correct) && <div className="target-review"><div className="review-title"><span>Take another look</span><span>Focused review · from your answers</span></div>{[...new Set(session.answers.filter((answer) => !answer.correct).map((answer) => session.questions[answer.questionIndex].concept))].map((concept) => {
              const detail = session.keyConcepts.find((item) => item.title === concept)?.detail;
              const reviewed = reviewedConcepts.includes(concept);
              return <div className={`review-item ${reviewed ? 'reviewed' : ''}`} key={concept}><div><strong>{concept}</strong><p>{detail}</p></div><button className="review-toggle" onClick={() => setReviewedConcepts((current) => reviewed ? current.filter((item) => item !== concept) : [...current, concept])} data-testid={`button-review-${concept.toLowerCase().replaceAll(' ', '-')}`}>{reviewed ? <><Check size={12} /> Reviewed</> : 'Mark reviewed'}</button></div>;
            })}</div>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}><button className="primary-btn" onClick={startFollowUp} data-testid="button-follow-up-practice">Try more practice <ArrowRight size={14} /></button><button className="text-btn" onClick={restart} data-testid="button-study-another">Study another topic <ArrowRight size={14} /></button><Link href="/progress" className="text-btn" data-testid="link-see-progress">See your progress <ChevronRight size={14} /></Link></div></article>}
        </section>
        <aside className="side-summary"><div className="eyebrow">Today’s path</div><h3>One step at a time</h3><div className="progress-row"><span>Understand</span><span>Done</span></div><div className="progress-track"><div className="progress-fill" style={{ width: '100%' }} /></div><div className="progress-row"><span>Practice</span><span>{complete ? 'Done' : `${questionIndex + (hasAnswered ? 1 : 0)} / ${session.questions.length}`}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${complete ? 100 : ((questionIndex + (hasAnswered ? 1 : 0)) / session.questions.length) * 100}%` }} /></div><div className="divider" /><div className="session-stat"><span className="stat-icon"><Clock3 size={13} /></span><span>A short, focused session</span></div><div className="session-stat"><span className="stat-icon"><CheckCircle2 size={13} /></span><span>{correctCount} answers understood so far</span></div><div className="session-stat"><span className="stat-icon"><BookOpen size={13} /></span><span>Sample lesson · prepared content</span></div></aside>
      </div>
      {toast && <div className="toast-line" role="status">{toast}</div>}
    </main>}
  </Shell>;
}

function Progress() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => { setSessions(readSessions()); setReady(true); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2500); return () => window.clearTimeout(timer); }, [toast]);
  const average = useMemo(() => sessions.length ? Math.round(sessions.reduce((sum, session) => sum + accuracy(session), 0) / sessions.length) : 0, [sessions]);
  const revisits = useMemo(() => {
    const concepts = new Map<string, number>();
    sessions.forEach((session) => session.answers.filter((answer) => !answer.correct).forEach((answer) => {
      const concept = session.questions[answer.questionIndex]?.concept;
      if (concept) concepts.set(concept, (concepts.get(concept) ?? 0) + 1);
    }));
    return [...concepts.entries()].sort((a, b) => b[1] - a[1]).map(([concept]) => concept);
  }, [sessions]);
  const clearHistory = () => {
    if (!window.confirm('Clear all saved study sessions from this device? This cannot be undone.')) return;
    localStorage.removeItem('study-assistant-sessions');
    setSessions([]);
    setToast('Saved sessions cleared.');
  };
  const removeSession = (id: string) => {
    const updated = sessions.filter((session) => session.id !== id);
    localStorage.setItem('study-assistant-sessions', JSON.stringify(updated));
    setSessions(updated);
    setToast('Session removed.');
  };
  return <Shell current="progress"><main className="content">
    <div className="progress-intro"><div><div className="eyebrow">A record of your learning</div><h1 className="page-title">Progress, at your pace.</h1><p className="lead">A gentle recap of what you’ve explored and which ideas might deserve another look.</p></div>{sessions.length > 0 && <button className="text-btn" onClick={clearHistory} data-testid="button-clear-history"><Trash2 size={14} /> Clear history</button>}</div>
    {!ready ? <div className="empty-state"><div className="empty-mark"><BookOpen size={21} /></div><h2>Gathering your sessions</h2><p>Your saved learning will be here in a moment.</p></div> : sessions.length === 0 ? <div className="empty-state" data-testid="status-progress-empty"><div className="empty-mark"><BookOpen size={21} /></div><h2>Your learning story starts here.</h2><p>Once you finish a sample study session, you’ll find your answers and concepts to revisit here.</p><Link href="/" className="primary-btn" data-testid="link-start-first-session">Start a study session <ArrowRight size={14} /></Link></div> : <>
      <div className="metric-grid"><div className="metric-card"><div className="metric-label">Sessions finished</div><div className="metric-value">{sessions.length}</div><div className="metric-note">A little learning adds up</div></div><div className="metric-card"><div className="metric-label">Average answers right</div><div className="metric-value">{average}%</div><div className="metric-note">A guide, not a grade</div></div><div className="metric-card"><div className="metric-label">Concepts to revisit</div><div className="metric-value">{revisits.length}</div><div className="metric-note">From questions worth another look</div></div></div>
      <div className="section-heading"><h2>Ideas to revisit</h2><span>Based on your practice answers</span></div><div className="revisit-wrap">{revisits.length ? revisits.map((concept) => <span className="revisit-chip" key={concept}>{concept}</span>) : <span className="hint">Nothing flagged yet. Your answered questions are all correct.</span>}</div>
      <div className="history-head"><h2>Past sessions</h2><span className="hint">{sessions.length} saved on this device</span></div>
      {sessions.map((session) => {
        const score = accuracy(session);
        return <div className="history-row" key={session.id} data-testid={`row-session-${session.id}`}><div><div className="history-topic">{session.topic}</div><div className="history-date">{new Date(session.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · {session.level}</div></div><div><div className={`accuracy ${score < 60 ? 'low' : ''}`}>{score}%</div><div className="mini-track"><i style={{ width: `${score}%` }} /></div></div><span className="sample-tag">Sample</span><div className="history-actions"><button className="small-action" title="Remove session" aria-label={`Remove ${session.topic} session`} data-testid={`button-remove-session-${session.id}`} onClick={() => removeSession(session.id)}><Trash2 size={13} /></button></div></div>;
      })}
    </>}
    {toast && <div className="toast-line" role="status">{toast}</div>}
  </main></Shell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/progress" component={Progress} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;