'use client';

import Link from 'next/link';

// Deep saturated orange brand color
const BRAND_ORANGE = '#ea580c';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="group-hover:opacity-80 transition-opacity"
      >
        {/* Four closely packed dots in a 2x2 grid */}
        <circle cx="10" cy="10" r="4" fill={BRAND_ORANGE} />
        <circle cx="22" cy="10" r="4" fill={BRAND_ORANGE} />
        <circle cx="10" cy="22" r="4" fill={BRAND_ORANGE} />
        <circle cx="22" cy="22" r="4" fill={BRAND_ORANGE} />
      </svg>
      <span className="text-lg font-semibold text-foreground">
        Kati <span className="text-[#ea580c]">Sajilo</span>
      </span>
    </Link>
  );
}



