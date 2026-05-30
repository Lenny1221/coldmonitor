import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

export function PageHeader({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-3xl mx-auto text-center px-5 pt-14 pb-10">
      {kicker && (
        <p className="text-brand text-xs font-semibold uppercase tracking-wider mb-3">{kicker}</p>
      )}
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-navy mb-4">{title}</h1>
      {subtitle && <p className="text-lg text-gray-500 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export function Check() {
  return (
    <span className="w-5 h-5 rounded-full bg-brand/15 flex items-center justify-center shrink-0 mt-0.5">
      <CheckIcon className="w-3 h-3 text-brand" strokeWidth={3} />
    </span>
  );
}

export function CtaBand({
  title,
  text,
  primaryTo = '/contact',
  primaryLabel = 'Gratis demo aanvragen',
  secondaryTo,
  secondaryLabel,
}: {
  title: string;
  text?: string;
  primaryTo?: string;
  primaryLabel?: string;
  secondaryTo?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="px-5 py-16 bg-brand/10">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-display text-2xl font-bold text-navy mb-3">{title}</h2>
        {text && <p className="text-gray-600 text-sm mb-6">{text}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={primaryTo}
            className="inline-flex items-center justify-center gap-2 bg-brand text-navy font-bold px-8 py-3.5 rounded-xl hover:bg-brand-dark transition-colors"
          >
            {primaryLabel}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          {secondaryTo && (
            <Link
              to={secondaryTo}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border-2 border-brand text-brand font-semibold hover:bg-brand/10 transition-colors"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
