import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Lock, Mail, Sparkles } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // توکن فرضی و کاربر ماک برای تست فعلی
    setAuth('mock-jwt-token-12345', {
      id: '1',
      email,
      fullName: 'مدیر سیستم',
      role: 'superadmin',
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden p-4">
      {/* هاله نور پس‌زمینه */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[var(--neon-blue)] opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[var(--neon-pink)] opacity-20 blur-[120px] rounded-full pointer-events-none" />

      <div 
        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 relative z-10 shadow-2xl"
        style={{ boxShadow: '0 0 40px var(--glow-purple)' }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-gradient)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--glow-pink)]">
            <Sparkles className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold bg-[var(--accent-gradient)] bg-clip-text text-transparent">
            ورود به پنل مدیریت
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2">اطلاعات حساب کاربری خود را وارد کنید</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">ایمیل</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute right-3.5 top-3 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--neon-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-blue)] text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">رمز عبور</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute right-3.5 top-3 text-[var(--text-muted)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--neon-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-purple)] text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[var(--accent-gradient)] font-bold text-slate-950 hover:opacity-90 transition-all shadow-lg shadow-[var(--glow-pink)] active:scale-[0.98]"
          >
            ورود به سیستم
          </button>
        </form>
      </div>
    </div>
  );
}