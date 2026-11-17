import { groupImageUrl } from '../services/groups';

// Foto del grupo o, si no tiene, su emoji
export default function GroupAvatar({ group, className = 'h-12 w-12 text-2xl rounded-xl' }) {
  const src = groupImageUrl(group);
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden bg-telon ring-1 ring-white/10 ${className}`}>
      {src ? <img src={src} alt={`Foto de ${group.name}`} className="h-full w-full object-cover" /> : <span aria-hidden="true">{group.emoji}</span>}
    </span>
  );
}
