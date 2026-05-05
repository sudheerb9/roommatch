import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';

/** @typedef {{ id: string, label: string, predicate: (s: string) => boolean }} TabDef */

/** @type {TabDef[]} */
const TABS = [
  { id: 'pending', label: 'Pending', predicate: (s) => s === 'pending' },
  {
    id: 'accepted',
    label: 'Accepted',
    predicate: (s) => s === 'accepted',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    predicate: (s) => s === 'rejected',
  },
  { id: 'all', label: 'All', predicate: () => true },
];

function badgeForStatus(status) {
  switch (status) {
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'accepted':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'rejected':
      return 'border-slate-200 bg-slate-100 text-slate-800';
    case 'expired':
    case 'cancelled':
      return 'border-neutral-200 bg-neutral-50 text-neutral-700';
    default:
      return 'border-[#881c1c]/20 bg-[#881c1c]/8 text-[#7a0019]';
  }
}

function formatWhen(iso) {
  if (iso == null || iso === '') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function GroupInvitationsInboxPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('pending');
  const [respondingId, setRespondingId] = useState(null);
  /** @type {{ invitationId: number, message: string } | null} */
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setActionError(null);
    try {
      const payload = await apiFetch('/invitations/mine');
      setItems(Array.isArray(payload.invitations) ? payload.invitations : []);
    } catch (e) {
      setItems([]);
      setLoadError(
        e instanceof Error ? e.message : 'Could not load your invitations.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const tabDef = TABS.find((t) => t.id === tab) || TABS[TABS.length - 1];
    return items.filter((inv) =>
      typeof inv.status === 'string' ? tabDef.predicate(inv.status) : false
    );
  }, [items, tab]);

  async function respond(invitationId, action) {
    setActionError(null);
    setRespondingId(invitationId);
    try {
      await apiFetch(`/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: {
          action: action === 'accept' ? 'accept' : 'reject',
        },
      });
      await load();
    } catch (e) {
      setActionError({
        invitationId,
        message:
          e instanceof Error
            ? e.message
            : 'Something went wrong. Try again shortly.',
      });
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#100e06]">
              Invitations inbox
            </h1>
            <p className="mt-1 text-sm text-[#100e06]/65">
              Invites people sent{' '}
              <span className="font-medium text-[#100e06]/85">to you</span>.
              Pending rows can be accepted or rejected here.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div
          className="mt-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter by invitation status"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setActionError(null);
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-[#881c1c] bg-[#881c1c] text-white shadow-sm'
                  : 'border-[#881c1c]/20 bg-white/80 text-[#100e06]/85 hover:border-[#881c1c]/35'
              }`}
            >
              {t.label}
              {t.id !== 'all' ? (
                <span className="ml-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold tabular-nums opacity-95">
                  {items.filter((i) => i.status && t.predicate(i.status)).length}
                </span>
              ) : (
                <span className="ml-2 inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {items.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-3xl border border-[#7a0019]/20 bg-[#7a0019]/5 px-6 py-5 text-sm text-[#7a0019]"
        >
          {loadError}{' '}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid min-h-[220px] place-content-center gap-3 rounded-3xl border border-[#881c1c]/10 bg-white/70 p-10">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#881c1c]/20 border-t-[#881c1c]" />
          <p className="text-sm font-medium text-[#100e06]/65">
            Loading invitations…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#881c1c]/10 bg-white/70 p-12 text-center">
          <p className="text-lg font-semibold text-[#100e06]">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm text-[#100e06]/65">
            {tab === 'pending'
              ? 'When someone invites you to a group, those invites show up here.'
              : `No invitations in the “${tab}” filter.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((inv) => {
            const isPending =
              typeof inv.status === 'string' && inv.status === 'pending';
            const groupLabel =
              inv.group && typeof inv.group === 'object' && inv.group.name
                ? inv.group.name
                : null;
            const inviterLabel =
              inv.inviter?.display_name || inv.inviter?.email || 'Someone';
            const whenCreated = formatWhen(inv.created_at);
            const whenResponded = formatWhen(inv.responded_at);

            const rowErr =
              actionError?.invitationId === inv.id ? actionError.message : null;

            return (
              <article
                key={inv.id}
                className="flex flex-col rounded-3xl border border-[#881c1c]/10 bg-white/75 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#100e06]">
                      {groupLabel || `Group #${inv.group_id}`}
                    </h2>
                    <p className="mt-1 text-xs text-[#100e06]/50">
                      Group ID {inv.group_id}
                      {typeof inv.id === 'number' ? (
                        <>
                          {' '}
                          · Invite #{inv.id}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeForStatus(
                      typeof inv.status === 'string' ? inv.status : ''
                    )}`}
                  >
                    {typeof inv.status === 'string' ? inv.status : 'unknown'}
                  </span>
                </div>

                <p className="mt-4 text-sm text-[#100e06]/80">
                  <span className="font-semibold text-[#100e06]">
                    From {inviterLabel}
                  </span>
                  {inv.inviter?.email ? (
                    <span className="text-[#100e06]/55">
                      {' '}
                      ({inv.inviter.email})
                    </span>
                  ) : null}
                </p>

                {inv.note ? (
                  <div className="mt-3 rounded-2xl border border-[#881c1c]/10 bg-[#881c1c]/[0.06] px-4 py-3 text-sm italic text-[#100e06]/80">
                    “{inv.note}”
                  </div>
                ) : null}

                <dl className="mt-4 space-y-1 text-xs text-[#100e06]/55">
                  {whenCreated ? (
                    <div>
                      <dt className="mr-2 inline font-medium text-[#100e06]/65">
                        Sent
                      </dt>
                      <dd className="inline">{whenCreated}</dd>
                    </div>
                  ) : null}
                  {whenResponded ? (
                    <div>
                      <dt className="mr-2 inline font-medium text-[#100e06]/65">
                        Responded
                      </dt>
                      <dd className="inline">{whenResponded}</dd>
                    </div>
                  ) : null}
                </dl>

                {rowErr ? (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl border border-[#7a0019]/25 bg-[#7a0019]/10 px-3 py-2 text-xs font-medium text-[#881c1c]"
                  >
                    {rowErr}
                  </p>
                ) : null}

                {isPending ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={respondingId != null}
                      onClick={() => void respond(inv.id, 'accept')}
                      className="min-h-[42px] flex-1 rounded-2xl bg-gradient-to-r from-[#065f46] to-[#047857] px-4 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {respondingId === inv.id ? 'Working…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={respondingId != null}
                      onClick={() => void respond(inv.id, 'reject')}
                      className="min-h-[42px] flex-1 rounded-2xl border border-[#881c1c]/25 bg-white px-4 text-sm font-semibold text-[#881c1c] shadow-sm transition hover:bg-[#7a0019]/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {respondingId === inv.id ? 'Working…' : 'Reject'}
                    </button>
                  </div>
                ) : (
                  <p className="mt-5 text-xs text-[#100e06]/50">
                    {inv.status === 'accepted'
                      ? 'You joined this group. No further action on this invitation.'
                      : inv.status === 'rejected'
                        ? 'You declined this invitation.'
                        : 'No actions available for this invitation.'}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
