import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Dumbbell, Activity, LineChart, Trophy, Target,
  User, Settings, LogOut, Menu, X, Library, Shield, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import RestTimerHost from './RestTimerHost.jsx';

const BASE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/exercises', label: 'Exercises', icon: Activity },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/strength', label: 'Strength', icon: Zap },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/prs', label: 'PRs', icon: Trophy },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/workouts/new', label: 'Workout', icon: Dumbbell },
  { to: '/strength', label: 'Strength', icon: Zap },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();

  const NAV = isAdmin
    ? [...BASE_NAV, { to: '/admin', label: 'Admin', icon: Shield }]
    : BASE_NAV;

  const doLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="min-h-screen flex bg-ink-950 text-white">
      <aside className="hidden lg:flex flex-col w-60 border-r border-ink-700 bg-ink-900">
        <div className="p-5 border-b border-ink-700">
          <div className="text-xl font-bold tracking-tight">
            TGR<span className="text-accent">.</span>PROGRESS
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive
                    ? 'bg-ink-800 text-white border border-ink-700'
                    : 'text-ink-300 hover:bg-ink-850 hover:text-white'
                }`
              }
            >
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-700">
          <div className="text-xs text-ink-400 mb-2 truncate">{user?.email}</div>
          <button className="btn btn-ghost w-full justify-start" onClick={doLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-ink-700 bg-ink-900">
          <button onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold">
            TGR<span className="text-accent">.</span>PROGRESS
          </div>
          <div className="w-5" />
        </header>

        {open && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-64 bg-ink-900 h-full p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between mb-4">
                <div className="font-bold">Menu</div>
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      isActive ? 'bg-ink-800' : 'text-ink-300'
                    }`
                  }
                >
                  <n.icon className="w-4 h-4" /> {n.label}
                </NavLink>
              ))}
              <button
                className="btn btn-ghost w-full mt-4 justify-start"
                onClick={doLogout}
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 min-w-0">{children}</main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-ink-900 border-t border-ink-700 grid grid-cols-5 z-30">
          {MOBILE.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 text-[10px] ${
                  isActive ? 'text-accent' : 'text-ink-400'
                }`
              }
            >
              <n.icon className="w-5 h-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <RestTimerHost />
    </div>
  );
}