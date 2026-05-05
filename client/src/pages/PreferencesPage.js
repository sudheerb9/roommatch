import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const PREFERENCE_KEYS = [
  'preferred_sleep_schedule',
  'preferred_cleanliness_level',
  'preferred_noise_tolerance',
  'preferred_smoking_preference',
  'preferred_drinking_preference',
  'preferred_social_behavior',
  'preferred_study_preferences',
];

const DEFAULT_PREFS = Object.fromEntries(
  PREFERENCE_KEYS.map((k) => [k, 'no_preference']),
);

const OPTIONS = {
  preferred_sleep_schedule: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'early_bird', label: 'Early bird' },
    { value: 'night_owl', label: 'Night owl' },
  ],
  preferred_cleanliness_level: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'clean', label: 'Clean' },
    { value: 'average', label: 'Average' },
    { value: 'relaxed', label: 'Relaxed' },
  ],
  preferred_noise_tolerance: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'sensitive', label: 'Sensitive' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'tolerant', label: 'Tolerant' },
  ],
  preferred_smoking_preference: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  preferred_drinking_preference: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  preferred_social_behavior: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'social', label: 'Social' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'introverted', label: 'Introverted' },
  ],
  preferred_study_preferences: [
    { value: 'no_preference', label: 'No preference' },
    { value: 'studious', label: 'Studious' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'casual', label: 'Casual' },
  ],
};

function SelectField({ id, label, icon, value, field, options, onChange }) {
  return (
    <div className="space-y-2.5">
      <label
        htmlFor={id}
        className="text-[#100e06]/80 font-medium text-sm ml-1 flex items-center gap-2"
      >
        {icon}
        {label}
      </label>
      <select
        id={id}
        required
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-transparent bg-white/70 px-4 font-medium text-[#100e06] shadow-sm transition-all duration-300 hover:bg-white/90 focus:border-[#881c1c]/40 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_PREFS });
  const [savedMsg, setSavedMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErrorMsg(null);
        const payload = await apiFetch('/profile/me');
        const prefs = payload?.preferences || {};
        const next = { ...DEFAULT_PREFS };
        for (const key of PREFERENCE_KEYS) {
          const raw = prefs[key];
          next[key] =
            raw === null || raw === undefined || raw === ''
              ? 'no_preference'
              : String(raw);
        }
        if (!cancelled) {
          setForm(next);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Failed to load preferences');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setErrorMsg(null);

    try {
      const body = {};
      for (const key of PREFERENCE_KEYS) {
        body[key] = form[key] || 'no_preference';
      }
      await apiFetch('/profile/me', { method: 'PUT', body });
      setSavedMsg('Saved.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div className="relative z-10 rounded-3xl border border-[#881c1c]/15 bg-white/50 p-8 shadow-xl shadow-[#7a0019]/5 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#881c1c] border-t-transparent" />
            <span className="text-[#100e06] font-medium tracking-wide">
              Loading your roommate preferences…
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-8 md:mb-12">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 bg-white/50 hover:bg-white/80 text-[#100e06]/80 hover:text-[#100e06] rounded-full px-5 py-2.5 backdrop-blur-sm border border-white/40 transition-all duration-300 shadow-sm hover:shadow-md mb-6"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            <span className="font-medium">Back to profile</span>
          </Link>

          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-[#100e06] md:text-5xl">
              Roommate{' '}
              <span className="bg-gradient-to-r from-[#7a0019] to-[#881c1c] bg-clip-text text-transparent">
                preferences
              </span>
            </h1>
            <p className="text-[#100e06]/60 text-lg max-w-lg mx-auto leading-relaxed">
              What you want in a roommate. Your own habits belong on{' '}
              <Link to="/profile" className="text-[#881c1c] font-medium underline">
                Profile
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#881c1c]/10 bg-white/60 p-6 shadow-xl shadow-[#7a0019]/5 backdrop-blur-xl md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-10 relative">
            {errorMsg ? (
              <div
                className="rounded-2xl border border-[#7a0019]/25 bg-[#7a0019]/10 px-4 py-3 text-sm text-[#100e06]"
                role="alert"
              >
                {errorMsg}
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="mb-2 flex items-center gap-3 border-b border-[#881c1c]/15 pb-4">
                <div className="rounded-2xl bg-[#881c1c]/10 p-2.5 text-xl text-[#881c1c]">
                  🏠
                </div>
                <h2 className="text-2xl font-bold text-[#100e06]">
                  What you prefer in a roommate
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <SelectField
                  id="preferred_sleep_schedule"
                  label="Preferred sleep schedule"
                  icon={<span>🌙</span>}
                  field="preferred_sleep_schedule"
                  value={form.preferred_sleep_schedule}
                  options={OPTIONS.preferred_sleep_schedule}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_cleanliness_level"
                  label="Preferred cleanliness"
                  icon={<span>✨</span>}
                  field="preferred_cleanliness_level"
                  value={form.preferred_cleanliness_level}
                  options={OPTIONS.preferred_cleanliness_level}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_noise_tolerance"
                  label="Preferred noise tolerance"
                  icon={<span>🔉</span>}
                  field="preferred_noise_tolerance"
                  value={form.preferred_noise_tolerance}
                  options={OPTIONS.preferred_noise_tolerance}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_study_preferences"
                  label="Preferred study habits"
                  icon={<span>📚</span>}
                  field="preferred_study_preferences"
                  value={form.preferred_study_preferences}
                  options={OPTIONS.preferred_study_preferences}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-2 flex items-start gap-3 border-b border-[#881c1c]/15 pb-4">
                <div className="rounded-2xl bg-[#881c1c]/10 p-2.5 text-xl text-[#881c1c]">
                  🌿
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#100e06]">
                    Their social & lifestyle habits
                  </h2>
                  <p className="text-sm text-[#100e06]/55 mt-1 font-medium">
                    Smoking, drinking, and how social you prefer a roommate to be
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <SelectField
                  id="preferred_smoking_preference"
                  label="Smoking (roommate)"
                  icon={<span>🚭</span>}
                  field="preferred_smoking_preference"
                  value={form.preferred_smoking_preference}
                  options={OPTIONS.preferred_smoking_preference}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_drinking_preference"
                  label="Drinking (roommate)"
                  icon={<span>🥂</span>}
                  field="preferred_drinking_preference"
                  value={form.preferred_drinking_preference}
                  options={OPTIONS.preferred_drinking_preference}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_social_behavior"
                  label="Social style (roommate)"
                  icon={<span>👥</span>}
                  field="preferred_social_behavior"
                  value={form.preferred_social_behavior}
                  options={OPTIONS.preferred_social_behavior}
                  onChange={handleChange}
                />
              </div>
            </div>

            {savedMsg ? (
              <div
                className="rounded-2xl border border-[#881c1c]/25 bg-[#881c1c]/10 px-4 py-3 text-sm text-[#100e06]"
                role="status"
              >
                {savedMsg}
              </div>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-lg font-bold text-white shadow-lg shadow-[#7a0019]/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-[#7a0019]/30 disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Saving…
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save roommate preferences
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 border-b border-transparent pb-0.5 font-medium text-[#881c1c] transition-colors hover:border-[#881c1c]/50 hover:text-[#7a0019]"
          >
            Back to profile <span className="text-xl">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
