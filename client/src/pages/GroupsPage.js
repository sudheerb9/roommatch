import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiErrorState from '../components/ui/ApiErrorState';
import { apiFetch } from '../utils/api';

const STATUS_BADGES = {
  forming: 'bg-[#fef3c7] text-[#92400e] border-[#fbbf24]/40',
  ready: 'bg-[#d1fae5] text-[#0f766e] border-[#34d399]/40',
  assigned: 'bg-[#dbeafe] text-[#3730a3] border-[#93c5fd]/40',
  archived: 'bg-[#f5f3ff] text-[#5b21b6] border-[#c4b5fd]/40',
};

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      try {
        const payload = await apiFetch('/groups');
        if (!cancelled) {
          setGroups(Array.isArray(payload.groups) ? payload.groups : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="rounded-[2rem] border border-[#881c1c]/15 bg-white/70 p-10 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#881c1c]/20 border-t-[#881c1c]" />
            <p className="text-sm font-medium text-[#100e06]/80">
              Loading your groups…
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
        retryLabel="Reload groups"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-8 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#100e06]">My groups</h1>
            <p className="mt-2 text-sm text-[#100e06]/65">
              See groups you own or belong to, plus quick access to housing and
              invitations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex items-center justify-center rounded-2xl bg-[#881c1c] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:bg-[#7a0019]"
            >
              Create group
            </button>
            <Link
              to="/group-housing"
              className="inline-flex items-center justify-center rounded-2xl border border-[#881c1c]/20 bg-white px-5 py-3 text-sm font-semibold text-[#100e06] shadow-md shadow-[#7a0019]/10 transition hover:bg-[#f9f5f2]"
            >
              Manage group housing
            </Link>
          </div>
        </div>
      </div>

      {showCreateGroup ? (
        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-8 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#100e06]">
                Create a new group
              </h2>
              <p className="mt-2 text-sm text-[#100e06]/65">
                Give your group a name and get started with membership and
                housing.
              </p>
            </div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setCreateError(null);
                const name = newGroupName.trim();
                if (!name) {
                  setCreateError({ message: 'Group name is required.' });
                  return;
                }

                try {
                  setCreating(true);
                  const payload = await apiFetch('/groups', {
                    method: 'POST',
                    body: { name },
                  });
                  setGroups((current) => [payload.group, ...current]);
                  setNewGroupName('');
                  setShowCreateGroup(false);
                  navigate(`/groups/${payload.group.id}`);
                } catch (err) {
                  setCreateError(err);
                } finally {
                  setCreating(false);
                }
              }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-[#100e06]">
                Group name
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-[#d4d4d8] bg-white px-4 py-3 text-sm text-[#100e06] shadow-sm outline-none transition focus:border-[#881c1c] focus:ring-2 focus:ring-[#881c1c]/10"
                  placeholder="Roommatch study crew"
                />
              </label>
              {createError ? (
                <p className="text-sm text-[#b91c1c]">{createError.message}</p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#881c1c] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:bg-[#7a0019] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create group'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setCreateError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#881c1c]/20 bg-white px-5 py-3 text-sm font-semibold text-[#100e06] transition hover:bg-[#f9f5f2]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-10 text-center shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-[#100e06]">
            No groups yet
          </h2>
          <p className="mt-2 text-sm text-[#100e06]/65">
            You are not yet a member of any group. Create a group to begin or
            join one, then refresh this page.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.id}
              className="rounded-[2rem] border border-[#881c1c]/10 bg-white/80 p-6 shadow-xl shadow-[#7a0019]/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#100e06]">
                    <Link
                      to={`/groups/${group.id}`}
                      className="transition hover:text-[#881c1c]"
                    >
                      {group.name}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-[#100e06]/65">
                    Group ID {group.id}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_BADGES[group.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                >
                  {group.status}
                </span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#881c1c]/10 bg-[#faf5f0] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#881c1c]/80">
                    Members
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#100e06]">
                    {group.member_count}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#881c1c]/10 bg-[#f7f1ff] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5b21b6]/80">
                    Owner
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#100e06]">
                    {group.owner_user_id}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/groups/${group.id}/housing-preferences`}
                  className="rounded-2xl border border-[#881c1c]/20 bg-white px-4 py-3 text-sm font-semibold text-[#100e06] transition hover:bg-[#f9f5f2]"
                >
                  Housing preferences
                </Link>
                <Link
                  to={`/groups/${group.id}/invite`}
                  className="rounded-2xl border border-[#881c1c]/20 bg-white px-4 py-3 text-sm font-semibold text-[#100e06] transition hover:bg-[#f9f5f2]"
                >
                  Invite members
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
