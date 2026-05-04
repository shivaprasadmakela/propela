export const BADGE_COLORS = [
  'bg-[#fff7ed] text-[#fb923c] border-[#ffedd5]', // Orange/Peach (Paused)
  'bg-[#f0f9ff] text-[#0ea5e9] border-[#e0f2fe]', // Blue (Inactive)
  'bg-[#f0fdf4] text-[#22c55e] border-[#dcfce7]', // Green (Active)
  'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2]', // Red (Inactive)
  'bg-[#faf5ff] text-[#a855f7] border-[#f3e8ff]', // Purple (Private)
];

export function getStringColorClass(value: string | undefined | null): string {
  if (!value) return 'bg-muted/30 text-foreground/40 border-border/50';

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  
  const index = Math.abs(hash) % BADGE_COLORS.length;
  return BADGE_COLORS[index];
}
