import React, { useState } from 'react';
import { useAuth, type PathMilestone } from '@/lib/auth-context';
import {
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Sliders,
  ChevronRight,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface LearningPathPageProps {
  onStartTopic: (topic: string, level: string) => void;
  onOpenAuth: () => void;
}

export function LearningPathPage({ onStartTopic, onOpenAuth }: LearningPathPageProps) {
  const { student, isAuthenticated, updateTrack } = useAuth();
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('Biology & Life Sciences');
  const [customGoal, setCustomGoal] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isAuthenticated || !student) {
    return (
      <main className="content">
        <div className="empty-state" style={{ maxWidth: 540, margin: '40px auto' }}>
          <div className="empty-mark">
            <Compass size={24} />
          </div>
          <h2>Personalized Student Learning Paths</h2>
          <p>
            Sign in or create a student profile to track your individualized curriculum, unlock milestone topics sequentially, and review concepts tailored to your strengths and weaknesses.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="primary-btn" onClick={onOpenAuth}>
              Sign in or Create Profile <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  const milestones = student.learningPath || [];
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  const currentUpNext = milestones.find((m) => m.status === 'up_next') || milestones.find((m) => m.status === 'in_progress') || milestones[0];

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateTrack(selectedTrack, selectedTrack === 'Custom' ? customGoal : undefined);
    setIsUpdating(false);
    setIsChangingTrack(false);
  };

  return (
    <main className="content">
      {/* Intro Header */}
      <div className="path-header">
        <div className="path-header-info">
          <div className="eyebrow">
            <Compass size={13} style={{ display: 'inline', marginRight: 5 }} />
            Student Roadmap · {student.grade}
          </div>
          <h1 className="page-title">{student.name}’s Learning Path</h1>
          <p className="lead">
            {student.customGoal ? (
              <>Focused on custom goal: <strong>{student.customGoal}</strong></>
            ) : (
              <>Track: <strong>{student.track}</strong>. Master each concept in sequence with Gemini AI.</>
            )}
          </p>
        </div>

        <div className="path-header-actions">
          <button
            type="button"
            className="secondary-action-btn"
            onClick={() => setIsChangingTrack(!isChangingTrack)}
          >
            <Sliders size={14} /> {isChangingTrack ? 'Close Track Settings' : 'Change Track / Goal'}
          </button>
        </div>
      </div>

      {/* Track Change Panel */}
      {isChangingTrack && (
        <form onSubmit={handleTrackSubmit} className="track-switcher-card">
          <div className="track-switcher-head">
            <div>
              <h3>Choose a New Learning Track</h3>
              <p>Select a curated subject curriculum or let Gemini generate a 5-step custom path.</p>
            </div>
          </div>

          <div className="track-options-grid">
            {[
              { id: 'Biology & Life Sciences', title: 'Biology & Life Sciences', desc: 'Cellular processes, genetics, photosynthesis, and ecosystems' },
              { id: 'Algebra & Mathematics', title: 'Algebra & Mathematics', desc: 'Linear equations, polynomials, quadratics, and graphs' },
              { id: 'Earth & Space Science', title: 'Earth & Space Science', desc: 'Water cycle, plate tectonics, rock transformations, and astronomy' },
              { id: 'Computer Science & Python', title: 'Computer Science & Python', desc: 'Variables, loops, conditionals, functions, and data structures' },
              { id: 'Custom', title: '✨ Custom AI Goal', desc: 'Describe your own subject or test prep goal to generate a roadmap' },
            ].map((t) => (
              <label
                key={t.id}
                className={`track-choice-label ${selectedTrack === t.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="track_choice"
                  value={t.id}
                  checked={selectedTrack === t.id}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                />
                <span className="track-choice-title">{t.title}</span>
                <span className="track-choice-desc">{t.desc}</span>
              </label>
            ))}
          </div>

          {selectedTrack === 'Custom' && (
            <div className="custom-goal-field">
              <label htmlFor="custom-goal-input">What would you like to master?</label>
              <input
                id="custom-goal-input"
                type="text"
                placeholder="e.g. AP Chemistry thermodynamics, Roman History, Microeconomics"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                required
              />
              <span className="auth-field-hint">
                Gemini will craft 5 custom milestone topics based on your level.
              </span>
            </div>
          )}

          <div className="track-switcher-footer">
            <button
              type="submit"
              disabled={isUpdating}
              className="primary-btn"
            >
              {isUpdating ? 'Generating New Path…' : <>Apply Learning Path <ArrowRight size={14} /></>}
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => setIsChangingTrack(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Progress Overview Bar */}
      <div className="path-metric-bar">
        <div className="path-metric-item">
          <span className="path-metric-num">{completedCount} of {milestones.length}</span>
          <span className="path-metric-label">Milestones Mastered</span>
        </div>
        <div className="path-metric-item">
          <span className="path-metric-num">{progressPercent}%</span>
          <span className="path-metric-label">Curriculum Complete</span>
        </div>
        <div className="path-progress-container">
          <div className="path-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Up Next Spotlight Card */}
      {currentUpNext && (
        <div className="up-next-spotlight">
          <div className="spotlight-left">
            <div className="spotlight-badge">
              <Sparkles size={13} /> Recommended Next Step
            </div>
            <h2>{currentUpNext.topic}</h2>
            <p>{currentUpNext.description}</p>
            <div className="spotlight-tags">
              <span>{currentUpNext.level}</span>
              <span>~5 min study session</span>
              {currentUpNext.accuracy !== undefined && (
                <span>Previous score: {currentUpNext.accuracy}%</span>
              )}
            </div>
          </div>
          <div className="spotlight-action">
            <button
              className="primary-btn spotlight-btn"
              onClick={() => onStartTopic(currentUpNext.topic, currentUpNext.level)}
            >
              {currentUpNext.status === 'completed' ? 'Review Lesson' : 'Start Next Milestone'} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Milestone Roadmap */}
      <div className="section-heading" style={{ marginTop: 36 }}>
        <h2>Sequential Milestones</h2>
        <span>Step-by-step mastery</span>
      </div>

      <div className="milestones-timeline">
        {milestones.map((m, index) => {
          const isCompleted = m.status === 'completed';
          const isUpNext = m.status === 'up_next';
          const isInProgress = m.status === 'in_progress';
          const isLocked = m.status === 'locked';

          return (
            <div
              key={m.id || index}
              className={`milestone-card status-${m.status}`}
            >
              <div className="milestone-status-col">
                <div className={`milestone-badge-icon ${isCompleted ? 'done' : isUpNext ? 'current' : isLocked ? 'locked' : 'progress'}`}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : isLocked ? (
                    <Lock size={15} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < milestones.length - 1 && <div className="milestone-connector" />}
              </div>

              <div className="milestone-body">
                <div className="milestone-header">
                  <div>
                    <span className="milestone-step-tag">Step {index + 1} · {m.level}</span>
                    <h3 className="milestone-title">{m.topic}</h3>
                  </div>

                  <div className="milestone-status-tag">
                    {isCompleted && <span className="tag-completed">Mastered · {m.accuracy}%</span>}
                    {isUpNext && <span className="tag-up-next">Up Next</span>}
                    {isInProgress && <span className="tag-progress">In Progress</span>}
                    {isLocked && <span className="tag-locked">Locked</span>}
                  </div>
                </div>

                <p className="milestone-desc">{m.description}</p>

                {m.weakConcepts && m.weakConcepts.length > 0 && (
                  <div className="milestone-weak-tags">
                    <span className="weak-label">Concepts to revisit:</span>
                    {m.weakConcepts.map((c) => (
                      <span key={c} className="revisit-chip">{c}</span>
                    ))}
                  </div>
                )}

                <div className="milestone-footer">
                  <div className="milestone-meta">
                    {m.sessionsCount > 0 ? (
                      <span>{m.sessionsCount} session{m.sessionsCount > 1 ? 's' : ''} completed</span>
                    ) : (
                      <span>Not started yet</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isLocked}
                    className={isUpNext ? 'primary-btn' : 'secondary-action-btn'}
                    onClick={() => onStartTopic(m.topic, m.level)}
                  >
                    {isCompleted ? 'Review Topic' : isLocked ? 'Complete earlier steps first' : 'Study this topic'}
                    {!isLocked && <ArrowRight size={13} style={{ marginLeft: 5 }} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
