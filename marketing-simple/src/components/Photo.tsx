import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

type Props = {
  /** Bestandsnaam in /public/images, bv. "dashboard-overview.png" */
  src: string;
  alt: string;
  /** Korte omschrijving die in de placeholder verschijnt zolang de foto ontbreekt */
  placeholder?: string;
  className?: string;
  /** Verhouding-hint voor de placeholderhoogte (alleen visueel) */
  ratio?: 'video' | 'wide' | 'square' | 'tall';
};

const ratioClass: Record<NonNullable<Props['ratio']>, string> = {
  video: 'aspect-video',
  wide: 'aspect-[21/9]',
  square: 'aspect-square',
  tall: 'aspect-[3/4]',
};

/**
 * Toont een foto uit /public/images. Ontbreekt het bestand nog, dan verschijnt
 * een nette merk-placeholder met de gewenste omschrijving — zo blijft de layout
 * professioneel tot de echte foto's worden aangeleverd.
 */
export default function Photo({ src, alt, placeholder, className = '', ratio = 'video' }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed border-brand/40 bg-gradient-to-br from-navy to-[#0a1626] flex flex-col items-center justify-center text-center p-6 ${ratioClass[ratio]} ${className}`}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,200,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-brand/15 flex items-center justify-center mx-auto mb-3">
            <PhotoIcon className="h-6 w-6 text-brand" />
          </div>
          <p className="text-white text-sm font-semibold">{placeholder ?? alt}</p>
          <p className="text-white/40 text-xs mt-1 font-mono">images/{src}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={`/images/${src}`}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`block w-full object-cover rounded-2xl ${className}`}
    />
  );
}
