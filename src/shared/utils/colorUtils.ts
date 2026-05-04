export const BADGE_COLORS = [
  'bg-muted text-foreground/70 border-border',
  'bg-foreground/5 text-foreground/80 border-foreground/10',
  'bg-foreground/10 text-foreground/90 border-foreground/20',
  'bg-muted/50 text-foreground/60 border-border/50',
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
