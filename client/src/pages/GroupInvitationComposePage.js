import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const NOTE_MAX = 500;

function normalizeGroupName(rawName, groupId) {
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (!name) return `Group ${groupId}`;
  if (/^Group \d+$/i.test(name)) return 'My group';
  return name;
}

export default function GroupInvitationComposePage() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const [groupName, setGroupName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [note, setNote] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [bannerError, setBannerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentMembers, setCurrentMembers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const numericGroupIdOk = typeof groupId === 'string' && /^\d+$/.test(groupId);
  const preselectFromQuery = useMemo(() => {
    const q = searchParams.get('invitee');
    return q && /^\d+$/.test(q.trim()) ? Number(q.trim()) : null;
  }, [searchParams]);

  useEffect(() => {
    if (!numericGroupIdOk || !groupId) return;
    let cancelled = false;
    async function loadGroupName() {
      try {
        const payload = await apiFetch(`/groups/${groupId}`);
        if (!cancelled) {
          setGroupName(normalizeGroupName(payload?.group?.name, groupId));
        }
      } catch {
        if (!cancelled) {
          setGroupName(`Group ${groupId}`);
        }
      }
    }
    void loadGroupName();
    return () => {
      cancelled = true;
    };
  }, [groupId, numericGroupIdOk]);

  useEffect(() => {
    if (!numericGroupIdOk || !groupId) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingCandidates(true);
      setBannerError('');
      try {
        const encodedQ = encodeURIComponent(searchText.trim());
        const payload = await apiFetch(
          `/groups/${groupId}/invite-candidates?limit=200${encodedQ ? `&q=${encodedQ}` : ''}`
        );
        if (cancelled) return;

        const memberRows = Array.isArray(payload?.current_members)
          ? payload.current_members
          : [];
        const list = Array.isArray(payload?.candidates) ? payload.candidates : [];
        setCurrentMembers(memberRows);
        setCandidates(list);
        setSelectedIds((prev) => {
          const allowed = new Set(list.map((c) => Number(c.id)));
          const kept = prev.filter((id) => allowed.has(id));
          // Keep query-string preselected invitee when still eligible.
          if (
            preselectFromQuery &&
            allowed.has(preselectFromQuery) &&
            !kept.includes(preselectFromQuery)
          ) {
            return [...kept, preselectFromQuery];
          }
          return kept;
        });
      } catch (err) {
        if (!cancelled) {
          setCurrentMembers([]);
          setCandidates([]);
          setBannerError(err instanceof Error ? err.message : 'Failed to load users.');
        }
      } finally {
        if (!cancelled) {
          setLoadingCandidates(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      // Debounced search request cleanup.
      window.clearTimeout(timer);
    };
  }, [groupId, numericGroupIdOk, preselectFromQuery, searchText]);

  function toggleSelect(userId) {
    const id = Number(userId);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    setSuccessMsg('');
    setSkipped([]);
  }

  function selectAllVisible() {
    const ids = candidates.map((c) => Number(c.id));
    setSelectedIds(ids);
    setSuccessMsg('');
    setSkipped([]);
  }

  function clearSelection() {
    setSelectedIds([]);
    setSuccessMsg('');
    setSkipped([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!numericGroupIdOk || !groupId) return;
    if (selectedIds.length === 0) {
      setBannerError('Select at least one user to invite.');
      return;
    }

    setBannerError('');
    setSuccessMsg('');
    setSkipped([]);
    setSubmitting(true);
    try {
      const payload = await apiFetch(`/groups/${groupId}/invitations/batch`, {
        method: 'POST',
        body: {
          invitee_user_ids: selectedIds,
          note: note.trim() ? note.trim() : undefined,
        },
      });

      const created = Array.isArray(payload?.invitations) ? payload.invitations : [];
      const skippedRows = Array.isArray(payload?.skipped) ? payload.skipped : [];
      setSkipped(skippedRows);
      setSuccessMsg(
        `Sent ${created.length} invitation${created.length === 1 ? '' : 's'}.${
          skippedRows.length > 0
            ? ` ${skippedRows.length} skipped due to validation/conflicts.`
            : ''
        }`
      );
      const createdIds = new Set(created.map((row) => Number(row.invitee_user_id)));
      setCandidates((prev) => prev.filter((user) => !createdIds.has(Number(user.id))));
      setSelectedIds((prev) => prev.filter((id) => !createdIds.has(id)));
      setNote('');
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : 'Failed to send invitations.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const noteRemain = NOTE_MAX - note.length;

  if (!numericGroupIdOk || !groupId) {
    return (
      <div className="relative p-4 md:p-8">
        <div className="relative z-10 mx-auto max-w-lg rounded-[2rem] border border-[#7a0019]/25 bg-[#7a0019]/10 px-6 py-5 text-[#100e06]">
          Invalid group link.{' '}
          <Link
            to="/group-invitations"
            className="ml-1 font-semibold text-[#7a0019] underline"
          >
            Start over
          </Link>
          .
        </div>
      </div>
    );
  }

  const selectedSet = new Set(selectedIds);

  return (
    <div className="relative p-4 md:p-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-10 space-y-2 text-center">
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
            Invite people to <span className="text-[#881c1c]">{groupName}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-[#100e06]/65">
            Select one or more users below. Existing members are shown separately,
            and only eligible users can be invited.
          </p>
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
            {successMsg ? (
              <div
                role="status"
                className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-[#064e3b]"
              >
                {successMsg}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search users by name or email"
                className="h-11 w-full rounded-2xl border border-transparent bg-white/80 px-4 text-sm font-medium text-[#100e06] shadow-sm transition-all focus:border-[#881c1c]/40 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10"
              />
              <button
                type="button"
                onClick={selectAllVisible}
                disabled={loadingCandidates || candidates.length === 0}
                className="h-11 rounded-2xl border border-[#881c1c]/30 bg-white px-4 text-sm font-semibold text-[#881c1c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedIds.length === 0}
                className="h-11 rounded-2xl border border-[#881c1c]/20 bg-white px-4 text-sm font-semibold text-[#100e06]/75 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <div className="rounded-2xl border border-[#881c1c]/10 bg-white/65 p-3">
              {currentMembers.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#100e06]/55">
                    Current members ({currentMembers.length})
                  </p>
                  <ul className="grid gap-2">
                    {currentMembers.map((user) => {
                      const label = user.display_name || user.email || 'Group member';
                      return (
                        <li key={`member-${user.id}`}>
                          <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked
                              readOnly
                              disabled
                              className="mt-1 h-4 w-4 rounded border-emerald-500 text-emerald-600"
                            />
                            <div>
                              <p className="text-sm font-semibold text-[#100e06]">
                                {label}
                              </p>
                              <p className="text-xs text-[#100e06]/65">
                                {user.email || 'No email'} · already in this group
                              </p>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#100e06]/55">
                Available users
              </p>
              {loadingCandidates ? (
                <div className="grid min-h-[160px] place-content-center gap-2 text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-[3px] border-[#881c1c]/20 border-t-[#881c1c]" />
                  <p className="text-sm text-[#100e06]/65">Loading users...</p>
                </div>
              ) : candidates.length === 0 ? (
                <p className="px-2 py-10 text-center text-sm text-[#100e06]/65">
                  No eligible users found.
                </p>
              ) : (
                <ul className="grid max-h-[380px] gap-2 overflow-y-auto pr-1">
                  {candidates.map((user) => {
                    const userId = Number(user.id);
                    const checked = selectedSet.has(userId);
                    const label = user.display_name || user.email || 'Candidate';
                    return (
                      <li key={userId}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#881c1c]/10 bg-white/80 px-3 py-2.5 hover:border-[#881c1c]/25">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(userId)}
                            className="mt-1 h-4 w-4 rounded border-[#881c1c]/40 text-[#881c1c] focus:ring-[#881c1c]/25"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#100e06]">{label}</p>
                            <p className="text-xs text-[#100e06]/65">
                              {user.email || 'No email'}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="invite-note"
                  className="ml-1 text-sm font-medium text-[#100e06]/80"
                >
                  Optional note
                </label>
                <span
                  className={`text-xs font-medium ${
                    noteRemain < 0 ? 'text-[#881c1c]' : 'text-[#100e06]/45'
                  }`}
                >
                  {Math.min(note.length, NOTE_MAX)} / {NOTE_MAX}
                </span>
              </div>
              <textarea
                id="invite-note"
                rows={4}
                maxLength={NOTE_MAX}
                placeholder="Short message to the invitee (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm leading-relaxed text-[#100e06] shadow-sm transition hover:bg-white focus:border-[#881c1c]/40 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10"
              />
              <p className="ml-1 text-xs text-[#100e06]/50">
                Server trims and stores up to {NOTE_MAX} characters.
              </p>
            </div>

            {skipped.length > 0 ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[#6b3d00]">
                <p className="font-semibold">Skipped users</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {skipped.slice(0, 8).map((row) => (
                    <li key={`${row.invitee_user_id}-${row.error}`}>
                      Invitee: {row.error}
                    </li>
                  ))}
                  {skipped.length > 8 ? (
                    <li>...and {skipped.length - 8} more</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || selectedIds.length === 0}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-sm font-semibold text-white shadow-md shadow-[#7a0019]/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Sending invitations...'
                : `Send invitations (${selectedIds.length})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
