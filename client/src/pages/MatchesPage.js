import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function MatchesPage() {
  const navigate = useNavigate();
  const [viewerUserId, setViewerUserId] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);

  const loadMatches = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiFetch(
          `/matches?page=${nextPage}&limit=${PAGE_LIMIT}`
        );
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setMeta(payload.meta || null);
        setPage(nextPage);
      } catch (requestError) {
        setItems([]);
        setMeta(null);
        setError(
          requestError.message || 'Unexpected error while loading matches.'
        );
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    loadMatches(1);
  }, [loadMatches]);

  const canGoNext = Boolean(meta?.hasMore) && !loading;
  const canGoPrev = page > 1 && !loading;
  const validViewerId = Number.isInteger(viewerUserId) && viewerUserId > 0;

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="grid min-h-[260px] place-content-center justify-items-center gap-3 rounded-3xl border border-[#881c1c]/10 bg-white/70 p-10">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#881c1c]/20 border-t-[#881c1c]" />
          <p className="text-sm font-medium text-[#100e06]/70">
            Loading matches…
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
          <p className="text-lg font-semibold text-[#100e06]">No matches yet</p>
          <p className="mt-2 text-sm text-[#100e06]/65">
            Update your profile and preferences, then refresh this page.
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
                    {match.display_name || 'Roommate candidate'}
                  </h3>
                  <p className="text-sm text-[#100e06]/60">{match.email}</p>
                </div>
                <span className="rounded-xl border border-[#881c1c]/15 bg-[#881c1c]/8 px-2.5 py-1 text-sm font-bold text-[#7a0019]">
                  {Math.round(match.score)}%
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>

                <button
                  type="button"
                  disabled={!validViewerId}
                  onClick={() =>
                    navigate(
                      `/chat?initiator=${viewerUserId}&recipient=${match.user_id}`
                    )
                  }
                  className="rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start chat
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }, [
    error,
    items,
    loadMatches,
    loading,
    navigate,
    page,
    validViewerId,
    viewerUserId,
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#100e06]">Your Matches</h1>
            <p className="mt-1 text-sm text-[#100e06]/65">
              Ranked candidates powered by your preference scores in Redis.
            </p>
          </div>
          <Link
            to="/preferences"
            className="rounded-xl border border-[#881c1c]/20 bg-white px-4 py-2 text-sm font-semibold text-[#7a0019] transition hover:border-[#881c1c]/35 hover:bg-white/80"
          >
            Update preferences
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#100e06]/60">
            My user ID (for chat)
            <input
              type="number"
              min="1"
              value={viewerUserId}
              onChange={(event) =>
                setViewerUserId(Number(event.target.value) || 1)
              }
              className="h-11 rounded-xl border border-[#881c1c]/20 bg-white px-3 text-sm text-[#100e06] outline-none focus:border-[#881c1c]/45 focus:ring-2 focus:ring-[#881c1c]/10"
            />
          </label>
          <button
            type="button"
            onClick={() => loadMatches(1)}
            disabled={loading}
            className="h-11 rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-5 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      {content}

      <div className="flex items-center justify-between rounded-2xl border border-[#881c1c]/10 bg-white/70 px-4 py-3">
        <p className="text-sm text-[#100e06]/65">
          Page {page}
          {meta?.count != null ? ` • Showing ${meta.count} results` : ''}
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
  );
}
