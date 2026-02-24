export function HeroPortrait({
  hero,
  size = 48,
  className = "",
}: {
  hero: { name: string; imageUrl: string | null } | undefined;
  size?: number;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    borderRadius: size * 0.25,
  };

  if (!hero) {
    return (
      <div
        className={`hero-portrait ${className}`}
        style={{ ...style, fontSize: size * 0.4 }}
      >
        ?
      </div>
    );
  }

  return hero.imageUrl ? (
    <img
      src={hero.imageUrl}
      alt={hero.name}
      className={`hero-portrait ${className}`}
      style={{ ...style, objectFit: "cover" as const }}
    />
  ) : (
    <div
      className={`hero-portrait ${className}`}
      style={{ ...style, fontSize: size * 0.4 }}
    >
      {hero.name[0]}
    </div>
  );
}
