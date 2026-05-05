import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ApiErrorState from '../components/ui/ApiErrorState';
import { apiFetch } from '../utils/api';

const NOTE_MAX = 500;

/** @param {string | number | bigint | null | undefined} id */
function idToComparableString(id) {
  if (id == null) return '';
  return typeof id === 'bigint' ? id.toString() : String(Number(id));
}

/**
 * @param {{ inviteeUserIdStr: string, noteRaw: string, viewerUserIdComparable: string }} args
 */
function validateInviteForm(args) {
  const { inviteeUserIdStr, noteRaw, viewerUserIdComparable } = args;
  /** @type {Record<string, string>} */
  const errors = {};
  let invitee_user_id;

  const idTrimmed = inviteeUserIdStr.trim();
  if (!idTrimmed) {
    errors.invitee_user_id = 'Enter the invitee’s user ID.';
  } else {
    const n = Number.parseInt(idTrimmed, 10);
    if (!Number.isInteger(n) || n <= 0 || String(n) !== idTrimmed) {
      errors.invitee_user_id =
        'User ID must be a positive integer (no decimals or letters).';
    } else if (
      viewerUserIdComparable &&
      idToComparableString(n) === viewerUserIdComparable
    ) {
      errors.invitee_user_id = 'You can’t invite yourself.';
    } else {
      invitee_user_id = n;
    }
  }

  let noteTrimmed = noteRaw.trim();
  if (noteTrimmed.length > NOTE_MAX) {
    errors.note = `Note must be ${NOTE_MAX} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  /** @type {Record<string, unknown>} */
  const body = { invitee_user_id };
  if (noteTrimmed.length > 0) {
    body.note = noteTrimmed;
  }

  return { ok: true, body };
}

export default function GroupInvitationComposePage() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();

  const [inviteeUserIdStr, setInviteeUserIdStr] = useState('');
  const [note, setNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [pageError, setPageError] = useState(null);
  /** @type {null | Record<string, any>} */
  const [sentInvitation, setSentInvitation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewerUserIdComparable, setViewerUserIdComparable] = useState('');

  const numericGroupIdOk = typeof groupId === 'string' && /^\d+$/.test(groupId);

  useEffect(() => {
    const q = searchParams.get('invitee');
    if (!q || !/^\d+$/.test(q.trim())) return;
    setInviteeUserIdStr((prev) => (prev.trim() ? prev : q.trim()));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadViewer() {
      try {
        const payload = await apiFetch('/profile/me');
        const uid = payload?.user?.id;
        if (!cancelled && uid != null) {
          setViewerUserIdComparable(idToComparableString(uid));
        }
      } catch {
        /* optional: compose still works; self-invite may 400 from API */
      }
    }

    void loadViewer();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetErrorsFor = useCallback((patch) => {
    setFieldErrors((er) => {
      const next = { ...er };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
    setBannerError('');
    setSentInvitation(null);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!numericGroupIdOk || !groupId) return;

    const result = validateInviteForm({
      inviteeUserIdStr,
      noteRaw: note,
      viewerUserIdComparable,
    });

    if (!result.ok) {
      setFieldErrors(result.errors || {});
      setBannerError('');
      setSentInvitation(null);
      return;
    }

    setFieldErrors({});
    setBannerError('');
    setPageError(null);
    setSentInvitation(null);
    setSubmitting(true);

    try {
      const payload = await apiFetch(`/groups/${groupId}/invitations`, {
        method: 'POST',
        body: result.body,
      });
      const inv = payload?.invitation;
      setSentInvitation(inv && typeof inv === 'object' ? inv : null);
      setInviteeUserIdStr('');
      setNote('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send invitation.';
      if (err?.status === 403 || err?.status === 404) {
        setPageError({ status: err.status, message });
      } else {
        setBannerError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function inputWarn(field) {
    return fieldErrors[field]
      ? 'border-[#881c1c]/60 bg-[#7a0019]/5 focus:border-[#881c1c]/55'
      : 'border-transparent focus:border-[#881c1c]/40';
  }

  const noteRemain = NOTE_MAX - note.length;

  if (!numericGroupIdOk || !groupId) {
    return (
      <div className="relative p-4 md:p-8">
        <div className="relative z-10 mx-auto max-w-lg rounded-[2rem] border border-[#7a0019]/25 bg-[#7a0019]/10 px-6 py-5 text-[#100e06]">
          Invalid group ID in URL.{' '}
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

  if (pageError) {
    return (
      <ApiErrorState
        status={pageError.status}
        message={pageError.message}
        retryLabel="Try again"
        onRetry={() => setPageError(null)}
      >
        <p className="text-sm text-[#100e06]/70">
          This group may not exist or you may not be authorized to invite
          members.
        </p>
      </ApiErrorState>
    );
  }

  return (
    <div className="relative p-4 md:p-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          to="/group-invitations"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#100e06]/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:text-[#100e06] hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Change group
        </Link>

        <header className="mb-10 space-y-2 text-center">
          <h1 className="text-3xl font-bold text-[#100e06] md:text-4xl">
            Invite someone to{' '}
            <span className="text-[#881c1c]">group {groupId}</span>
          </h1>
          <p className="mx-auto max-w-xl text-[#100e06]/65">
            Pick someone by their user ID (for example from Matches) and send an
            optional note along with the invite.
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

            {sentInvitation ? (
              <div
                role="status"
                className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-[#064e3b]"
              >
                <p className="font-semibold">Invitation sent.</p>
                {sentInvitation.invitee ? (
                  <p className="mt-1 text-[#064e3b]/90">
                    Pending for{' '}
                    <span className="font-medium">
                      {sentInvitation.invitee.display_name ||
                        sentInvitation.invitee.email ||
                        `user ${sentInvitation.invitee_user_id}`}
                    </span>
                    {sentInvitation.invitee.email ? (
                      <span className="text-[#064e3b]/75">
                        {' '}
                        ({sentInvitation.invitee.email})
                      </span>
                    ) : null}
                    .
                  </p>
                ) : (
                  <p className="mt-1">
                    Invitation #{sentInvitation.id} is pending.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="mb-2 flex items-center gap-3 border-b border-[#881c1c]/15 pb-4">
                <div className="rounded-2xl bg-[#881c1c]/10 p-2.5 text-xl text-[#881c1c]">
                  ✉️
                </div>
                <h2 className="text-xl font-bold text-[#100e06]">Invitee</h2>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="invitee-user-id"
                  className="ml-1 flex text-sm font-medium text-[#100e06]/80"
                >
                  Invitee user ID
                </label>
                <input
                  id="invitee-user-id"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="e.g. from Matches list"
                  value={inviteeUserIdStr}
                  onChange={(e) => {
                    resetErrorsFor({ invitee_user_id: true });
                    setInviteeUserIdStr(e.target.value);
                  }}
                  className={`${inputWarn('invitee_user_id')} h-12 w-full rounded-2xl bg-white/80 px-4 font-medium text-[#100e06] shadow-sm transition-all hover:bg-white/90 focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10`}
                />
                {fieldErrors.invitee_user_id ? (
                  <p className="ml-1 text-xs font-medium text-[#881c1c]">
                    {fieldErrors.invitee_user_id}
                  </p>
                ) : (
                  <p className="ml-1 text-xs text-[#100e06]/50">
                    Must match an existing user. You can pre-fill with{' '}
                    <code className="rounded bg-[#100e06]/08 px-1">
                      ?invitee=
                    </code>{' '}
                    in the URL.
                  </p>
                )}
              </div>
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
                onChange={(e) => {
                  resetErrorsFor({ note: true });
                  setNote(e.target.value);
                }}
                className={`${inputWarn('note')} w-full rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-[#100e06] shadow-sm transition hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#881c1c]/10`}
              />
              {fieldErrors.note ? (
                <p className="ml-1 text-xs font-medium text-[#881c1c]">
                  {fieldErrors.note}
                </p>
              ) : (
                <p className="ml-1 text-xs text-[#100e06]/50">
                  Server trims and stores up to {NOTE_MAX} characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] text-sm font-semibold text-white shadow-md shadow-[#7a0019]/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send invitation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
