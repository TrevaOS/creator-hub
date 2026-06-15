import { useState } from 'react';

const PALETTE = [
  ['#f97316', '#fb923c'],
  ['#06b6d4', '#0891b2'],
  ['#a855f7', '#9333ea'],
  ['#10b981', '#059669'],
  ['#f43f5e', '#e11d48'],
  ['#3b82f6', '#2563eb'],
  ['#eab308', '#ca8a04'],
  ['#ec4899', '#db2777'],
];

function pickColor(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function getInitials(name: string, handle: string): string {
  const source = name || handle.replace(/^@/, '') || 'CR';
  const parts = source.trim().split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'CR';
}

interface CreatorAvatarProps {
  src: string;
  name: string;
  handle: string;
  className?: string;
  size?: number;
}

export function CreatorAvatar({ src, name, handle, className = '', size = 40 }: CreatorAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name, handle);
  const seed = handle || name || 'cr';
  const [bg, fg] = pickColor(seed);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 font-bold text-white select-none ${className}`}
        style={{
          background: `linear-gradient(135deg, ${bg}, ${fg})`,
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          fontSize: size * 0.35,
          borderRadius: '50%',
        }}
        aria-label={name || handle}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || handle}
      className={`flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        objectFit: 'cover',
        objectPosition: 'center top',
        display: 'block',
        borderRadius: '50%',
      }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
