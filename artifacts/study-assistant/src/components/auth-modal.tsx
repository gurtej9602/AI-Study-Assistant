import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { User, Lock, BookOpen, Sparkles, ArrowRight, X, GraduationCap, Compass } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { login, register, loginDemo, isLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('High School (9-12)');
  const [track, setTrack] = useState('Biology & Life Sciences');
  const [customGoal, setCustomGoal] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to sign in');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await register({
      username,
      password,
      name,
      grade,
      track,
      customGoal: track === 'Custom' ? customGoal : undefined,
    });
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to create student account');
    }
  };

  const handleDemo = async () => {
    setError('');
    await loginDemo();
    onClose();
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="auth-header">
          <div className="auth-icon-badge">
            <GraduationCap size={22} />
          </div>
          <h2>{tab === 'login' ? 'Welcome Back, Student' : 'Create Your Learning Path'}</h2>
          <p className="auth-subtitle">
            {tab === 'login'
              ? 'Sign in to access your personal study history and milestones.'
              : 'Each student gets a personalized AI curriculum and tracked progress.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            New Student
          </button>
        </div>

        {error && <div className="auth-error-banner" role="alert">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-username">Username</label>
              <div className="input-with-icon">
                <User size={15} />
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="e.g. alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={15} />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="primary-btn auth-submit-btn">
              {isLoading ? 'Signing in…' : <>Sign in to Study Room <ArrowRight size={15} /></>}
            </button>

            <div className="auth-divider"><span>or explore immediately</span></div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleDemo}
              className="demo-btn"
            >
              <Sparkles size={16} /> Continue as Demo Student (Alex Rivera)
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-field">
              <label htmlFor="reg-name">Your Full Name</label>
              <input
                id="reg-name"
                type="text"
                required
                placeholder="e.g. Maya Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-row-2">
              <div className="auth-field">
                <label htmlFor="reg-username">Username</label>
                <input
                  id="reg-username"
                  type="text"
                  required
                  placeholder="e.g. mayachen"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  placeholder="Min 4 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-grade">Your Current Level</label>
              <select
                id="reg-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="auth-select"
              >
                <option>Middle School (Grades 6-8)</option>
                <option>High School (Grades 9-12)</option>
                <option>College / University</option>
                <option>Adult / Independent Learner</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-track">Choose Your Primary Learning Path</label>
              <select
                id="reg-track"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="auth-select"
              >
                <option value="Biology & Life Sciences">Biology & Life Sciences</option>
                <option value="Algebra & Mathematics">Algebra & Mathematics</option>
                <option value="Earth & Space Science">Earth & Space Science</option>
                <option value="Computer Science & Python">Computer Science & Python</option>
                <option value="Custom">Custom AI Learning Goal (Describe below)</option>
              </select>
            </div>

            {track === 'Custom' && (
              <div className="auth-field">
                <label htmlFor="reg-custom-goal">Your Specific Learning Goal</label>
                <input
                  id="reg-custom-goal"
                  type="text"
                  required
                  placeholder="e.g. SAT Math prep, Organic Chemistry, or World War II history"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
                <span className="auth-field-hint">
                  Gemini will generate a custom 5-step curriculum roadmap for you!
                </span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="primary-btn auth-submit-btn">
              {isLoading ? 'Creating Student Profile…' : <>Start My Learning Journey <ArrowRight size={15} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
