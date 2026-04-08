import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function InitialsAvatar({ name }) {
  const initial = (name || 'U').trim().slice(0, 1).toUpperCase();
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 rounded-full bg-[#d2b53b] blur opacity-20 scale-110" />
      <div className="h-32 w-32 rounded-full ring-[6px] ring-white shadow-xl bg-gradient-to-br from-[#d2b53b] to-[#ebd060] flex items-center justify-center text-white text-4xl font-bold relative">
        {initial}
        <div className="absolute bottom-2 right-1 w-6 h-6 bg-green-500 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className }) {
  return (
    <div
      className={classNames('animate-pulse rounded-2xl bg-[#ebd98d]/20', className)}
    />
  );
}

function PrefPill({ label, value }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/40 hover:bg-white/80 transition-colors">
      <span className="text-sm font-medium text-[#100e06]/70">{label}</span>
      <span className="text-sm font-semibold text-[#100e06] capitalize bg-white px-3 py-1 rounded-full shadow-sm">
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // UI-first: mock profile data (replace with real /api/profile later).
    const t = setTimeout(() => {
      setProfile({
        name: 'Sai Teja',
        email: 'sai85886@umass.edu',
        occupation: 'Student',
        location: 'Amherst, MA',
        gender: 'prefer_not_to_say',
        preferences: {
          cleanliness: 'clean',
          nightOwl: 'night owl',
          smoker: 'no',
        },
      });
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const genderLabel = useMemo(() => {
    if (!profile?.gender) return '';
    return String(profile.gender).replaceAll('_', ' ');
  }, [profile?.gender]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[#ebd98d]/30 max-w-xl w-full flex flex-col items-center gap-6">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="space-y-3 w-full flex flex-col items-center">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-xl" />
          </div>
          <div className="w-full grid grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl border border-red-200/50 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-[#100e06] mb-2">
            Profile Not Found
          </h2>
          <p className="text-[#100e06]/60 mb-6">
            Failed to load profile information.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-[#100e06] text-white rounded-xl px-6 py-3 font-medium"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#ebd98d]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#ebd060]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <Link to="/" className="group">
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-[#100e06] group-hover:scale-110 group-hover:bg-[#d2b53b] group-hover:text-white transition-all duration-300">
                <span className="text-lg leading-none">←</span>
              </div>
              <span className="font-semibold text-[#100e06]/80 group-hover:text-[#100e06] transition-colors hidden sm:block">
                Back
              </span>
            </div>
          </Link>

          <div className="px-4 py-2 bg-white/60 backdrop-blur rounded-full border border-white/50 shadow-sm">
            <span className="text-xs font-bold tracking-widest uppercase text-[#d2b53b]">
              Profile View
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ebd98d]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10">
                <InitialsAvatar name={profile.name} />

                <h1 className="text-3xl font-bold text-[#100e06] mb-1">
                  {profile.name}
                </h1>
                <p className="text-[#100e06]/60 font-medium">{profile.email}</p>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#d2b53b]/30 to-transparent my-6" />

                <Link
                  to="/preferences"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#100e06] hover:bg-[#2a2a2a] text-[#fbf9f1] h-12 rounded-xl text-base font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  Edit Preferences
                </Link>
              </div>
            </div>

            <div className="bg-[#d2b53b] text-[#fbf9f1] rounded-[2rem] p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10 text-white text-8xl">
                ⚡
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1">Looking for Roomie?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Your profile is visible to others.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Active Status
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] p-6 sm:p-8 hover:bg-white/50 transition-colors duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#ebd98d]/20">
                  <span className="text-[#d2b53b] font-bold">👤</span>
                </div>
                <h2 className="text-xl font-bold text-[#100e06]">
                  Personal Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/50 border border-white/40 hover:border-[#d2b53b]/30 transition-colors">
                  <span className="text-xs font-bold text-[#100e06]/40 uppercase tracking-wider block mb-1">
                    Occupation
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d2b53b]">💼</span>
                    <span className="text-lg font-semibold text-[#100e06]">
                      {profile.occupation}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/50 border border-white/40 hover:border-[#d2b53b]/30 transition-colors">
                  <span className="text-xs font-bold text-[#100e06]/40 uppercase tracking-wider block mb-1">
                    Location
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d2b53b]">📍</span>
                    <span className="text-lg font-semibold text-[#100e06]">
                      {profile.location}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/50 border border-white/40 hover:border-[#d2b53b]/30 transition-colors col-span-1 sm:col-span-2">
                  <span className="text-xs font-bold text-[#100e06]/40 uppercase tracking-wider block mb-1">
                    Gender
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-[#100e06] capitalize">
                      {genderLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] p-6 hover:bg-white/50 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#ebd98d]/20">
                    <span className="text-[#d2b53b] font-bold">🏠</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#100e06]">
                    Living Habits
                  </h2>
                </div>
                <div className="space-y-3">
                  <PrefPill label="Cleanliness" value={profile.preferences.cleanliness} />
                  <PrefPill label="Night owl" value={profile.preferences.nightOwl} />
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] p-6 hover:bg-white/50 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#ebd98d]/20">
                    <span className="text-[#d2b53b] font-bold">🌿</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#100e06]">Lifestyle</h2>
                </div>
                <div className="space-y-3">
                  <PrefPill label="Smoker" value={profile.preferences.smoker} />
                  <div className="flex items-center justify-center p-4 border border-dashed border-[#100e06]/10 rounded-xl text-xs text-[#100e06]/40">
                    More preferences coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

