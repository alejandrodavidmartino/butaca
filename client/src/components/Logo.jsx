import { Link } from 'react-router-dom';

// Logo: una butaca de cine dibujada en SVG + el nombre
export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect x="6" y="3" width="20" height="17" rx="5" fill="currentColor" className="text-butaca-500" />
        <rect x="2" y="13" width="6" height="12" rx="3" fill="currentColor" className="text-butaca-700" />
        <rect x="24" y="13" width="6" height="12" rx="3" fill="currentColor" className="text-butaca-700" />
        <rect x="7" y="18" width="18" height="7" rx="2" fill="currentColor" className="text-butaca-600" />
        <rect x="9" y="25" width="2.5" height="4" fill="#52525b" />
        <rect x="20.5" y="25" width="2.5" height="4" fill="#52525b" />
      </svg>
      <span className="font-display text-3xl tracking-wider text-white">Butaca</span>
    </Link>
  );
}
