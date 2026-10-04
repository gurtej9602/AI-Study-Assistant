import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvaluateStudyAnswer, useGenerateStudyLesson, useGenerateStudyPractice } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { LearningPathPage } from '@/pages/learning-path-page';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AuthModal } from '@/components/auth-modal';
import { Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  FlaskConical,
  GraduationCap,
  Leaf,
  Lightbulb,
  ListChecks,
  LogOut,
  Sparkles,
  Trash2,
  User,
  Waves,
} from 'lucide-react';
import {
  accuracy,
  presets,
  readSessions,
  saveSession,
  createLesson,
  createFollowUpSession,
  getStorageKey,
  type StudySession,
} from './data/lessons';

const queryClient = new QueryClient();

interface ShellProps {
  children: ReactNode;
  current: 'study' | 'path' | 'progress';
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

function Shell({ children, current, onOpenAuth }: ShellProps) {
  const { student, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const completedMilestones = student?.learningPath?.filter((m) => m.status === 'completed').length ?? 0;
  const totalMilestones = student?.learningPath?.length ?? 0;

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="brand">
          <div className="brand-mark"><BookOpen size={17} /></div>
          <span className="brand-name">Study room</span>
        </div>
        <div className="side-label">Your workspace</div>
        <nav aria-label="Main navigation">
          <Link
            href="/"
            data-testid="link-study"
            className={`nav-link ${current === 'study' ? 'active' : ''}`}
          >
            <BookOpen size={16} />Study session
          </Link>

          <Link
            href="/path"
            data-testid="link-path"
            className={`nav-link ${current === 'path' ? 'active' : ''}`}
          >
            <Compass size={16} />Learning path
            {isAuthenticated && totalMilestones > 0 && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '9px',
                background: '#d47055',
                color: '#fff',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 700,
              }}>
                {completedMilestones}/{totalMilestones}
              </span>
            )}
          </Link>

          <Link
            href="/progress"
            data-testid="link-progress"
            className={`nav-link ${current === 'progress' ? 'active' : ''}`}
          >
            <ListChecks size={16} />Your progress
          </Link>
        </nav>
        <div className="rail-foot">
          {isAuthenticated && student ? (
            <div style={{ fontSize: '11px', color: '#b2b8c9', lineHeight: '1.4' }}>
              Student: <strong style={{ color: '#fff' }}>{student.name}</strong>
              <div style={{ fontSize: '10px', color: '#888f9e', marginTop: 2 }}>{student.track}</div>
            </div>
          ) : (
            'A little understanding, every day.'
          )}
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-caption">
            <span className="dot" /> Your quiet corner to learn
          </div>

          <div className="topbar-right" style={{ position: 'relative' }}>
            {isAuthenticated && student ? (
              <>
                <button
                  type="button"
                  className="student-pill"
                  onClick={() => setShowMenu(!showMenu)}
                  title="Manage Student Account"
                >
                  <div className="student-avatar">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="student-info">
                    <span className="student-name-text">{student.name}</span>
                    <span className="student-track-badge">{student.grade}</span>
                  </div>
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '46px',
                      right: '0',
                      background: '#fff',
                      border: '1px solid #dcd5c7',
                      borderRadius: '10px',
                      padding: '8px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      minWidth: '220px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#686f82', padding: '6px 10px', borderBottom: '1px solid #eee' }}>
                      <strong style={{ display: 'block', color: '#252b3d' }}>{student.name}</strong>
                      <span style={{ fontSize: '10px' }}>@{student.username} · {student.track}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setShowMenu(false); onOpenAuth('login'); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 10px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#2e3549',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        marginTop: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f2e9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <User size={14} /> Switch Student Account
                    </button>

                    <button
                      type="button"
                      onClick={async () => { setShowMenu(false); await logout(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 10px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#a1433d',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fbeee9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                className="sign-in-btn"
                onClick={() => onOpenAuth('login')}
              >
                <GraduationCap size={15} /> Student Sign in
              </button>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

function Home({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { student, isAuthenticated, syncSession } = useAuth();
  const [chosen, setChosen] = useState('');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Just getting started');
  const [session, setSession] = useState<StudySession | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [complete, setComplete] = useState(false);
  const [toast, setToast] = useState('');
  const [apiError, setApiError] = useState('');
  const [reviewedConcepts, setReviewedConcepts] = useState<string[]>([]);
  const lessonMutation = useGenerateStudyLesson();
  const answerMutation = useEvaluateStudyAnswer();
  const practiceMutation = useGenerateStudyPractice();

  // Check if routed with a pending topic from the Learning Path
  useEffect(() => {
    try {
      const pendingRaw = sessionStorage.getItem('pending_study_topic');
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        sessionStorage.removeItem('pending_study_topic');
        if (parsed.topic) {
          setTopic(parsed.topic);
          setChosen(parsed.topic);
          if (parsed.level) setLevel(parsed.level);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const startStudy = () => {
    const cleanTopic = topic.trim();
    if (cleanTopic.length < 2 || cleanTopic.length > 160) return;
    setApiError('');
    lessonMutation.mutate({ data: { topic: cleanTopic, level } }, {
      onSuccess: (lesson) => {
        setSession({
          ...lesson,
          id: crypto.randomUUID(),
          level,
          createdAt: new Date().toISOString(),
          answers: [],
          source: 'gemini',
        });
        setQuestionIndex(0);
        setSelected(null);
        setHasAnswered(false);
        setComplete(false);
        setReviewedConcepts([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error) => {
        const localLesson = createLesson(cleanTopic, level);
        if (localLesson) {
          setSession({
            ...localLesson,
            source: 'sample',
          });
          setQuestionIndex(0);
          setSelected(null);
          setHasAnswered(false);
          setComplete(false);
          setReviewedConcepts([]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setApiError(error.message || 'Gemini could not create that lesson. Please check server status.');
      },
    });
  };

  const pickPreset = (name: string) => { setChosen(name); setTopic(name); };

  const saveAnswer = () => {
    if (!session || selected === null) return;
    const question = session.questions[questionIndex];
    setApiError('');

    const fallbackAnswer = () => {
      const isCorrect = selected === question.correctIndex;
      const answer = {
        questionIndex,
        selectedIndex: selected,
        correct: isCorrect,
        feedback: isCorrect
          ? `Correct! ${question.explanation}`
          : `Not quite. ${question.explanation}`,
        misconception: '',
        weakConcept: isCorrect ? '' : question.concept,
      };
      setSession((current) => current
        ? { ...current, answers: [...current.answers.filter((item) => item.questionIndex !== questionIndex), answer] }
        : current);
      setHasAnswered(true);
    };

    if (session.source === 'sample') {
      fallbackAnswer();
      return;
    }

    answerMutation.mutate({
      data: {
        topic: session.topic,
        question: question.prompt,
        concept: question.concept,
        studentAnswer: question.options[selected],
        correctAnswer: question.options[question.correctIndex],
        expectedExplanation: question.explanation,
      },
    }, {
      onSuccess: (evaluation) => {
        const answer = {
          questionIndex,
          selectedIndex: selected,
          correct: selected === question.correctIndex,
          feedback: evaluation.feedback,
          misconception: evaluation.misconception,
          weakConcept: evaluation.weakConcept || question.concept,
        };
        setSession((current) => current
          ? { ...current, answers: [...current.answers.filter((item) => item.questionIndex !== questionIndex), answer] }
          : current);
        setHasAnswered(true);
      },
      onError: () => {
        fallbackAnswer();
      },
    });
  };

  const nextQuestion = () => {
    if (!session) return;
    if (questionIndex === session.questions.length - 1) {
      saveSession(session, student?.id);
      syncSession(session);
      setComplete(true);
      setToast(isAuthenticated
        ? `Saved to ${student?.name}’s learning path!`
        : 'Your session is saved on this device.');
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setHasAnswered(false);
  };

  const restart = () => {
    setSession(null);
    setComplete(false);
    setChosen('');
    setTopic('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startFollowUp = () => {
    if (!session) return;
    const weakConcepts = [...new Set(session.answers
      .filter((answer) => !answer.correct)
      .map((answer) => answer.weakConcept || session.questions[answer.questionIndex]?.concept)
      .filter((concept): concept is string => Boolean(concept)))];
    const focusConcepts = weakConcepts.length ? weakConcepts : session.keyConcepts.map((concept) => concept.title);
    setApiError('');

    const handleFollowUpFallback = () => {
      const followUp = createFollowUpSession(session, focusConcepts);
      if (followUp) {
        setSession({
          ...followUp,
          source: 'sample',
        });
        setQuestionIndex(0);
        setSelected(null);
        setHasAnswered(false);
        setComplete(false);
        setReviewedConcepts([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }
      return false;
    };

    if (session.source === 'sample') {
      if (handleFollowUpFallback()) return;
    }

    practiceMutation.mutate({
      data: {
        topic: session.topic,
        level: session.level,
        weakConcepts: focusConcepts,
        previousQuestions: session.questions.map((question) => question.prompt),
        questionCount: 3,
      },
    }, {
      onSuccess: (practice) => {
        setSession({
          ...session,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          questions: practice.questions,
          answers: [],
          followUp: true,
          source: 'gemini',
        });
        setQuestionIndex(0);
        setSelected(null);
        setHasAnswered(false);
        setComplete(false);
        setReviewedConcepts([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (error) => {
        if (!handleFollowUpFallback()) {
          setApiError(error.message || 'Gemini could not create more practice.');
        }
      },
    });
  };

  const currentQuestion = session?.questions[questionIndex];
  const currentAnswer = session?.answers.find((answer) => answer.questionIndex === questionIndex);
  const correctCount = session?.answers.filter((answer) => answer.correct).length ?? 0;

  return (
    <Shell current="study" onOpenAuth={onOpenAuth}>
      {!session ? (
        <main className="content">
          <div className="intro-row">
            <div>
              <div className="eyebrow">
                {isAuthenticated && student
                  ? `Welcome, ${student.name} · ${student.track}`
                  : 'A thoughtful way to study'}
              </div>
              <h1 className="page-title">Make sense of<br />something new.</h1>
              <p className="lead">
                Get a clear explanation, see the idea in action, then try a few questions. No pressure to get it all at once.
              </p>
            </div>
            <div className="sample-tag"><b>Gemini 2.5 Flash</b>&nbsp; · &nbsp;Free tier</div>
          </div>

          {!isAuthenticated && (
            <div className="notice" style={{ background: '#f5efe4', borderColor: '#dfd6c5' }}>
              <div className="notice-icon"><GraduationCap size={16} /></div>
              <div>
                <strong>Want an individualized learning path?</strong>{' '}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c45a40',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Create your student profile
                </button>{' '}
                to get sequential milestones and have Gemini remember your progress.
              </div>
            </div>
          )}

          <div className="section-heading">
            <h2>Choose a starting point</h2>
            <span>Quick topic starters</span>
          </div>

          <div className="preset-grid">
            {presets.map((preset) => {
              const Icon = preset.symbol === 'leaf' ? Leaf : preset.symbol === 'math' ? FlaskConical : Waves;
              return (
                <button
                  type="button"
                  key={preset.topic}
                  data-testid={`button-preset-${preset.topic.toLowerCase().replaceAll(' ', '-')}`}
                  className={`preset-card ${chosen === preset.topic ? 'selected' : ''}`}
                  onClick={() => pickPreset(preset.topic)}
                >
                  <span className="preset-icon"><Icon size={17} /></span>
                  <span className="preset-level">{preset.level}</span>
                  <span className="preset-title">{preset.topic}</span>
                  <span className="preset-desc">{preset.subtitle}</span>
                </button>
              );
            })}
          </div>

          <div className="entry-panel">
            <div className="entry-copy">
              <label htmlFor="topic">Topic</label>
              <input
                id="topic"
                maxLength={160}
                data-testid="input-topic"
                className="topic-input"
                value={topic}
                onChange={(event) => { setTopic(event.target.value); setChosen(''); }}
                placeholder="For example, fractions or the water cycle"
                list="topic-options"
              />
              <datalist id="topic-options">
                {presets.map((preset) => <option key={preset.topic} value={preset.topic} />)}
              </datalist>
            </div>
            <div className="select-wrap">
              <label htmlFor="level" className="hint" style={{ display: 'block', margin: '0 0 7px', fontWeight: 700, color: '#454b5c' }}>
                Your level
              </label>
              <select
                id="level"
                data-testid="select-level"
                className="level-select"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option>Just getting started</option>
                <option>Know a little</option>
                <option>Ready for a challenge</option>
              </select>
            </div>
            <button
              type="button"
              className="primary-btn"
              data-testid="button-start-study"
              disabled={topic.trim().length < 2 || topic.trim().length > 160 || lessonMutation.isPending}
              onClick={startStudy}
            >
              {lessonMutation.isPending ? 'Preparing lesson…' : <>Start learning <ArrowRight size={15} /></>}
            </button>
          </div>
          <p className="hint">Your level helps Gemini adapt the explanation, examples, and quiz questions.</p>
          {apiError && <p role="alert" className="hint" style={{ color: '#a1433d' }}>{apiError}</p>}
        </main>
      ) : (
        <main className="content">
          <div className="study-layout">
            <section className="study-main">
              <div className="study-heading">
                <div>
                  <div className="eyebrow">
                    {session.followUp ? 'Focused practice' : 'Your study session'} <span style={{ color: '#9a968e' }}>· Gemini 2.5 Flash</span>
                  </div>
                  <h1>{session.topic}</h1>
                  <div className="study-meta">
                    <span>{session.level}</span>
                    <span>About 5 minutes</span>
                  </div>
                </div>
                <button className="text-btn" onClick={restart} data-testid="button-back-to-topics">
                  <ArrowLeft size={14} /> Choose another topic
                </button>
              </div>

              <article className="study-card">
                <div className="card-kicker"><span className="card-kicker-icon"><Lightbulb size={15} /></span> The big picture</div>
                <h2>Let’s start with the idea</h2>
                <p>{session.explanation}</p>
              </article>

              <article className="study-card">
                <div className="card-kicker"><span className="card-kicker-icon"><BookOpen size={15} /></span> Keep these in mind</div>
                <h2>Key concepts</h2>
                <div className="concept-list">
                  {session.keyConcepts.map((concept, index) => (
                    <div className="concept-item" key={concept.title}>
                      <span className="concept-num">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{concept.title}</strong>
                        <p>{concept.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="study-card">
                <div className="card-kicker"><span className="card-kicker-icon"><Sparkles size={15} /></span> See it in context</div>
                <h2>A couple of examples</h2>
                <div className="example-grid">
                  {session.examples.map((example) => (
                    <div className="example-tile" key={example.title}>
                      <strong>{example.title}</strong>
                      <p>{example.detail}</p>
                    </div>
                  ))}
                </div>
              </article>

              {!complete && currentQuestion && (
                <article className="study-card" id="practice">
                  <div className="card-kicker"><span className="card-kicker-icon"><ListChecks size={15} /></span> Try it yourself</div>
                  <div className="quiz-progress">Question {questionIndex + 1} of {session.questions.length}</div>
                  <p className="quiz-question">{currentQuestion.prompt}</p>

                  <div className="options">
                    {currentQuestion.options.map((option, index) => {
                      const isCorrect = hasAnswered && index === currentQuestion.correctIndex;
                      const isWrong = hasAnswered && selected === index && !isCorrect;
                      return (
                        <button
                          type="button"
                          key={option}
                          disabled={hasAnswered || answerMutation.isPending}
                          onClick={() => setSelected(index)}
                          className={`option-btn ${selected === index ? 'chosen' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'incorrect' : ''}`}
                          data-testid={`button-answer-${index}`}
                        >
                          <span className="option-letter">
                            {isCorrect ? <Check size={13} /> : String.fromCharCode(65 + index)}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {answerMutation.isPending && <p className="hint" role="status">Gemini is reviewing your answer…</p>}
                  {apiError && <p className="hint" role="alert" style={{ color: '#a1433d' }}>{apiError}</p>}
                  {hasAnswered && (
                    <div className={`feedback ${selected !== currentQuestion.correctIndex ? 'wrong' : ''}`} data-testid="text-answer-feedback">
                      <strong>{selected === currentQuestion.correctIndex ? 'That’s right.' : 'Not quite — and that’s okay.'}</strong> {currentAnswer?.feedback || currentQuestion.explanation}
                    </div>
                  )}

                  <div className="quiz-footer">
                    <span className="quiz-progress">
                      {hasAnswered ? 'Take a moment with the explanation.' : 'Choose the answer that makes the most sense.'}
                    </span>
                    {!hasAnswered ? (
                      <button
                        className="primary-btn"
                        disabled={selected === null || answerMutation.isPending}
                        onClick={saveAnswer}
                        data-testid="button-check-answer"
                      >
                        {answerMutation.isPending ? 'Checking…' : <>Check answer <ChevronRight size={14} /></>}
                      </button>
                    ) : (
                      <button className="primary-btn" onClick={nextQuestion} data-testid="button-next-question">
                        {questionIndex === session.questions.length - 1 ? 'Finish session' : 'Next question'} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </article>
              )}

              {complete && (
                <article className="study-card" data-testid="status-session-complete">
                  <div className="card-kicker"><span className="card-kicker-icon"><CheckCircle2 size={15} /></span> Session complete</div>
                  <h2>You made space to understand.</h2>
                  <p>
                    You got {correctCount} of {session.questions.length} questions right. The explanations are here whenever you want to revisit them; progress is a useful clue, not a grade.
                  </p>
                  <div className="completion">
                    <strong>{accuracy(session)}% correct this time</strong>
                    {session.answers.some((answer) => !answer.correct)
                      ? 'A little more practice will help the ideas settle in. We’ve marked the concepts to revisit in your progress.'
                      : 'Every answer landed. Keep building on what you understand.'}
                  </div>

                  {session.answers.some((answer) => !answer.correct) && (
                    <div className="target-review">
                      <div className="review-title">
                        <span>Take another look</span>
                        <span>Focused review · from your answers</span>
                      </div>
                      {[...new Set(session.answers.filter((answer) => !answer.correct).map((answer) => answer.weakConcept || session.questions[answer.questionIndex]?.concept))].map((concept) => {
                        if (!concept) return null;
                        const detail = session.keyConcepts.find((item) => item.title === concept)?.detail;
                        const reviewed = reviewedConcepts.includes(concept);
                        return (
                          <div className={`review-item ${reviewed ? 'reviewed' : ''}`} key={concept}>
                            <div>
                              <strong>{concept}</strong>
                              <p>{detail}</p>
                            </div>
                            <button
                              className="review-toggle"
                              onClick={() => setReviewedConcepts((current) => reviewed ? current.filter((item) => item !== concept) : [...current, concept])}
                              data-testid={`button-review-${concept.toLowerCase().replaceAll(' ', '-')}`}
                            >
                              {reviewed ? <><Check size={12} /> Reviewed</> : 'Mark reviewed'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {apiError && <p role="alert" className="hint" style={{ color: '#a1433d' }}>{apiError}</p>}
                  {practiceMutation.isPending && <p role="status" className="hint">Generating three new questions with Gemini…</p>}

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                    <button className="primary-btn" onClick={startFollowUp} disabled={practiceMutation.isPending} data-testid="button-follow-up-practice">
                      {practiceMutation.isPending ? 'Preparing practice…' : <>Try more practice <ArrowRight size={14} /></>}
                    </button>
                    <Link href="/path" className="primary-btn" style={{ background: '#546688' }}>
                      <Compass size={14} /> View Learning Path
                    </Link>
                    <button className="text-btn" onClick={restart} data-testid="button-study-another">
                      Study another topic <ArrowRight size={14} />
                    </button>
                    <Link href="/progress" className="text-btn" data-testid="link-see-progress">
                      See your progress <ChevronRight size={14} />
                    </Link>
                  </div>
                </article>
              )}
            </section>

            <aside className="side-summary">
              <div className="eyebrow">Today’s path</div>
              <h3>One step at a time</h3>
              <div className="progress-row">
                <span>Understand</span><span>Done</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '100%' }} />
              </div>
              <div className="progress-row">
                <span>Practice</span>
                <span>{complete ? 'Done' : `${questionIndex + (hasAnswered ? 1 : 0)} / ${session.questions.length}`}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${complete ? 100 : ((questionIndex + (hasAnswered ? 1 : 0)) / session.questions.length) * 100}%` }} />
              </div>
              <div className="divider" />
              <div className="session-stat">
                <span className="stat-icon"><Clock3 size={13} /></span>
                <span>A short, focused session</span>
              </div>
              <div className="session-stat">
                <span className="stat-icon"><CheckCircle2 size={13} /></span>
                <span>{correctCount} answers understood so far</span>
              </div>
              <div className="session-stat">
                <span className="stat-icon"><BookOpen size={13} /></span>
                <span>Gemini Free lesson</span>
              </div>
            </aside>
          </div>
          {toast && <div className="toast-line" role="status">{toast}</div>}
        </main>
      )}
    </Shell>
  );
}

function Progress({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { student, token, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    // Load local storage sessions for this student
    const local = readSessions(student?.id);
    setSessions(local);
    setReady(true);

    // If student is logged in, also try to fetch from backend
    if (token) {
      fetch('/api/study/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            setSessions(data.sessions);
          }
        })
        .catch(() => {
          // Keep local sessions
        });
    }
  }, [student?.id, token]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const average = useMemo(
    () => (sessions.length ? Math.round(sessions.reduce((sum, s) => sum + accuracy(s), 0) / sessions.length) : 0),
    [sessions],
  );

  const revisits = useMemo(() => {
    const concepts = new Map<string, number>();
    sessions.forEach((s) => s.answers?.filter((a) => !a.correct).forEach((a) => {
      const concept = a.weakConcept || s.questions?.[a.questionIndex]?.concept;
      if (concept) concepts.set(concept, (concepts.get(concept) ?? 0) + 1);
    }));
    return [...concepts.entries()].sort((a, b) => b[1] - a[1]).map(([concept]) => concept);
  }, [sessions]);

  const clearHistory = () => {
    if (!window.confirm('Clear your saved study sessions? This cannot be undone.')) return;
    const key = getStorageKey(student?.id);
    localStorage.removeItem(key);
    setSessions([]);
    setToast('Saved sessions cleared.');
  };

  const removeSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    const key = getStorageKey(student?.id);
    localStorage.setItem(key, JSON.stringify(updated));
    setSessions(updated);

    if (token) {
      fetch(`/api/study/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    setToast('Session removed.');
  };

  return (
    <Shell current="progress" onOpenAuth={onOpenAuth}>
      <main className="content">
        <div className="progress-intro">
          <div>
            <div className="eyebrow">
              {isAuthenticated && student
                ? `${student.name}’s Learning Record · ${student.track}`
                : 'A record of your learning'}
            </div>
            <h1 className="page-title">Progress, at your pace.</h1>
            <p className="lead">
              A gentle recap of what you’ve explored and which ideas might deserve another look.
            </p>
          </div>
          {sessions.length > 0 && (
            <button className="text-btn" onClick={clearHistory} data-testid="button-clear-history">
              <Trash2 size={14} /> Clear history
            </button>
          )}
        </div>

        {!ready ? (
          <div className="empty-state">
            <div className="empty-mark"><BookOpen size={21} /></div>
            <h2>Gathering your sessions</h2>
            <p>Your saved learning will be here in a moment.</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state" data-testid="status-progress-empty">
            <div className="empty-mark"><BookOpen size={21} /></div>
            <h2>Your learning story starts here.</h2>
            <p>After you finish a Gemini study session, your answers and concepts to revisit will appear here.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/" className="primary-btn" data-testid="link-start-first-session">
                Start a study session <ArrowRight size={14} />
              </Link>
              <Link href="/path" className="secondary-action-btn">
                <Compass size={14} /> View Learning Path
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Sessions finished</div>
                <div className="metric-value">{sessions.length}</div>
                <div className="metric-note">A little learning adds up</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Average answers right</div>
                <div className="metric-value">{average}%</div>
                <div className="metric-note">A guide, not a grade</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Concepts to revisit</div>
                <div className="metric-value">{revisits.length}</div>
                <div className="metric-note">From questions worth another look</div>
              </div>
            </div>

            <div className="section-heading">
              <h2>Ideas to revisit</h2>
              <span>Based on your practice answers</span>
            </div>
            <div className="revisit-wrap">
              {revisits.length ? (
                revisits.map((concept) => (
                  <span className="revisit-chip" key={concept}>{concept}</span>
                ))
              ) : (
                <span className="hint">Nothing flagged yet. Your answered questions are all correct.</span>
              )}
            </div>

            <div className="history-head">
              <h2>Past sessions</h2>
              <span className="hint">
                {sessions.length} saved {isAuthenticated ? `for ${student?.name}` : 'on this device'}
              </span>
            </div>

            {sessions.map((item) => {
              const score = accuracy(item);
              return (
                <div className="history-row" key={item.id} data-testid={`row-session-${item.id}`}>
                  <div>
                    <div className="history-topic">{item.topic}</div>
                    <div className="history-date">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })} · {item.level}
                    </div>
                  </div>
                  <div>
                    <div className={`accuracy ${score < 60 ? 'low' : ''}`}>{score}%</div>
                    <div className="mini-track"><i style={{ width: `${score}%` }} /></div>
                  </div>
                  <span className="sample-tag">{item.source === 'gemini' ? 'Gemini' : 'Sample'}</span>
                  <div className="history-actions">
                    <button
                      className="small-action"
                      title="Remove session"
                      aria-label={`Remove ${item.topic} session`}
                      data-testid={`button-remove-session-${item.id}`}
                      onClick={() => removeSession(item.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {toast && <div className="toast-line" role="status">{toast}</div>}
      </main>
    </Shell>
  );
}

function PathView({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [, setLocation] = useLocation();

  const handleStartTopic = (topic: string, level: string) => {
    sessionStorage.setItem('pending_study_topic', JSON.stringify({ topic, level }));
    setLocation('/');
  };

  return (
    <Shell current="path" onOpenAuth={onOpenAuth}>
      <LearningPathPage onStartTopic={handleStartTopic} onOpenAuth={onOpenAuth} />
    </Shell>
  );
}

function Router() {
  const [location] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/">
          <Home onOpenAuth={openAuth} />
        </Route>
        <Route path="/path">
          <PathView onOpenAuth={openAuth} />
        </Route>
        <Route path="/progress">
          <Progress onOpenAuth={openAuth} />
        </Route>
        <Route component={NotFound} />
      </Switch>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authTab}
      />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;