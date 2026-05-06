import { Home, Info } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const PAGE_LIMIT = 12;

const AGGREGATE_LABELS = {
  preferred_sleep_schedule: 'Sleep schedule',
  preferred_cleanliness_level: 'Cleanliness',
  preferred_noise_tolerance: 'Noise tolerance',
  preferred_smoking_preference: 'Smoking',
  preferred_drinking_preference: 'Drinking',
  preferred_social_behavior: 'Social style',
  preferred_study_preferences: 'Study habits',
};

const VALUE_LABELS = {
  no_preference: 'No preference',
  early_bird: 'Early bird',
  night_owl: 'Night owl',
  clean: 'Clean',
  average: 'Average',
  relaxed: 'Relaxed',
  sensitive: 'Sensitive',
  moderate: 'Moderate',
  tolerant: 'Tolerant',
  yes: 'Yes',
  no: 'No',
  social: 'Social',
  introverted: 'Introverted',
  studious: 'Studious',
  casual: 'Casual',
};

function scoreBadge(score) {
  if (score >= 85) {
    return {
      label: 'Excellent fit',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (score >= 70) {
    return {
      label: 'Strong fit',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  return {
    label: 'Potential fit',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

function formatPreferenceValue(value) {
  if (value == null || value === '') return '—';
  if (value === 'no_preference') return 'No preference';
  if (VALUE_LABELS[value]) return VALUE_LABELS[value];
  return String(value).replace(/_/g, ' ');
}

function normalizeUnit(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    unit_code: raw.unit_code ?? raw.unitCode,
    building: raw.building,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    floor: raw.floor,
    amenities: raw.amenities,
  };
}

export default function GroupMatchesPage() {
  const navigate = useNavigate();
  const { groupId: groupIdParam } = useParams();

  const groupId = useMemo(() => {
    const n = Number(groupIdParam);
    return Number.isInteger(n) && n > 0 ? n : null;
  }, [groupIdParam]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [aggregatePreference, setAggregatePreference] = useState(null);

  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [assignmentFetchError, setAssignmentFetchError] = useState('');

  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [groupInfo, setGroupInfo] = useState(null);
  const [declaringReady, setDeclaringReady] = useState(false);
  const [declareReadyError, setDeclareReadyError] = useState('');
  const [declareReadyMsg, setDeclareReadyMsg] = useState('');

  const loadMatches = useCallback(
    async (nextPage = 1) => {
      if (!groupId) return;
      setLoading(true);
      setError('');

      try {
        const payload = await apiFetch(
          `/groups/${groupId}/matches?page=${nextPage}&limit=${PAGE_LIMIT}`
        );
        const g =
          payload.group && typeof payload.group === 'object'
            ? payload.group
            : null;
        setGroupInfo(g);
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setMeta(payload.meta || null);
        setAggregatePreference(
          payload.aggregate_preference && typeof payload.aggregate_preference === 'object'
            ? payload.aggregate_preference
            : null
        );
        setPage(nextPage);
      } catch (requestError) {
        setItems([]);
        setMeta(null);
        setAggregatePreference(null);
        setError(
          requestError.message || 'Unexpected error while loading group matches.'
        );
        setGroupInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [groupId]
  );

  const loadAssignment = useCallback(async () => {
    if (!groupId) return;
    setAssignmentLoading(true);
    setAssignmentFetchError('');
    try {
      const data = await apiFetch(`/groups/${groupId}/assignment`);
      setAssignment(data.assignment ?? null);
    } catch (e) {
      if (e.status === 404) {
        setAssignment(null);
      } else {
        setAssignment(null);
        setAssignmentFetchError(
          e.message || 'Could not load housing assignment.'
        );
      }
    } finally {
      setAssignmentLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    loadMatches(1);
    loadAssignment();
  }, [groupId, loadMatches, loadAssignment]);

  const handleAssignHousing = async () => {
    if (!groupId) return;
    setAssigning(true);
    setAssignError('');
    try {
      const data = await apiFetch(`/groups/${groupId}/assign`, {
        method: 'POST',
      });
      setAssignment(data.assignment ?? null);
      await loadMatches(page);
      await loadAssignment();
    } catch (e) {
      setAssignError(e.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeclareReady = async () => {
    if (!groupId) return;
    setDeclaringReady(true);
    setDeclareReadyError('');
    setDeclareReadyMsg('');
    try {
      const data = await apiFetch(`/groups/${groupId}/ready`, {
        method: 'POST',
      });
      const g =
        data.group && typeof data.group === 'object' ? data.group : null;
      if (g) setGroupInfo(g);
      setDeclareReadyMsg('Group declared ready for allotment.');
      await loadMatches(page);
      await loadAssignment();
    } catch (e) {
      setDeclareReadyError(e.message || 'Could not declare readiness.');
    } finally {
      setDeclaringReady(false);
    }
  };

  const canGoNext = Boolean(meta?.hasMore) && !loading;
  const canGoPrev = page > 1 && !loading;

  const groupStatusLabel = groupInfo?.status
    ? {
        forming: 'Forming',
        ready: 'Ready for allotment',
        assigned: 'Assigned',
        archived: 'Archived',
      }[groupInfo.status] || groupInfo.status
    : null;

  const showDeclareReady =
    !assignment &&
    groupInfo?.status === 'forming' &&
    groupInfo?.role === 'owner';

  const canAssignHousing =
    !assignment && (groupInfo == null || groupInfo.status === 'ready');

  const assignBlockedReason =
    !assignment &&
    groupInfo?.status === 'forming' &&
    'Declare the group ready for allotment (after saving housing preferences) before assigning housing.';

  const unit = useMemo(
    () => normalizeUnit(assignment?.housingUnit ?? assignment?.housing_unit),
    [assignment]
  );

  if (!groupId) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="rounded-3xl border border-[#7a0019]/20 bg-[#7a0019]/5 p-6 text-center">
          <p className="text-sm text-[#7a0019]">Invalid group ID in the URL.</p>
          <Link
            to="/group-housing"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            Enter a group ID
          </Link>
        </div>
      </div>
    );
  }

  const aggregateEntries = Object.entries(aggregatePreference || {}).filter(
    ([, v]) => v != null
  );

  const matchesSection = (() => {
    if (loading) {
      return (
        <div className="grid min-h-[220px] place-content-center justify-items-center gap-3 rounded-3xl border border-[#881c1c]/10 bg-white/70 p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#881c1c]/20 border-t-[#881c1c]" />
          <p className="text-sm font-medium text-[#100e06]/70">
            Loading group matches…
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-[#7a0019]/20 bg-[#7a0019]/5 p-6 text-center">
          <p className="text-sm text-[#7a0019]">{error}</p>
          <button
            type="button"
            onClick={() => loadMatches(page)}
            className="mt-4 rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20"
          >
            Retry
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-3xl border border-[#881c1c]/10 bg-white/70 p-10 text-center">
          <p className="text-lg font-semibold text-[#100e06]">
            No matching candidates
          </p>
          <p className="mt-2 text-sm text-[#100e06]/65">
            Everyone may already be in the group or invited, or no profiles pass
            the compatibility threshold. Adjust member preferences or invite
            from{' '}
            <Link to="/matches" className="font-semibold text-[#881c1c] underline">
              individual matches
            </Link>
            .
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((match) => {
          const badge = scoreBadge(match.score);
          return (
            <article
              key={match.user_id}
              className="rounded-3xl border border-[#881c1c]/10 bg-white/75 p-5 shadow-sm backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#100e06]">
                    {match.display_name || 'Candidate'}
                  </h3>
                  <p className="text-sm text-[#100e06]/60">{match.email}</p>
                </div>
                <span className="rounded-xl border border-[#881c1c]/15 bg-[#881c1c]/8 px-2.5 py-1 text-sm font-bold text-[#7a0019]">
                  {Math.round(match.score)}%
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#100e06]/55">
                Score uses the group&apos;s aggregated preferences vs this
                student&apos;s profile (same engine as individual matching).
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/chat?recipient=${match.user_id}`)}
                  className="rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg"
                >
                  Start chat
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  })();

  const assignmentSection = (() => {
    if (assignmentLoading) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-[#881c1c]/10 bg-white/70 px-4 py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#881c1c]/25 border-t-[#881c1c]" />
          <span className="text-sm text-[#100e06]/70">
            Loading assignment…
          </span>
        </div>
      );
    }

    if (assignmentFetchError) {
      return (
        <div className="rounded-2xl border border-[#7a0019]/20 bg-[#7a0019]/5 px-4 py-3 text-sm text-[#7a0019]">
          {assignmentFetchError}
        </div>
      );
    }

    if (assignment && unit) {
      return (
        <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
            Assigned housing
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#100e06]">
            {unit.unit_code || 'Unit'}{' '}
            {unit.building ? (
              <span className="font-semibold text-[#100e06]/70">
                · {unit.building}
              </span>
            ) : null}
          </h3>
          <dl className="mt-3 grid gap-2 text-sm text-[#100e06]/80 sm:grid-cols-2">
            <div>
              <dt className="text-[#100e06]/55">Bedrooms</dt>
              <dd className="font-medium">{unit.bedrooms ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#100e06]/55">Bathrooms</dt>
              <dd className="font-medium">{unit.bathrooms ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#100e06]/55">Floor</dt>
              <dd className="font-medium">{unit.floor ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#100e06]/55">Status</dt>
              <dd className="font-medium capitalize">
                {assignment.status || 'assigned'}
              </dd>
            </div>
          </dl>
          {Array.isArray(unit.amenities) && unit.amenities.length > 0 ? (
            <p className="mt-3 text-xs text-[#100e06]/65">
              Amenities: {unit.amenities.join(', ')}
            </p>
          ) : null}
          {assignment.note ? (
            <p className="mt-2 text-xs text-[#100e06]/55">{assignment.note}</p>
          ) : null}
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-dashed border-[#881c1c]/25 bg-white/60 p-5">
        <p className="text-sm font-medium text-[#100e06]">No assignment yet</p>
        <p className="mt-1 text-sm text-[#100e06]/65">
          After the group declares readiness, the server picks the best-fit open
          unit from your{' '}
          <Link
            to={`/groups/${groupId}/housing-preferences`}
            className="font-semibold text-[#881c1c] underline"
          >
            housing preferences
          </Link>{' '}
          and roster size.
        </p>
        {declareReadyError ? (
          <p className="mt-3 text-sm text-[#7a0019]" role="alert">
            {declareReadyError}
          </p>
        ) : null}
        {declareReadyMsg ? (
          <p className="mt-3 text-sm text-emerald-800" role="status">
            {declareReadyMsg}
          </p>
        ) : null}
        {showDeclareReady ? (
          <button
            type="button"
            disabled={declaringReady}
            onClick={handleDeclareReady}
            className="mt-4 h-11 rounded-xl border-2 border-[#881c1c]/35 bg-white px-5 text-sm font-semibold text-[#7a0019] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {declaringReady ? 'Declaring…' : 'Declare group ready for allotment'}
          </button>
        ) : null}
        {assignError ? (
          <p className="mt-3 text-sm text-[#7a0019]" role="alert">
            {assignError}
          </p>
        ) : null}
        {assignBlockedReason && groupInfo?.status === 'forming' ? (
          <p className="mt-3 text-xs text-[#100e06]/55">{assignBlockedReason}</p>
        ) : null}
        {!assignment &&
        groupInfo?.status === 'forming' &&
        groupInfo?.role &&
        groupInfo.role !== 'owner' ? (
          <p className="mt-3 text-xs text-[#100e06]/55">
            Only the group owner can mark this group ready for allotment.
          </p>
        ) : null}
        <button
          type="button"
          disabled={assigning || !canAssignHousing}
          onClick={handleAssignHousing}
          className="mt-4 h-11 rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-5 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {assigning ? 'Assigning…' : 'Assign housing now'}
        </button>
      </div>
    );
  })();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#100e06]">
              Group matches & housing
            </h1>
            <p className="mt-1 text-sm text-[#100e06]/65">
              Group #{groupId}: ranked students for your roster, plus housing
              assignment after the group declares readiness.
            </p>
            {groupStatusLabel ? (
              <p className="mt-2 inline-flex rounded-full border border-[#881c1c]/20 bg-[#881c1c]/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#7a0019]">
                Status: {groupStatusLabel}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/groups/${groupId}/housing-preferences`}
              className="rounded-xl border border-[#881c1c]/20 bg-white px-4 py-2 text-sm font-semibold text-[#7a0019] transition hover:border-[#881c1c]/35 hover:bg-white/80"
            >
              Housing preferences
            </Link>
            <button
              type="button"
              onClick={() => {
                loadMatches(1);
                loadAssignment();
              }}
              disabled={loading || assignmentLoading}
              className="h-11 rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-5 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh all
            </button>
          </div>
        </div>

        <details className="mt-4 rounded-2xl border border-[#881c1c]/10 bg-[#881c1c]/5 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#100e06]">
            <Info className="h-4 w-4 text-[#881c1c]" aria-hidden />
            How scoring works
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-[#100e06]/70">
            Preferences from everyone in the group are aggregated (majority vote
            per field; ties become &quot;no preference&quot;). Each candidate&apos;s{' '}
            <strong>profile</strong> is scored against that aggregate using the
            same compatibility logic as individual matching. Housing assignment
            ranks available units against your saved{' '}
            <Link
              to={`/groups/${groupId}/housing-preferences`}
              className="font-semibold text-[#881c1c] underline"
            >
              group housing preferences
            </Link>{' '}
            and picks the best fit.
          </p>
        </details>
      </div>

      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-[#881c1c]" aria-hidden />
          <h2 className="text-lg font-bold text-[#100e06]">
            Aggregated group preferences
          </h2>
        </div>
        <p className="mt-1 text-sm text-[#100e06]/65">
          Derived from member match preferences — used as the &quot;group
          wishlist&quot; for matching.
        </p>
        {aggregateEntries.length === 0 ? (
          <p className="mt-4 text-sm text-[#100e06]/55">
            No aggregate yet (members may need to save preferences).
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {aggregateEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-[#881c1c]/10 bg-white/80 px-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#100e06]/50">
                  {AGGREGATE_LABELS[key] || key.replace(/_/g, ' ')}
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#100e06]">
                  {formatPreferenceValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <h2 className="text-lg font-bold text-[#100e06]">Housing assignment</h2>
        <p className="mt-1 text-sm text-[#100e06]/65">
          Declare readiness after housing preferences are saved; then run
          assignment once (existing assignments are shown below).
        </p>
        <div className="mt-4">{assignmentSection}</div>
      </div>

      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#100e06]">
            Compatible students
          </h2>
          <button
            type="button"
            onClick={() => loadMatches(1)}
            disabled={loading}
            className="rounded-lg border border-[#881c1c]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#100e06] disabled:opacity-50"
          >
            Reload list
          </button>
        </div>
        <div className="mt-4">{matchesSection}</div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#881c1c]/10 bg-white/70 px-4 py-3">
          <p className="text-sm text-[#100e06]/65">
            Page {page}
            {meta?.count != null ? ` • ${meta.count} on this page` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => loadMatches(page - 1)}
              className="rounded-lg border border-[#881c1c]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#100e06] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => loadMatches(page + 1)}
              className="rounded-lg border border-[#881c1c]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#100e06] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
