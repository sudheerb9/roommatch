import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const EMPTY_PREFS = {
  preferred_sleep_schedule: '',
  preferred_cleanliness_level: '',
  preferred_noise_tolerance: '',
  preferred_smoking_preference: '',
  preferred_drinking_preference: '',
  preferred_social_behavior: '',
  preferred_study_preferences: '',
};

const OPTIONS = {
  preferred_sleep_schedule: [
    { value: '', label: 'Select…' },
    { value: 'no_preference', label: 'No preference' },
    { value: 'early_bird', label: 'Early bird' },
    { value: 'night_owl', label: 'Night owl' },
  ],
  preferred_cleanliness_level: [
    { value: '', label: 'Select…' },
    { value: 'no_preference', label: 'No preference' },
    { value: 'very_neat', label: 'Very neat' },
    { value: 'clean', label: 'Clean' },
    { value: 'average', label: 'Average' },
    { value: 'relaxed', label: 'Relaxed' },
  ],
  preferred_noise_tolerance: [
    { value: '', label: 'Select…' },
    { value: 'no_preference', label: 'No preference' },
    { value: 'very_sensitive', label: 'Very sensitive' },
    { value: 'sensitive', label: 'Sensitive' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'tolerant', label: 'Tolerant' },
  ],
  preferred_smoking_preference: [
    { value: '', label: 'Select…' },
    { value: 'no_preference', label: 'No preference' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  preferred_drinking_preference: [
    { value: '', label: 'Select…' },
    { value: 'no_preference', label: 'No preference' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ],
  preferred_social_behavior: [
    { value: '', label: 'Select…' },
    { value: 'no_preference', label: 'No preference' },
    { value: 'very_social', label: 'Very social' },
    { value: 'social', label: 'Social' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'introverted', label: 'Introverted' },
  ],
  preferred_study_preferences: [
    { value: '', label: 'Select…' },
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
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full h-12 px-4 bg-white/70 border border-transparent focus:border-[#d2b53b]/50 focus:bg-white focus:ring-4 focus:ring-[#d2b53b]/10 rounded-2xl transition-all duration-300 font-medium text-[#100e06] shadow-sm hover:bg-white/90 appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value || 'empty'} value={opt.value}>
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
  const [form, setForm] = useState(EMPTY_PREFS);
  const [savedMsg, setSavedMsg] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setForm({
        preferred_sleep_schedule: 'no_preference',
        preferred_cleanliness_level: 'clean',
        preferred_noise_tolerance: 'moderate',
        preferred_smoking_preference: 'no_preference',
        preferred_drinking_preference: 'no_preference',
        preferred_social_behavior: 'no_preference',
        preferred_study_preferences: 'moderate',
      });
      setLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, []);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setTimeout(() => {
      setSaving(false);
      setSavedMsg('Preferences saved locally (API wiring in a follow-up).');
    }, 600);
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#fbf9f1] flex items-center justify-center overflow-hidden relative">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#ebd98d]/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d2b53b]/20 rounded-full blur-[120px] animate-pulse" />

        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/50 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#d2b53b] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#100e06] font-medium tracking-wide">
              Loading your preferences…
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f1] p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#ebd98d]/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-[#d2b53b]/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] bg-[#ebd060]/15 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
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
            <h1 className="text-4xl md:text-5xl font-bold text-[#100e06]">
              Curate Your <span className="text-[#d2b53b]">Vibe</span>
            </h1>
            <p className="text-[#100e06]/60 text-lg max-w-lg mx-auto leading-relaxed">
              Tell us what you prefer in a roommate so we can rank better
              matches. Leave fields blank or choose “No preference” if it does
              not matter.
            </p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-white/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-10 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[#ebd98d]/30 pb-4 mb-2">
                <div className="p-2.5 bg-[#d2b53b]/10 rounded-2xl text-[#d2b53b] text-xl">
                  🏠
                </div>
                <h2 className="text-2xl font-bold text-[#100e06]">
                  Living preferences
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
              <div className="flex items-center gap-3 border-b border-[#ebd98d]/30 pb-4 mb-2">
                <div className="p-2.5 bg-[#d2b53b]/10 rounded-2xl text-[#d2b53b] text-xl">
                  🌿
                </div>
                <h2 className="text-2xl font-bold text-[#100e06]">
                  Social & lifestyle
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <SelectField
                  id="preferred_smoking_preference"
                  label="Smoking"
                  icon={<span>🚭</span>}
                  field="preferred_smoking_preference"
                  value={form.preferred_smoking_preference}
                  options={OPTIONS.preferred_smoking_preference}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_drinking_preference"
                  label="Drinking"
                  icon={<span>🥂</span>}
                  field="preferred_drinking_preference"
                  value={form.preferred_drinking_preference}
                  options={OPTIONS.preferred_drinking_preference}
                  onChange={handleChange}
                />
                <SelectField
                  id="preferred_social_behavior"
                  label="Social style"
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
                className="rounded-2xl border border-[#d2b53b]/40 bg-[#d2b53b]/10 px-4 py-3 text-sm text-[#100e06]"
                role="status"
              >
                {savedMsg}
              </div>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full h-14 bg-[#d2b53b] hover:bg-[#bfa330] disabled:opacity-70 text-white rounded-2xl text-lg font-bold shadow-lg shadow-[#d2b53b]/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Saving…
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Save preferences
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-[#d2b53b] hover:text-[#bfa330] font-medium transition-colors border-b border-transparent hover:border-[#d2b53b]/50 pb-0.5"
          >
            Back to profile <span className="text-xl">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
