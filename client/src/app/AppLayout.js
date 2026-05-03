import { LogOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import LandingBackdrop from '../components/layout/LandingBackdrop';
import { getBearerToken, setBearerToken } from '../utils/api';

function TopNav() {
  const [tokenPreview, setTokenPreview] = useState(() => getBearerToken());
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('http://localhost:3001/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getBearerToken()}`,
          'Content-Type': 'application/json',
        },
      });

      // Clear token from localStorage
      window.localStorage.removeItem('roommatch_bearer_token');
      setBearerToken(null);
      setTokenPreview(null);

      // Redirect to home
      navigate('/home');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const linkClass = ({ isActive }) =>
    [
      'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
      isActive
        ? 'border-transparent bg-[#881c1c] text-white shadow-md shadow-[#7a0019]/25'
        : 'border-[#881c1c]/20 bg-white/70 text-[#100e06]/80 hover:border-[#881c1c]/35 hover:bg-white hover:text-[#100e06]',
    ].join(' ');

  const tokenLabel = useMemo(() => {
    if (!tokenPreview) return 'Set token';
    return `Token: ${tokenPreview.slice(0, 10)}…`;
  }, [tokenPreview]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#881c1c]/15 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          to="/home"
          className="flex items-center gap-3 font-semibold tracking-tight text-[#100e06] transition-opacity hover:opacity-90"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#881c1c]/25 bg-gradient-to-br from-[#7a0019]/15 to-[#881c1c]/10"
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#881c1c]" />
          </span>
          <span>RoomMatch</span>
        </Link>

        <nav
          className="flex flex-wrap items-center justify-end gap-2"
          aria-label="Primary navigation"
        >
          <NavLink className={linkClass} to="/profile">
            Profile
          </NavLink>
          <NavLink className={linkClass} to="/preferences">
            Preferences
          </NavLink>
          <NavLink className={linkClass} to="/group-housing">
            Group housing
          </NavLink>
          <NavLink className={linkClass} to="/group-invitations">
            Invite
          </NavLink>
          <NavLink className={linkClass} to="/matches">
            Matches
          </NavLink>
          <NavLink className={linkClass} to="/chat">
            Chat
          </NavLink>
          <button
            type="button"
            className="rounded-xl border border-[#881c1c]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#100e06]/80 transition-all hover:border-[#881c1c]/35 hover:bg-white hover:text-[#100e06]"
            onClick={() => {
              const next = window.prompt(
                'Paste Bearer token (blank to clear):',
                getBearerToken()
              );
              if (next === null) return;
              const stored = setBearerToken(next);
              setTokenPreview(stored);
            }}
            title="Used for calling /profile/me and /matches"
          >
            {tokenLabel}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-xl border border-[#881c1c]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#100e06]/80 transition-all hover:border-[#881c1c]/35 hover:bg-white hover:text-[#100e06] disabled:opacity-60 disabled:cursor-not-allowed"
            title="Sign out of your account"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function AppLayout() {
  return (
    <div className="relative min-h-screen text-[#100e06]">
      <LandingBackdrop />
      <div className="relative z-10">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
