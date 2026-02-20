import type { SkillStep } from "@/lib/validations/guide";

interface Hero {
  id: string;
  name: string;
  imageUrl: string | null;
  skill1ImageUrl: string | null;
  skill2ImageUrl: string | null;
}

function resolveSkillStep(step: SkillStep, heroes: Hero[]) {
  const hero = heroes.find((h) => h.id === step.hero_id);
  if (!hero)
    return {
      heroName: "?",
      skillName: "?",
      heroImage: "",
      skillImage: "",
      note: step.note || "",
    };
  const skillName = step.skill_number === 1 ? "Skill 1" : "Skill 2";
  const skillImage =
    step.skill_number === 1 ? hero.skill1ImageUrl : hero.skill2ImageUrl;
  return {
    heroName: hero.name,
    skillName,
    heroImage: hero.imageUrl,
    skillImage,
    note: step.note || "",
  };
}

export function SkillChain({
  steps,
  heroes,
}: {
  steps: SkillStep[];
  heroes: Hero[];
}) {
  return (
    <div className="skill-chain">
      {steps.map((step, i) => {
        const resolved = resolveSkillStep(step, heroes);
        return (
          <div key={i} className="contents">
            {i > 0 && <span className="skill-chain-arrow">&rarr;</span>}
            <div className="skill-step">
              <span className="skill-step-number">{i + 1}</span>
              {resolved.skillImage ? (
                <img
                  src={resolved.skillImage}
                  alt={resolved.skillName}
                  className="skill-icon"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="skill-icon">{resolved.heroName[0]}</span>
              )}
              <span>{resolved.skillName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SkillStepDetail({
  steps,
  heroes,
  color = "accent",
}: {
  steps: SkillStep[];
  heroes: Hero[];
  color?: "accent" | "cyan";
}) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const resolved = resolveSkillStep(step, heroes);
        const hero = heroes.find((h) => h.id === step.hero_id);
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl transition-colors"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dim)",
            }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 font-display font-bold text-xs"
              style={{
                background:
                  i === 0
                    ? color === "accent"
                      ? "linear-gradient(135deg, var(--accent), var(--accent-dim))"
                      : "linear-gradient(135deg, var(--cyan), var(--cyan-dim))"
                    : "var(--bg-card)",
                color: i === 0 ? "white" : "var(--text-secondary)",
                border:
                  i === 0 ? "none" : "1px solid var(--border-default)",
              }}
            >
              {i + 1}
            </div>

            {hero?.imageUrl ? (
              <img
                src={hero.imageUrl}
                alt={resolved.heroName}
                className={`hero-portrait flex-shrink-0 ${color === "accent" ? "hero-portrait-attack" : "hero-portrait-defense"}`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                className={`hero-portrait flex-shrink-0 ${color === "accent" ? "hero-portrait-attack" : "hero-portrait-defense"}`}
                style={{ width: 40, height: 40, borderRadius: 10 }}
              >
                {resolved.heroName[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-text-muted">
                  {resolved.heroName}
                </span>
                <span className="text-[10px] text-text-muted">&#x2022;</span>
                {resolved.skillImage ? (
                  <img
                    src={resolved.skillImage}
                    alt={resolved.skillName}
                    className="skill-icon"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    className="skill-icon"
                    style={{
                      width: 18,
                      height: 18,
                      fontSize: 10,
                      borderRadius: 5,
                    }}
                  >
                    {resolved.skillName[0]}
                  </span>
                )}
                <span className="text-sm font-semibold text-text-primary">
                  {resolved.skillName}
                </span>
              </div>
              {resolved.note && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {resolved.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
