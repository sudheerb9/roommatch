// Page-level container for ProfilePage view state and user interactions.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

const LIFESTYLE_KEYS = [
  'gender',
  'sleep_schedule',
  'cleanliness_level',
  'noise_tolerance',
  'smoking_preference',
  'drinking_preference',
  'social_behavior',
  'study_preferences',
];

const EMPTY_LIFESTYLE = Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, '']));

const GENDER_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'cis_male', label: 'Cis male' },
  { value: 'cis_female', label: 'Cis female' },
  { value: 'trans_male', label: 'Trans male' },
  { value: 'trans_female', label: 'Trans female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LIFESTYLE_OPTIONS = {
  sleep_schedule: [
    { value: '', label: 'Select…' },
    { value: 'early_bird', label: 'Early bird' },
    { value: 'night_owl', label: 'Night owl' },
  ],
  cleanliness_level: [
    { value: '', label: 'Select…' },
    { value: 'clean', label: 'Clean' },
    { value: 'average', label: 'Average' },
    { value: 'relaxed', label: 'Relaxed' },
  ],
  noise_tolerance: [
    { value: '', label: 'Select…' },
    { value: 'sensitive', label: 'Sensitive' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'tolerant', label: 'Tolerant' },
  ],
  smoking_preference: [
    { value: '', label: 'Select…' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  drinking_preference: [
    { value: '', label: 'Select…' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  social_behavior: [
    { value: '', label: 'Select…' },
    { value: 'social', label: 'Social' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'introverted', label: 'Introverted' },
  ],
  study_preferences: [
    { value: '', label: 'Select…' },
    { value: 'studious', label: 'Studious' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'casual', label: 'Casual' },
  ],
};

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

function formatFieldLabel(key) {
  return key.replace(/_/g, ' ');
}

/** Friendly copy for “about you” habits on the profile form (API field names unchanged). */
const LIFESTYLE_FIELD_LABELS = {
  gender: 'How do you identify?',
  sleep_schedule: 'Are you more of an early bird or a night owl?',
  cleanliness_level: 'How tidy do you keep your living space?',
  noise_tolerance: 'How sensitive are you to noise?',
  smoking_preference: 'Are you a smoker?',
  drinking_preference: 'Are you a drinker?',
  social_behavior: 'How social are you at home?',
  study_preferences: "How do you usually study when you're at home?",
};

function lifestyleFieldLabel(field) {
  return LIFESTYLE_FIELD_LABELS[field] ?? formatFieldLabel(field);
}

/** Same label style for every habit field (matches gender / sleep / etc.). */
function lifestyleFieldLabelClass() {
  return 'text-xs font-bold uppercase tracking-wider text-[#100e06]/40';
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [userCard, setUserCard] = useState(null);
  const [bio, setBio] = useState('');
  const [lifestyle, setLifestyle] = useState({ ...EMPTY_LIFESTYLE });
  const [errorMsg, setErrorMsg] = useState(null);
  const [profileSaveMsg, setProfileSaveMsg] = useState(null);
  const [matchingEligible, setMatchingEligible] = useState(false);

  async function loadAll() {
    setErrorMsg(null);
    const payload = await apiFetch('/profile/me');
    const user = payload?.user || {};
    const p = payload?.profile || {};
    // Fall back to profile presence for compatibility with older API payloads.
    const eligibleFlag =
      payload?.matching_eligible === true ||
      payload?.matching_eligible === 1 ||
      Boolean(payload?.profile);
    setMatchingEligible(Boolean(eligibleFlag));
    setUserCard({
      name: user.display_name || user.email || 'User',
      email: user.email || '',
    });

    setBio(p.bio ?? '');
    const next = { ...EMPTY_LIFESTYLE };
    for (const k of LIFESTYLE_KEYS) {
      next[k] = p[k] == null || p[k] === undefined ? '' : String(p[k]);
    }
    setLifestyle(next);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadAll();
        if (!cancelled) setLoading(false);
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

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaveMsg(null);
    setErrorMsg(null);
    for (const k of LIFESTYLE_KEYS) {
      if (!lifestyle[k]) {
        setErrorMsg(`Please answer: ${lifestyleFieldLabel(k)}`);
        return;
      }
    }
    setSavingProfile(true);
    try {
      const body = { ...lifestyle, bio: bio.trim() === '' ? null : bio };
      await apiFetch('/profile/me', { method: 'PUT', body });
      setProfileSaveMsg('Profile saved.');
      await loadAll();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

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

  if (!userCard) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl border border-red-200/50 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-[#100e06] mb-2">
            Profile Not Found
          </h2>
          <p className="text-[#100e06]/60 mb-6">
            {errorMsg || 'Failed to load profile information.'}
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
        <div className="mb-8 flex items-center justify-end sm:mb-12">
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
                <InitialsAvatar name={userCard.name} />

                <h1 className="text-3xl font-bold text-[#100e06] mb-1">
                  {userCard.name}
                </h1>
                <p className="text-[#100e06]/60 font-medium">{userCard.email}</p>

                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-[#881c1c]/30 to-transparent" />

                <div className="grid w-full gap-3">
                  <Link
                    to="/preferences"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-base font-medium text-white shadow-lg shadow-[#7a0019]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#7a0019]/30"
                  >
                    Edit roommate preferences
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
                  {matchingEligible
                    ? "You're visible to others and included in roommate matching."
                    : 'Save your lifestyle profile below to activate matching.'}
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  <span
                    className={`w-2 h-2 rounded-full ${matchingEligible ? 'bg-green-400' : 'bg-zinc-400'}`}
                  />
                  {matchingEligible ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {errorMsg ? (
              <div
                className="rounded-2xl border border-[#7a0019]/25 bg-[#7a0019]/10 px-4 py-3 text-sm text-[#100e06]"
                role="alert"
              >
                {errorMsg}
              </div>
            ) : null}

            {profileSaveMsg ? (
              <div
                className="rounded-2xl border border-[#881c1c]/25 bg-[#881c1c]/10 px-4 py-3 text-sm text-[#100e06]"
                role="status"
              >
                {profileSaveMsg}
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-white/60 bg-white/40 p-6 backdrop-blur-md transition-colors duration-500 hover:bg-white/50 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl border border-[#881c1c]/15 bg-white p-2.5 shadow-sm">
                  <span className="font-bold text-[#881c1c]">👤</span>
                </div>
                <h2 className="text-xl font-bold text-[#100e06]">Bio</h2>
              </div>
              <p className="text-sm text-[#100e06]/55 mb-3">
                Optional. Saved with your lifestyle details below.
              </p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-[#100e06] shadow-sm focus:border-[#881c1c]/40 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10"
                placeholder="Tell roommates what it’s like living with you…"
              />
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="rounded-[2rem] border border-white/60 bg-white/40 p-6 backdrop-blur-md transition-colors hover:bg-white/50 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-[#881c1c]/15 bg-white p-2.5 shadow-sm">
                    <span className="font-bold text-[#881c1c]">🏠</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#100e06]">
                      Your lifestyle
                    </h2>
                    <p className="text-sm text-[#100e06]/55 mt-1">
                      How you live day to day (required for matching).
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-[#881c1c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#7a0019] disabled:opacity-60"
                >
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={lifestyleFieldLabelClass('gender')}>
                    {lifestyleFieldLabel('gender')}{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={lifestyle.gender}
                    onChange={(e) =>
                      setLifestyle((s) => ({ ...s, gender: e.target.value }))
                    }
                    className="h-12 w-full rounded-2xl border border-transparent bg-white/70 px-4 font-medium text-[#100e06] shadow-sm focus:border-[#881c1c]/40 focus:bg-white"
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value || 'x'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {[
                  'sleep_schedule',
                  'cleanliness_level',
                  'noise_tolerance',
                  'smoking_preference',
                  'drinking_preference',
                  'social_behavior',
                  'study_preferences',
                ].map((field) => (
                  <div key={field} className="space-y-2">
                    <label className={lifestyleFieldLabelClass(field)}>
                      {lifestyleFieldLabel(field)}{' '}
                      <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      value={lifestyle[field]}
                      onChange={(e) =>
                        setLifestyle((s) => ({ ...s, [field]: e.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-transparent bg-white/70 px-4 font-medium text-[#100e06] shadow-sm focus:border-[#881c1c]/40 focus:bg-white"
                    >
                      {LIFESTYLE_OPTIONS[field].map((o) => (
                        <option key={o.value || 'x'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
