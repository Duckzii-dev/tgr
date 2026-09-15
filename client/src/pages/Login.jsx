import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../lib/toast.jsx';
import { api } from '../lib/api.js';
import { Chrome } from 'lucide-react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      return toast('Vui lòng xác nhận captcha', 'error');
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, turnstileToken);
      toast('Welcome back!');
      nav('/');
    } catch (err) {
      toast(err.message, 'error');
      // Token Turnstile chỉ dùng 1 lần → reset widget sau lỗi
      setTurnstileToken('');
      setTurnstileKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const google = () => {
    window.location.href = `${api.BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ink-950">
      <div className="card w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold">
            TGR<span className="text-accent">.</span>PROGRESS
          </div>
          <div className="text-sm text-ink-400 mt-1">Sign in to continue</div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <Turnstile
                key={turnstileKey}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'dark', size: 'normal' }}
              />
            </div>
          )}

          <button className="btn btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4 text-xs text-ink-400">
          <div className="flex-1 h-px bg-ink-700" /> or{' '}
          <div className="flex-1 h-px bg-ink-700" />
        </div>

        <button className="btn btn-ghost w-full justify-center" onClick={google}>
          <Chrome className="w-4 h-4" /> Continue with Google
        </button>

        <div className="text-center text-sm text-ink-400 mt-4">
          No account?{' '}
          <Link to="/register" className="text-accent">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}