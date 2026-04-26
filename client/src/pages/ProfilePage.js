import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function InitialsAvatar({ name }) {
  const initial = (name || 'U').trim().slice(0, 1).toUpperCase();
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 scale-110 rounded-full bg-[#881c1c] opacity-20 blur" />
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#7a0019] to-[#881c1c] text-4xl font-bold text-white shadow-xl ring-[6px] ring-white">
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
      className={classNames('animate-pulse rounded-2xl bg-[#881c1c]/10', className)}
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
  const [details, setDetails] = useState({ bio: '', gender: '' });
  const [savedPreferences, setSavedPreferences] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErrorMsg(null);
        const payload = await apiFetch('/profile/me');
        if (cancelled) return;

        const user = payload?.user || {};
        const p = payload?.profile || {};
        const prefs = payload?.preferences || null;

        setProfile({
          name: user.display_name || user.email || 'User',
          email: user.email || '',
        });

        setDetails({
          bio: p.bio ?? '',
          gender: p.gender ?? '',
        });
        setSavedPreferences(prefs);

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Failed to load profile');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="w-full max-w-xl flex flex-col items-center gap-6 rounded-3xl border border-[#881c1c]/20 bg-white/60 p-8 shadow-xl shadow-[#7a0019]/5 backdrop-blur-xl">
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
            to="/home"
            className="inline-flex items-center justify-center rounded-xl bg-[#881c1c] px-6 py-3 font-medium text-white transition-colors hover:bg-[#7a0019]"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between sm:mb-12">
          <Link to="/home" className="group">
            <div className="flex items-center gap-3 pl-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#100e06] shadow-sm backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:bg-[#881c1c] group-hover:text-white">
                <span className="text-lg leading-none">←</span>
              </div>
              <span className="hidden font-semibold text-[#100e06]/80 transition-colors group-hover:text-[#100e06] sm:block">
                Back
              </span>
            </div>
          </Link>

          <div className="rounded-full border border-[#881c1c]/15 bg-white/60 px-4 py-2 shadow-sm backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-widest text-[#881c1c]">
              Profile View
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#881c1c]/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

              <div className="flex flex-col items-center text-center relative z-10">
                <InitialsAvatar name={profile.name} />

                <h1 className="text-3xl font-bold text-[#100e06] mb-1">
                  {profile.name}
                </h1>
                <p className="text-[#100e06]/60 font-medium">{profile.email}</p>

                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-[#881c1c]/30 to-transparent" />

                <div className="grid w-full gap-3">
                  <Link
                    to="/preferences"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-base font-medium text-white shadow-lg shadow-[#7a0019]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#7a0019]/30"
                  >
                    Edit Preferences
                  </Link>
                  <Link
                    to="/matches"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#881c1c]/20 bg-white/80 text-sm font-semibold text-[#7a0019] transition-all duration-300 hover:border-[#881c1c]/40 hover:bg-white"
                  >
                    View Matches
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7a0019] to-[#881c1c] p-6 text-[#fbf9f1] shadow-lg shadow-[#7a0019]/25">
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
            <div className="rounded-[2rem] border border-white/60 bg-white/40 p-6 backdrop-blur-md transition-colors duration-500 hover:bg-white/50 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl border border-[#881c1c]/15 bg-white p-2.5 shadow-sm">
                  <span className="font-bold text-[#881c1c]">👤</span>
                </div>
                <h2 className="text-xl font-bold text-[#100e06]">Personal Details</h2>
              </div>

              {errorMsg ? (
                <div
                  className="rounded-2xl border border-[#7a0019]/25 bg-[#7a0019]/10 px-4 py-3 text-sm text-[#100e06]"
                  role="alert"
                >
                  {errorMsg}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/40 bg-white/50 p-4 transition-colors hover:border-[#881c1c]/30">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#100e06]/40">
                    Bio
                  </span>
                  <div className="text-sm font-medium text-[#100e06]/70 leading-relaxed">
                    {details.bio || '—'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/50 p-4 transition-colors hover:border-[#881c1c]/30">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#100e06]/40">
                    Gender
                  </span>
                  <div className="text-sm font-semibold text-[#100e06] capitalize">
                    {details.gender ? String(details.gender).replaceAll('_', ' ') : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[2rem] border border-white/60 bg-white/40 p-6 backdrop-blur-md transition-colors hover:bg-white/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl border border-[#881c1c]/15 bg-white p-2.5 shadow-sm">
                    <span className="font-bold text-[#881c1c]">🏠</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#100e06]">
                    Your saved preferences
                  </h2>
                </div>
                <div className="space-y-3">
                  <PrefPill
                    label="Sleep schedule"
                    value={savedPreferences?.preferred_sleep_schedule || '—'}
                  />
                  <PrefPill
                    label="Cleanliness"
                    value={savedPreferences?.preferred_cleanliness_level || '—'}
                  />
                  <PrefPill
                    label="Noise tolerance"
                    value={savedPreferences?.preferred_noise_tolerance || '—'}
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/60 bg-white/40 p-6 backdrop-blur-md transition-colors hover:bg-white/50">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl border border-[#881c1c]/15 bg-white p-2.5 shadow-sm">
                    <span className="font-bold text-[#881c1c]">🌿</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#100e06]">Lifestyle</h2>
                </div>
                <div className="space-y-3">
                  <PrefPill
                    label="Smoking"
                    value={savedPreferences?.preferred_smoking_preference || '—'}
                  />
                  <PrefPill
                    label="Drinking"
                    value={savedPreferences?.preferred_drinking_preference || '—'}
                  />
                  <PrefPill
                    label="Social behavior"
                    value={savedPreferences?.preferred_social_behavior || '—'}
                  />
                  <PrefPill
                    label="Study preferences"
                    value={savedPreferences?.preferred_study_preferences || '—'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

