'use client';

import { useRef, useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  // Uncontrolled inputs — no state update on every keystroke, fixes INP issue
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const email = emailRef.current?.value.trim().toLowerCase() || '';
    const password = passwordRef.current?.value || '';

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password. Please try again.');
      if (passwordRef.current) passwordRef.current.value = '';
      passwordRef.current?.focus();
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-monsoon-500 to-cyan-500 flex items-center justify-center text-white text-3xl mx-auto mb-4">
            🌧️
          </div>
          <h1 className="text-3xl font-bold text-monsoon-900">MonsoonGuard</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue=""
                  placeholder="demo@monsoonguard.app"
                  className="input-field"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  ref={passwordRef}
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue=""
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              {error && (
                <p
                  id="login-error"
                  className="text-red-600 text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">
              Demo credentials
            </p>
            <p className="text-xs text-blue-600">
              Email: <code className="font-mono">demo@monsoonguard.app</code>
            </p>
            <p className="text-xs text-blue-600">
              Password: <code className="font-mono">Monsoon@2026</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          MonsoonGuard — PromptWars: Pune Hackathon
        </p>
      </div>
    </div>
  );
}
