import { useState } from 'react';
import { EMBLEM_IMAGE_URL } from '../constants';

interface EmblemLogoProps {
  sizeClass?: string;
  className?: string;
}

export function EmblemLogo({ sizeClass = 'w-11 h-11', className = '' }: EmblemLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#072F24] border-2 border-[#C99A2E] flex items-center justify-center text-[#E2BE5B] font-arabic font-bold text-sm shrink-0 ${className}`}
        aria-label="Logo Iḥyā’ul ‘Arabiyyah"
      >
        إحياء
      </div>
    );
  }

  return (
    <img
      src={EMBLEM_IMAGE_URL}
      alt="Logo resmi Iḥyā’ul ‘Arabiyyah"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} object-contain shrink-0 drop-shadow-sm ${className}`}
    />
  );
}
