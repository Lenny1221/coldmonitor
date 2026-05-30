/** Zwarte App Store-knop. Vervang `href` door de echte App Store-link zodra die er is. */
export default function AppStoreBadge({ href = '#', className = '' }: { href?: string; className?: string }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-black text-white rounded-xl px-5 py-3 hover:bg-black/85 transition-colors ${className}`}
    >
      <svg viewBox="0 0 384 512" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C71.3 141.2 16 184.8 16 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">Download in de</span>
        <span className="block text-lg font-semibold -mt-0.5">App Store</span>
      </span>
    </a>
  );
}
