const badgeBase =
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide font-display border transition-colors";

export function getHeroTypeBadgeClasses(type: string): string {
  switch (type) {
    case "MAGIC":
      return `${badgeBase} bg-cyan/20 text-cyan border-cyan-dim`;
    case "PHYSICAL":
      return `${badgeBase} bg-accent/20 text-accent border-accent-dim`;
    case "UNIVERSAL":
      return `${badgeBase} bg-green/20 text-green border-green-dim`;
    case "TANK":
      return `${badgeBase} bg-gold/20 text-gold border-gold-dim`;
    case "SUPPORT":
      return `${badgeBase} bg-purple/20 text-purple border-purple-dim`;
    default:
      return `${badgeBase} bg-text-muted/20 text-text-muted border-text-muted/40`;
  }
}

const rarityBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide font-display border";

export function getRarityBadgeClasses(rarity: string): string {
  return rarity === "LEGEND"
    ? `${rarityBase} bg-gold/30 text-gold border-gold-dim`
    : `${rarityBase} bg-text-muted/20 text-text-muted border-text-muted/40`;
}

const statusBase =
  "inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide font-display border";

export function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return `${statusBase} bg-green/20 text-green border-green/30`;
    case "warning":
      return `${statusBase} bg-gold/20 text-gold border-gold/30`;
    case "inactive":
      return `${statusBase} bg-text-muted/20 text-text-muted border-text-muted/30`;
    default:
      return `${statusBase} bg-text-muted/20 text-text-muted border-text-muted/30`;
  }
}

export function getResultBadgeClasses(result: string): string {
  return result === "win"
    ? `${statusBase} bg-green/20 text-green border-green/30`
    : `${statusBase} bg-accent/20 text-accent border-accent/30`;
}
