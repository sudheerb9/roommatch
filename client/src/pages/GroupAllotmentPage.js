import { ArrowLeft, Building2, CheckCircle2, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ApiErrorState from '../components/ui/ApiErrorState';
import { apiFetch } from '../utils/api';

function toAmenityList(rawAmenities) {
  if (Array.isArray(rawAmenities)) {
    return rawAmenities.filter((item) => typeof item === 'string' && item.trim());
  }
  if (rawAmenities && typeof rawAmenities === 'object') {
    return Object.entries(rawAmenities)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key.replaceAll('_', ' '));
  }
  return [];
}

export default function GroupAllotmentPage() {
  const { groupId } = useParams();
  const [groupName, setGroupName] = useState('Group');
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [groupPayload, assignmentPayload] = await Promise.all([
          apiFetch(`/groups/${groupId}`),
          apiFetch(`/groups/${groupId}/assignment`),
        ]);
        if (cancelled) return;
        setGroupName(groupPayload?.group?.name || 'Group');
        setAssignment(assignmentPayload?.assignment || null);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-[#100e06]/70">Loading allotment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorState
        status={error.status}
        message={error.message}
        retryLabel="Reload allotment"
        onRetry={() => window.location.reload()}
      />
    );
  }

  const unit = assignment?.housingUnit ?? null;
  const amenities = toAmenityList(unit?.amenities);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="rounded-3xl border border-[#881c1c]/10 bg-white/65 p-5 shadow-sm backdrop-blur">
        <Link
          to="/groups"
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#100e06]/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80 hover:text-[#100e06] hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to groups
        </Link>
        <h1 className="text-2xl font-bold text-[#100e06]">{groupName} allotment</h1>
        <p className="mt-1 text-sm text-[#100e06]/65">
          Your group's assigned housing unit and key details.
        </p>
      </div>

      {unit ? (
        <div className="rounded-3xl border border-emerald-200/80 bg-white/75 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Allotted
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#100e06]">
                {unit.unit_code}
              </h2>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-[#100e06]/75">
                <Building2 className="h-4 w-4" aria-hidden />
                {unit.building || 'Building not specified'}
              </p>
            </div>
            <div className="grid gap-2 text-sm text-[#100e06]/80">
              <p>
                <span className="font-semibold text-[#100e06]">Bedrooms:</span>{' '}
                {unit.bedrooms ?? '-'}
              </p>
              <p>
                <span className="font-semibold text-[#100e06]">Bathrooms:</span>{' '}
                {unit.bathrooms ?? '-'}
              </p>
              <p>
                <span className="font-semibold text-[#100e06]">Floor:</span>{' '}
                {unit.floor ?? '-'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#100e06]/70">
              Unit features
            </h3>
            {amenities.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border border-[#881c1c]/15 bg-[#faf5f0] px-3 py-1 text-xs font-medium capitalize text-[#100e06]"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#100e06]/65">
                No specific features listed for this unit.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#881c1c]/12 bg-white/75 p-8 text-center shadow-sm">
          <Home className="mx-auto h-8 w-8 text-[#881c1c]/70" aria-hidden />
          <h2 className="mt-3 text-xl font-semibold text-[#100e06]">
            No allotment yet
          </h2>
          <p className="mt-2 text-sm text-[#100e06]/65">
            Your group has not been assigned a unit yet.
          </p>
        </div>
      )}
    </div>
  );
}
