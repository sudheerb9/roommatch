// Page-level container for HousingUnitsPage view state and user interactions.
import { useEffect, useMemo, useState } from 'react';
import ApiErrorState from '../components/ui/ApiErrorState';
import { apiFetch } from '../utils/api';

const FILTER_OPTIONS = [
  { value: 'available', label: 'Available units' },
  { value: 'unavailable', label: 'Unavailable units' },
  { value: 'all', label: 'All units' },
];

export default function HousingUnitsPage() {
  const [filter, setFilter] = useState('available');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUnits() {
      setLoading(true);
      setError(null);
      try {
        const query =
          filter === 'all' ? '' : `?available=${filter === 'available'}`;
        const payload = await apiFetch(`/housing-units${query}`);
        if (!cancelled) {
          setUnits(Array.isArray(payload.items) ? payload.items : []);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUnits();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const availableCount = useMemo(
    () => units.filter((unit) => unit.is_available).length,
    [units]
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="rounded-[2rem] border border-[#881c1c]/15 bg-white/70 p-10 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#881c1c]/20 border-t-[#881c1c]" />
            <p className="text-sm font-medium text-[#100e06]/80">
              Loading housing units…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorState
        status={error.status}
        message={error.message}
        retryLabel="Reload units"
        onRetry={() => setFilter((current) => current)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-8 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#100e06]">Housing units</h1>
            <p className="mt-2 text-sm text-[#100e06]/65">
              Browse available inventory and keep track of units your group may
              want to assign.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#881c1c]/20 bg-white px-3 py-2 text-sm text-[#100e06]">
              {availableCount} available
            </span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-12 rounded-2xl border border-[#881c1c]/20 bg-white px-4 text-sm text-[#100e06] shadow-sm focus:border-[#881c1c]/40"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-10 text-center shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-[#100e06]">
            No housing units found
          </h2>
          <p className="mt-2 text-sm text-[#100e06]/65">
            Try another filter or add inventory on the backend.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {units.map((unit) => {
            const selected = selectedUnitId === unit.id;
            return (
              <article
                key={unit.id}
                className={`rounded-[2rem] border p-6 shadow-xl shadow-[#7a0019]/5 transition ${
                  selected
                    ? 'border-[#881c1c] bg-[#fff1f0]'
                    : 'border-[#881c1c]/10 bg-white/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[#100e06]">
                      {unit.unit_code}
                    </h2>
                    <p className="mt-1 text-sm text-[#100e06]/65">
                      {unit.building}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${unit.is_available ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}
                  >
                    {unit.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[#f9fafb] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#100e06]/60">
                      Bedrooms
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#100e06]">
                      {unit.bedrooms}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-[#f9fafb] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#100e06]/60">
                      Bathrooms
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#100e06]">
                      {unit.bathrooms}
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-sm text-[#100e06]/75">
                  <p>Floor: {unit.floor ?? 'Any'}</p>
                  <p className="mt-2">
                    Amenities:{' '}
                    {unit.amenities ? JSON.stringify(unit.amenities) : 'None'}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      selected
                        ? 'bg-[#7a0019] text-white'
                        : 'border border-[#881c1c]/20 bg-white text-[#100e06] hover:bg-[#f9f5f2]'
                    }`}
                    onClick={() => setSelectedUnitId(unit.id)}
                  >
                    {selected ? 'Selected' : 'Select for review'}
                  </button>
                  <span className="text-sm text-[#100e06]/65">
                    Unit ID {unit.id}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
