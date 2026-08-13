import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    return <Navigate to="/materials" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signUp') {
      setInfo('Check your email to confirm your account, then sign in.');
      setMode('signIn');
      return;
    }

    navigate('/materials');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-display text-2xl font-semibold text-ink">
          Baker&apos;s Costing
        </h1>
        <p className="mb-6 text-center text-sm text-ink-2">
          {mode === 'signIn' ? 'Sign in to your account' : 'Create an account'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-line bg-paper-2 p-6">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-saffron-deep"
            />
          </div>

          {error && <p className="text-sm text-clay">{error}</p>}
          {info && <p className="text-sm text-teal">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal/90 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-2">
          {mode === 'signIn' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
              setInfo(null);
            }}
            className="font-medium text-teal hover:underline"
          >
            {mode === 'signIn' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
