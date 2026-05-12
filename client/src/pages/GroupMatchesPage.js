// Page-level container for GroupMatchesPage view state and user interactions.
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const PAGE_LIMIT = 12;

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

  const [groupInfo, setGroupInfo] = useState(null);

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
        setPage(nextPage);
      } catch (requestError) {
        // Reset stale list data so users do not act on outdated candidates.
        setItems([]);
        setMeta(null);
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

  useEffect(() => {
    if (!groupId) return;
    loadMatches(1);
  }, [groupId, loadMatches]);

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

  if (!groupId) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="rounded-3xl border border-[#7a0019]/20 bg-[#7a0019]/5 p-6 text-center">
          <p className="text-sm text-[#7a0019]">Invalid group link.</p>
          <Link
            to="/groups"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            Back to groups
          </Link>
        </div>
      </div>
    );
  }

  const matchesSection = (() => {
    // Keep the page's loading/error/empty/ready states co-located for readability.
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
            No compatible students are available for this group right now.
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <Link
          to="/groups"
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#100e06]/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:text-[#100e06] hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to groups
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#100e06]">
            {groupInfo?.name || 'Group'} matches
          </h1>
          <p className="mt-1 text-sm text-[#100e06]/65">
            Compatible students for your group, ranked by match score.
          </p>
          {groupStatusLabel ? (
            <p className="mt-2 inline-flex rounded-full border border-[#881c1c]/20 bg-[#881c1c]/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#7a0019]">
              Status: {groupStatusLabel}
            </p>
          ) : null}
        </div>
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
