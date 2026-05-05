import { Link } from 'react-router-dom';

export default function ApiErrorState({
  status,
  message,
  title,
  retryLabel,
  onRetry,
  children,
}) {
  const defaultTitle =
    title ||
    (status === 403
      ? 'Access denied'
      : status === 404
        ? 'Not found'
        : 'Something went wrong');

  const defaultMessage =
    message ||
    (status === 403
      ? 'You are not a member of this group or do not have permission to access it.'
      : status === 404
        ? 'The requested group or resource could not be found.'
        : 'An unexpected error occurred while loading this page.');

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[#881c1c]/10 bg-white/70 p-8 shadow-xl shadow-[#7a0019]/5 backdrop-blur-xl">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#881c1c]">
            {status || 'Error'}
          </p>
          <h1 className="text-3xl font-bold text-[#100e06]">{defaultTitle}</h1>
          <p className="text-sm leading-6 text-[#100e06]/75">
            {defaultMessage}
          </p>
          {children}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-2xl bg-[#881c1c] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:bg-[#7a0019]"
              >
                {retryLabel || 'Retry'}
              </button>
            ) : null}
            <Link
              to="/groups"
              className="rounded-2xl border border-[#881c1c]/20 bg-white px-5 py-3 text-sm font-semibold text-[#100e06] transition hover:bg-[#f9f5f2]"
            >
              My groups
            </Link>
            <Link
              to="/group-housing"
              className="rounded-2xl border border-[#881c1c]/20 bg-white px-5 py-3 text-sm font-semibold text-[#100e06] transition hover:bg-[#f9f5f2]"
            >
              Group housing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
