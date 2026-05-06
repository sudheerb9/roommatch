import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ApiErrorState from '../components/ui/ApiErrorState';
import { apiFetch } from '../utils/api';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGroup() {
      if (typeof groupId !== 'string' || !/^\d+$/.test(groupId)) {
        setError({ status: 400, message: 'Invalid group id' });
        setLoading(false);
        return;
      }

      try {
        const [groupPayload, membersPayload] = await Promise.all([
          apiFetch(`/groups/${groupId}`),
          apiFetch(`/groups/${groupId}/members`),
        ]);

        if (!cancelled) {
          setGroup(groupPayload.group);
          setMembers(
            Array.isArray(membersPayload.members) ? membersPayload.members : []
          );
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGroup();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="rounded-[2rem] border border-[#881c1c]/15 bg-white/70 p-10 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#881c1c]/20 border-t-[#881c1c]" />
            <p className="text-sm font-medium text-[#100e06]/80">
              Loading group details…
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
        retryLabel="Reload group"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!group) {
    return null;
  }

  const statusLabel =
    group.status === 'ready' ? 'ready for allotment' : group.status;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-8 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#100e06]">{group.name}</h1>
            <p className="mt-2 text-sm text-[#100e06]/65">
              Group {group.id} · status {statusLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/chat?group=${group.id}`)}
              className="rounded-2xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg"
            >
              Start chat
            </button>
            <Link
              to={`/groups/${group.id}/housing-preferences`}
              className="rounded-2xl bg-[#881c1c] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:bg-[#7a0019]"
            >
              Housing preferences
            </Link>
            <Link
              to={`/groups/${group.id}/invite`}
              className="rounded-2xl border border-[#881c1c]/20 bg-white px-5 py-3 text-sm font-semibold text-[#100e06] transition hover:bg-[#f9f5f2]"
            >
              Invite members
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-[#f9f5f2] p-6 shadow-xl shadow-[#7a0019]/5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-[#881c1c]/80">
            Owner
          </h2>
          <p className="mt-3 text-xl font-semibold text-[#100e06]">
            {group.owner_user_id}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-[#f7f1ff] p-6 shadow-xl shadow-[#7a0019]/5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-[#5b21b6]/80">
            Members
          </h2>
          <p className="mt-3 text-xl font-semibold text-[#100e06]">
            {members.length}
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#881c1c]/10 bg-white p-6 shadow-xl shadow-[#7a0019]/5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-[#100e06]/80">
            Group id
          </h2>
          <p className="mt-3 text-xl font-semibold text-[#100e06]">
            {group.id}
          </p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-[#881c1c]/10 bg-white/80 p-6 shadow-xl shadow-[#7a0019]/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#100e06]">Members</h2>
            <p className="mt-2 text-sm text-[#100e06]/65">
              People who currently belong to this group.
            </p>
          </div>
          <div className="hidden sm:block text-sm text-[#100e06]/70">
            {members.length} member{members.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-3xl border border-[#881c1c]/10 bg-[#f9fafb] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-[#100e06]">
                    {member.display_name || `User ${member.id}`}
                  </p>
                  <p className="text-sm text-[#100e06]/65">
                    {member.email || 'No email available'}
                  </p>
                </div>
                <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-sm font-semibold text-[#035388]">
                  {member.role}
                </span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#100e06]/50">
                Joined{' '}
                {member.joined_at
                  ? new Date(member.joined_at).toLocaleString()
                  : 'unknown'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
