export const BADGE_COLORS = [
  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'bg-rose-500/15 text-rose-400 border-rose-500/20',
  'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
];

export function getStringColorClass(value: string | undefined | null): string {
  if (!value) return 'bg-white/5 text-white/50 border-white/10';

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Ensure index is positive
  const index = Math.abs(hash) % BADGE_COLORS.length;
  return BADGE_COLORS[index];
}
