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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [profileLoadingId, setProfileLoadingId] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [profileByUserId, setProfileByUserId] = useState({});

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
        // Clear stale matches when a request fails to avoid mixing old/new pages.
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

  async function handleViewProfile(userId) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    if (profileByUserId[userId]) {
      // Use cached profile payload when user re-expands the same candidate.
      setExpandedUserId(userId);
      return;
    }
    setProfileLoadingId(userId);
    setProfileError('');
    try {
      const payload = await apiFetch(`/profile/${userId}`);
      setProfileByUserId((prev) => ({ ...prev, [userId]: payload }));
      setExpandedUserId(userId);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setProfileLoadingId(null);
    }
  }

  const canGoNext = Boolean(meta?.hasMore) && !loading;
  const canGoPrev = page > 1 && !loading;
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
      const notEligible = meta?.matching_eligible === false;
      return (
        <div className="rounded-3xl border border-[#881c1c]/10 bg-white/70 p-10 text-center">
          <p className="text-lg font-semibold text-[#100e06]">
            {notEligible ? 'Matching not active yet' : 'No matches yet'}
          </p>
          <p className="mt-2 text-sm text-[#100e06]/65">
            {notEligible ? (
              <>
                Complete and save your profile on{' '}
                <Link to="/profile" className="font-semibold text-[#881c1c] underline">
                  Profile
                </Link>{' '}
                to appear in matching and refresh this page.
              </>
            ) : (
              <>
                Update your profile and preferences, then refresh this page.
              </>
            )}
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
                  <button
                    type="button"
                    onClick={() => handleViewProfile(match.user_id)}
                    className="text-left text-lg font-bold text-[#100e06] underline-offset-2 hover:text-[#881c1c] hover:underline"
                  >
                    {match.display_name || 'Roommate candidate'}
                  </button>
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
                  onClick={() =>
                    navigate(`/chat?recipient=${match.user_id}`)
                  }
                  className="rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg"
                >
                  Start chat
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleViewProfile(match.user_id)}
                disabled={profileLoadingId === match.user_id}
                className="mt-3 text-xs font-semibold text-[#7a0019] underline underline-offset-2 disabled:opacity-60"
              >
                {profileLoadingId === match.user_id
                  ? 'Loading details…'
                  : expandedUserId === match.user_id
                    ? 'Hide details'
                    : 'View details'}
              </button>
              {expandedUserId === match.user_id && profileByUserId[match.user_id] ? (
                <div className="mt-3 rounded-2xl border border-[#881c1c]/10 bg-white/90 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#100e06]/55">Bio</p>
                  <p className="mt-1 text-sm text-[#100e06]/80">
                    {profileByUserId[match.user_id]?.profile?.bio || 'No bio shared yet.'}
                  </p>
                </div>
              ) : null}
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
    expandedUserId,
    profileByUserId,
    profileLoadingId,
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#100e06]">Your Matches</h1>
            <p className="mt-1 text-sm text-[#100e06]/65">
              Ranked candidates based on how well their lifestyle matches your preferences.
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
          <p className="text-sm text-[#100e06]/65">
            Choose a matched profile to open a direct conversation.
          </p>
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
      {profileError ? (
        <div className="rounded-xl border border-[#7a0019]/25 bg-[#7a0019]/5 px-4 py-3 text-sm text-[#7a0019]">
          {profileError}
        </div>
      ) : null}

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
