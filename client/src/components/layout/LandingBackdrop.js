// Reusable UI component for the LandingBackdrop interface element.
/**
 * Same soft burgundy blob layer as the marketing home page, for app shell pages.
 */
export default function LandingBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#7a0019] opacity-20 mix-blend-multiply blur-3xl filter animate-blob" />
      <div className="absolute -right-4 top-0 h-96 w-96 animate-blob-delay-2 rounded-full bg-[#881c1c] opacity-20 mix-blend-multiply blur-3xl filter" />
      <div className="absolute -bottom-32 left-20 h-96 w-96 animate-blob-delay-4 rounded-full bg-[#a0252a] opacity-20 mix-blend-multiply blur-3xl filter" />
    </div>
  );
}
