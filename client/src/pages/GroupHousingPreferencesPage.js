import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ApiErrorState from '../components/ui/ApiErrorState';
import { apiFetch } from '../utils/api';

const AMENITY_OPTIONS = [
  { key: 'parking', label: 'Parking' },
  { key: 'elevator', label: 'Elevator' },
  { key: 'laundry', label: 'Laundry in building' },
  { key: 'gym', label: 'Gym' },
  { key: 'study_lounge', label: 'Study lounge' },
  { key: 'pet_friendly', label: 'Pet friendly' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'ac', label: 'Air conditioning' },
];

const EMPTY_AMENITY_SELECTION = Object.fromEntries(
  AMENITY_OPTIONS.map((opt) => [opt.key, false])
);

const EMPTY_FORM = {
  preferred_bedrooms: '',
  preferred_bathrooms: '',
  preferred_floor: '',
  amenitiesSelected: { ...EMPTY_AMENITY_SELECTION },
  amenitiesOther: '',
};

const FLOOR_OPTIONS = [
  { value: '', label: 'Leave unset' },
  { value: 'any', label: 'Any floor' },
  { value: 'low', label: 'Low' },
  { value: 'middle', label: 'Middle' },
  { value: 'high', label: 'High' },
];

const BEDROOM_OPTIONS = [
  { value: '', label: 'Leave unset' },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} bedroom${i + 1 === 1 ? '' : 's'}`,
  })),
];

function isPlainObject(v) {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function formatAmenityKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getDisplayGroupName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return '';
  if (/^Group \d+$/i.test(trimmed)) return 'My group';
  return trimmed;
}

/** @param {Record<string, any> | null} housing_preferences */
function normalizeFromApi(housing_preferences) {
  if (!housing_preferences || typeof housing_preferences !== 'object') {
    return { ...EMPTY_FORM };
  }

  const p = housing_preferences;
  const amenitiesSelected = { ...EMPTY_AMENITY_SELECTION };
  const otherAmenities = [];

  if (isPlainObject(p.amenities)) {
    // Keep known amenities as toggles and preserve unknown ones as "other".
    for (const [key, value] of Object.entries(p.amenities)) {
      if (Object.prototype.hasOwnProperty.call(amenitiesSelected, key)) {
        amenitiesSelected[key] = Boolean(value);
        continue;
      }
      if (key === 'other' && Array.isArray(value)) {
        for (const row of value) {
          const item = String(row || '').trim();
          if (item) otherAmenities.push(item);
        }
        continue;
      }
      if (value === true) {
        otherAmenities.push(formatAmenityKey(key));
      }
    }
  }

  return {
    preferred_bedrooms: (() => {
      if (p.preferred_bedrooms == null) return '';
      const n = Number(p.preferred_bedrooms);
      return Number.isInteger(n) && n >= 1 && n <= 10 ? String(n) : '';
    })(),
    preferred_bathrooms:
      p.preferred_bathrooms == null || p.preferred_bathrooms === ''
        ? ''
        : String(p.preferred_bathrooms),
    preferred_floor:
      typeof p.preferred_floor === 'string' ? p.preferred_floor : '',
    amenitiesSelected,
    amenitiesOther: otherAmenities.join('\n'),
  };
}

/** @returns {{ ok: true, body: Record<string, unknown> } | { ok: false, errors: Record<string, string>, banner?: string }} */

function validateAndBuildBody(form) {
  /** @type {Record<string, string>} */
  const errors = {};

  let preferred_bedrooms = null;
  if (form.preferred_bedrooms === '') {
    preferred_bedrooms = null;
  } else {
    const n = Number.parseInt(form.preferred_bedrooms, 10);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      errors.preferred_bedrooms =
        'Choose a bedroom count from 1–10 or leave unset.';
    } else {
      preferred_bedrooms = n;
    }
  }

  let preferred_bathrooms = null;
  if (form.preferred_bathrooms === '') {
    preferred_bathrooms = null;
  } else {
    const raw = Number.parseFloat(String(form.preferred_bathrooms).trim());
    if (Number.isNaN(raw) || raw < 0 || raw > 99.9) {
      errors.preferred_bathrooms =
        'Bathrooms must be blank or between 0 and 99.9.';
    } else {
      preferred_bathrooms = Math.round(raw * 10) / 10;
    }
  }

  let preferred_floor = null;
  const allowedFloors = new Set(['any', 'low', 'middle', 'high']);
  if (form.preferred_floor === '') {
    preferred_floor = null;
  } else if (!allowedFloors.has(form.preferred_floor)) {
    errors.preferred_floor = 'Floor must match one of the listed options.';
  } else {
    preferred_floor = form.preferred_floor;
  }

  const amenitiesObject = {};
  for (const opt of AMENITY_OPTIONS) {
    if (form.amenitiesSelected?.[opt.key] === true) {
      amenitiesObject[opt.key] = true;
    }
  }
  const otherAmenities = String(form.amenitiesOther || '')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .slice(0, 30);
  if (otherAmenities.length > 0) {
    amenitiesObject.other = otherAmenities;
  }
  // Send null when no amenities are selected to keep payload explicit.
  const amenities =
    Object.keys(amenitiesObject).length > 0 ? amenitiesObject : null;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    body: {
      preferred_bedrooms,
      preferred_bathrooms,
      preferred_floor,
      amenities,
    },
  };
}

export default function GroupHousingPreferencesPage() {
  const { groupId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [bannerError, setBannerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedMsg, setSavedMsg] = useState(null);
  const [hasStoredRow, setHasStoredRow] = useState(null);
  const [pageError, setPageError] = useState(null);

  const numericGroupIdOk = typeof groupId === 'string' && /^\d+$/.test(groupId);

  const load = useCallback(
    async (opts = {}) => {
      const { preserveSaved = false } = opts;
      if (!numericGroupIdOk || !groupId) {
        setLoading(false);
        return;
      }
      setBannerError('');
      setPageError(null);
      if (!preserveSaved) {
        setSavedMsg(null);
      }
      setFieldErrors({});
      setLoading(true);
      try {
        const [prefsPayload, groupPayload] = await Promise.all([
          apiFetch(`/groups/${groupId}/housing-preferences`),
          apiFetch(`/groups/${groupId}`),
        ]);
        const row = prefsPayload?.housing_preferences ?? null;
        const nextGroupName = getDisplayGroupName(groupPayload?.group?.name);

        // Distinguish "no saved row yet" from a saved row containing mostly nulls.
        setHasStoredRow(Boolean(row));
        setForm(normalizeFromApi(row));
        setGroupName(nextGroupName);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load housing preferences.';
        if (err?.status === 403 || err?.status === 404) {
          setPageError({ status: err.status, message });
        } else {
          setBannerError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [groupId, numericGroupIdOk]
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSavedMsg(null);
    const result = validateAndBuildBody(form);
    if (!result.ok) {
      setFieldErrors(result.errors || {});
      setBannerError(result.banner ?? '');
      return;
    }

    setBannerError('');
    setFieldErrors({});
    setSaving(true);
    try {
      await apiFetch(`/groups/${groupId}/housing-preferences`, {
        method: 'PUT',
        body: result.body,
      });

      await load({ preserveSaved: true });

      setSavedMsg('Saved.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to save housing preferences.';
      if (err?.status === 403 || err?.status === 404) {
        setPageError({ status: err.status, message });
      } else {
        setBannerError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setFieldErrors((er) => {
      const next = { ...er };
      delete next[field];
      return next;
    });
    setBannerError('');
    setSavedMsg(null);
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAmenityToggle(key, checked) {
    setBannerError('');
    setSavedMsg(null);
    setForm((f) => ({
      ...f,
      amenitiesSelected: {
        ...(f.amenitiesSelected || EMPTY_AMENITY_SELECTION),
        [key]: checked,
      },
    }));
  }

  if (!numericGroupIdOk || !groupId) {
    return (
      <div className="relative p-4 md:p-8">
        <div className="relative z-10 mx-auto max-w-lg rounded-[2rem] border border-[#7a0019]/25 bg-[#7a0019]/10 px-6 py-5 text-[#100e06]">
          Invalid group link.{' '}
          <Link
            to="/group-housing"
            className="ml-1 font-semibold text-[#881c1c] underline"
          >
            Pick a valid group
          </Link>
          .
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <ApiErrorState
        status={pageError.status}
        message={pageError.message}
        retryLabel="Try again"
        onRetry={() => load()}
      />
    );
  }

  if (loading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div className="relative z-10 rounded-3xl border border-[#881c1c]/15 bg-white/50 p-8 shadow-xl shadow-[#7a0019]/5 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#881c1c] border-t-transparent" />

            <span className="font-medium tracking-wide text-[#100e06]">
              Loading group housing preferences…
            </span>
          </div>
        </div>
      </div>
    );
  }

  const inputWarn = (field) =>
    fieldErrors[field]
      ? 'border-[#881c1c]/60 bg-[#7a0019]/5 focus:border-[#881c1c]/55'
      : 'border-transparent focus:border-[#881c1c]/40';

  return (
    <div className="relative p-4 md:p-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-10 text-center space-y-2">
          <div className="mb-4 flex justify-start">
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#100e06]/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:text-[#100e06] hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to groups
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#100e06] md:text-4xl">
            Housing preferences for{' '}
            <span className="text-[#881c1c]">{groupName || 'your group'}</span>
          </h1>

          <p className="mx-auto max-w-xl text-[#100e06]/65">
            Describes what kind of apartment or unit your group prefers.
          </p>

          <p className="text-sm">
            <Link
              to={`/groups/${groupId}/matches`}
              className="font-semibold text-[#881c1c] underline decoration-[#881c1c]/30 underline-offset-4 hover:decoration-[#881c1c]"
            >
              View group matches &amp; housing assignment
            </Link>
          </p>

          {hasStoredRow === false ? (
            <p className="text-sm text-[#100e06]/55">
              No preferences saved yet.
            </p>
          ) : null}
        </header>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#881c1c]/10 bg-white/60 p-6 shadow-xl shadow-[#7a0019]/5 backdrop-blur-xl md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50" />

          <form onSubmit={handleSubmit} className="relative space-y-8">
            {bannerError ? (
              <div
                role="alert"
                className="rounded-2xl border border-[#7a0019]/25 bg-[#7a0019]/10 px-4 py-3 text-sm text-[#100e06]"
              >
                {bannerError}
              </div>
            ) : null}

            {savedMsg ? (
              <div
                className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-[#064e3b]"
                role="status"
              >
                {savedMsg}
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="mb-2 flex items-center gap-3 border-b border-[#881c1c]/15 pb-4">
                <div className="rounded-2xl bg-[#881c1c]/10 p-2.5 text-xl text-[#881c1c]">
                  🏠
                </div>

                <h2 className="text-xl font-bold text-[#100e06]">Unit shape</h2>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="preferred_bedrooms"
                    className="ml-1 flex text-sm font-medium text-[#100e06]/80"
                  >
                    Preferred bedrooms
                  </label>

                  <select
                    id="preferred_bedrooms"
                    value={form.preferred_bedrooms}
                    onChange={(e) =>
                      handleChange('preferred_bedrooms', e.target.value)
                    }
                    className={`${inputWarn('preferred_bedrooms')} h-12 w-full cursor-pointer appearance-none rounded-2xl bg-white/80 px-4 font-medium text-[#100e06] shadow-sm transition-all duration-300 hover:bg-white/90 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10`}
                  >
                    {BEDROOM_OPTIONS.map((opt) => (
                      <option key={opt.value || 'unset'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {fieldErrors.preferred_bedrooms ? (
                    <p className="ml-1 text-xs font-medium text-[#881c1c]">
                      {fieldErrors.preferred_bedrooms}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="preferred_bathrooms"
                    className="ml-1 flex text-sm font-medium text-[#100e06]/80"
                  >
                    Preferred bathrooms
                  </label>

                  <input
                    id="preferred_bathrooms"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={0}
                    max={99.9}
                    placeholder="e.g. 2.5"
                    value={form.preferred_bathrooms}
                    onChange={(e) =>
                      handleChange('preferred_bathrooms', e.target.value)
                    }
                    className={`${inputWarn('preferred_bathrooms')} h-12 w-full rounded-2xl bg-white/80 px-4 font-medium text-[#100e06] shadow-sm transition-all hover:bg-white/90 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10`}
                  />

                  {fieldErrors.preferred_bathrooms ? (
                    <p className="ml-1 text-xs font-medium text-[#881c1c]">
                      {fieldErrors.preferred_bathrooms}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="preferred_floor"
                  className="ml-1 flex text-sm font-medium text-[#100e06]/80"
                >
                  Preferred floor
                </label>

                <select
                  id="preferred_floor"
                  value={form.preferred_floor}
                  onChange={(e) =>
                    handleChange('preferred_floor', e.target.value)
                  }
                  className={`${inputWarn('preferred_floor')} h-12 w-full cursor-pointer appearance-none rounded-2xl bg-white/80 px-4 font-medium text-[#100e06] shadow-sm transition-all duration-300 hover:bg-white/90 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10`}
                >
                  {FLOOR_OPTIONS.map((opt) => (
                    <option key={opt.value || 'unset'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {fieldErrors.preferred_floor ? (
                  <p className="ml-1 text-xs font-medium text-[#881c1c]">
                    {fieldErrors.preferred_floor}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-2 flex items-center gap-3 border-b border-[#881c1c]/15 pb-4">
                <div className="rounded-2xl bg-[#881c1c]/10 p-2.5 text-xl text-[#881c1c]">
                  ⚙️
                </div>
                <h2 className="text-xl font-bold text-[#100e06]">Amenities</h2>
              </div>

              <p className="-mt-4 text-xs text-[#100e06]/55">
                Pick your preferred amenities. You can add custom ones below.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {AMENITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-3 rounded-xl border border-[#881c1c]/10 bg-white/70 px-3 py-2 text-sm text-[#100e06]"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form.amenitiesSelected?.[opt.key])}
                      onChange={(e) =>
                        handleAmenityToggle(opt.key, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-[#881c1c]/40 text-[#881c1c] focus:ring-[#881c1c]/25"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="amenities-other"
                  className="ml-1 text-sm font-medium text-[#100e06]/80"
                >
                  Other amenities (optional)
                </label>
                <textarea
                  id="amenities-other"
                  rows={4}
                  placeholder={'e.g.\nNear bus stop\nQuiet building'}
                  value={form.amenitiesOther}
                  onChange={(e) => handleChange('amenitiesOther', e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm leading-relaxed text-[#100e06] shadow-sm transition hover:bg-white focus:border-[#881c1c]/40 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10"
                />
                <p className="ml-1 text-xs text-[#100e06]/55">
                  Add one custom amenity per line.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-sm font-semibold text-white shadow-md shadow-[#7a0019]/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save housing preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
