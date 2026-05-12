// Page-level container for GroupHousingEntryPage view state and user interactions.
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function GroupHousingEntryPage() {
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState('');
  const [navError, setNavError] = useState(null);

  function goToGroupPath(pathSuffix) {
    const trimmed = groupId.trim();
    if (!/^\d+$/.test(trimmed)) {
      setNavError('Enter a valid group code.');
      return;
    }
    setNavError(null);
    navigate(`/groups/${trimmed}${pathSuffix}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    goToGroupPath('/housing-preferences');
  }

  function handleGoMatches(e) {
    e.preventDefault();
    goToGroupPath('/matches');
  }

  return (
    <div className="relative p-4 md:p-8">
      <div className="relative z-10 mx-auto max-w-lg">
        <Link
          to="/profile"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#100e06]/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:text-[#100e06] hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to profile
        </Link>

        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/60 p-8 shadow-xl shadow-[#7a0019]/5 backdrop-blur-xl">
          <h1 className="mb-2 text-2xl font-bold text-[#100e06]">
            Group housing preferences
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-[#100e06]/65">
            Enter your group code to open housing preferences or the group
            matching and assignment view.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {navError ? (
              <div
                role="alert"
                className="rounded-2xl border border-[#7a0019]/25 bg-[#7a0019]/10 px-4 py-3 text-sm text-[#100e06]"
              >
                {navError}
              </div>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor="group-id"
                className="ml-1 text-sm font-medium text-[#100e06]/80"
              >
                Group code
              </label>
              <input
                id="group-id"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 1"
                value={groupId}
                onChange={(e) => {
                  setNavError(null);
                  setGroupId(e.target.value);
                }}
                className="h-12 w-full rounded-2xl border border-transparent bg-white/80 px-4 font-medium text-[#100e06] shadow-sm transition-all focus:border-[#881c1c]/40 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-sm font-semibold text-white shadow-md shadow-[#7a0019]/25 transition hover:opacity-95"
              >
                Housing preferences
              </button>
              <button
                type="button"
                onClick={handleGoMatches}
                className="h-12 w-full rounded-2xl border border-[#881c1c]/25 bg-white/90 text-sm font-semibold text-[#7a0019] shadow-sm transition hover:border-[#881c1c]/40 hover:bg-white"
              >
                Matches &amp; assignment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
