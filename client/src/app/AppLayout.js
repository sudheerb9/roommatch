import { NavLink, Outlet } from 'react-router-dom';

function TopNav() {
  const linkClass = ({ isActive }) =>
    [
      'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
      isActive
        ? 'bg-[#d2b53b] text-white border-transparent shadow-sm'
        : 'bg-white/70 text-[#100e06]/80 border-[#ebd98d]/40 hover:bg-white hover:text-[#100e06]',
    ].join(' ');

  return (
    <header className="sticky top-0 z-10 border-b border-[#ebd98d]/30 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3 font-semibold tracking-tight text-[#100e06]">
          <span
            className="h-9 w-9 rounded-2xl bg-[#d2b53b]/15 border border-[#ebd98d]/40 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#d2b53b]" />
          </span>
          <span>RoomMatch</span>
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Primary navigation">
          <NavLink className={linkClass} to="/profile">
            Profile
          </NavLink>
          <NavLink className={linkClass} to="/preferences">
            Preferences
          </NavLink>
          <NavLink className={linkClass} to="/chat">
            Chat
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#fbf9f1] text-[#100e06]">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

