const badgeBase =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] text-sm font-medium border transition-colors";

export function getHeroTypeBadgeClasses(type: string): string {
  switch (type) {
    case "MAGIC":
      return `${badgeBase} bg-cyan/20 text-cyan border-cyan/40`;
    case "PHYSICAL":
      return `${badgeBase} bg-accent/20 text-accent border-accent/40`;
    case "UNIVERSAL":
      return `${badgeBase} bg-green/20 text-green border-green/40`;
    case "TANK":
      return `${badgeBase} bg-gold/20 text-gold border-gold/40`;
    case "SUPPORT":
      return `${badgeBase} bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/40`;
    default:
      return `${badgeBase} bg-text-muted/20 text-text-muted border-text-muted/40`;
  }
}

const rarityBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold border";

export function getRarityBadgeClasses(rarity: string): string {
  return rarity === "LEGEND"
    ? `${rarityBase} bg-gold/30 text-gold border-gold/50`
    : `${rarityBase} bg-text-muted/20 text-text-muted border-text-muted/40`;
}
