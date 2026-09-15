import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0); // reset widget sau lỗi

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast('Password must be 8+ characters', 'error');
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      return toast('Vui lòng xác nhận captcha', 'error');
    }
    setLoading(true);
    try {
      await register(email, password, name, turnstileToken);
      toast('Account created');
      nav('/');
    } catch (e) {
      toast(e.message, 'error');
      // Reset Turnstile vì token chỉ dùng 1 lần
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
          <div className="text-sm text-ink-400 mt-1">Create your account</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={8} />
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
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <div className="flex items-center gap-3 my-4 text-xs text-ink-400">
          <div className="flex-1 h-px bg-ink-700" /> or{' '}
          <div className="flex-1 h-px bg-ink-700" />
        </div>
        <button className="btn btn-ghost w-full justify-center" onClick={google}>
          Continue with Google
        </button>
        <div className="text-center text-sm text-ink-400 mt-4">
          Have an account? <Link to="/login" className="text-accent">Sign in</Link>
        </div>
      </div>
    </div>
  );
}