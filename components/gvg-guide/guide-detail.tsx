"use client";

import { useState } from "react";
import Link from "next/link";
import type { SkillStep } from "@/lib/validations/guide";
import { SkillStepDetail } from "./skill-chain";

interface Hero {
  id: string;
  name: string;
  imageUrl: string | null;
  skill1ImageUrl: string | null;
  skill2ImageUrl: string | null;
}

interface Guide {
  id: string;
  title: string;
  defenseHeroes: string[];
  attackHeroes: string[];
  attackPriority: number;
  attackSkillOrder: unknown;
  defenseSkillOrder: unknown;
  strategyNotes: string | null;
  mediaUrls: string[] | null;
  patchVersion: string;
  version: number | null;
  status: string | null;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface GuideVersion {
  id: string;
  version: number;
  title: string;
  createdAt: Date | null;
}

function HeroPortrait({
  hero,
  size = 64,
  className = "",
}: {
  hero: Hero | undefined;
  size?: number;
  className?: string;
}) {
  if (!hero) {
    return (
      <div
        className={`hero-portrait ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.25,
          fontSize: size * 0.4,
        }}
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
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      className={`hero-portrait ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        fontSize: size * 0.4,
      }}
    >
      {hero.name[0]}
    </div>
  );
}

function SkillIcon({
  hero,
  skillNumber,
  size = 22,
}: {
  hero: Hero | undefined;
  skillNumber: 1 | 2;
  size?: number;
}) {
  if (!hero)
    return (
      <span className="skill-icon" style={{ width: size, height: size }}>
        ?
      </span>
    );
  const url =
    skillNumber === 1 ? hero.skill1ImageUrl : hero.skill2ImageUrl;
  const name = skillNumber === 1 ? "Skill 1" : "Skill 2";
  return url ? (
    <img
      src={url}
      alt={name}
      className="skill-icon"
      title={name}
      style={{ width: size, height: size, objectFit: "cover" }}
    />
  ) : (
    <span
      className="skill-icon"
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {name[0]}
    </span>
  );
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

export function GuideDetailView({
  guide,
  heroes,
  versions: initialVersions,
}: {
  guide: Guide;
  heroes: Hero[];
  versions: GuideVersion[];
}) {
  const [showVersions, setShowVersions] = useState(false);

  const heroByName = (name: string) => heroes.find((h) => h.name === name);
  const updatedDate = guide.updatedAt
    ? new Date(guide.updatedAt).toLocaleDateString("th-TH")
    : "";

  const priorityClass =
    guide.attackPriority === 1
      ? "priority-1"
      : guide.attackPriority === 2
        ? "priority-2"
        : guide.attackPriority === 3
          ? "priority-3"
          : "priority-fallback";

  const attackSteps = (guide.attackSkillOrder ?? []) as SkillStep[];
  const defenseSteps = (guide.defenseSkillOrder ?? []) as SkillStep[];

  return (
    <div className="min-h-screen relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(230,57,70,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 tactical-grid opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Back nav */}
        <Link
          href="/gvg-guides"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mb-6 animate-fade-in"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          กลับหน้าค้นหา
        </Link>

        {/* Title section */}
        <div className="mb-8 animate-fade-in-up stagger-1">
          <div className="flex items-start gap-3 mb-3">
            <span className={`priority-badge ${priorityClass}`}>
              {guide.attackPriority}
            </span>
            <h1 className="text-lg sm:text-xl font-bold font-display text-text-primary leading-snug">
              {guide.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span className="patch-badge">{guide.patchVersion}</span>
            <span>อัปเดต: {updatedDate}</span>
            <span
              className="px-2 py-0.5 rounded-md border"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-dim)",
              }}
            >
              v{guide.version}
            </span>
          </div>
        </div>

        {/* Defense team */}
        <div className="detail-section mb-4 animate-fade-in-up stagger-2">
          <div className="detail-section-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="var(--cyan)"
            >
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
            </svg>
            <span className="team-label-defense">ทีมป้องกัน</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            {guide.defenseHeroes.map((name) => {
              const hero = heroByName(name);
              return (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2"
                >
                  <HeroPortrait
                    hero={hero}
                    size={64}
                    className="hero-portrait-lg hero-portrait-defense"
                  />
                  <span className="text-xs font-medium text-text-primary text-center">
                    {name}
                  </span>
                  <div className="flex gap-1">
                    <SkillIcon hero={hero} skillNumber={1} />
                    <SkillIcon hero={hero} skillNumber={2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VS separator */}
        <div className="flex items-center justify-center gap-3 my-2 animate-fade-in-up stagger-3">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--border-dim))",
            }}
          />
          <span className="font-display font-bold text-sm text-accent tracking-widest animate-pulse-glow px-3 py-1 rounded-lg">
            VS
          </span>
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, var(--border-dim), transparent)",
            }}
          />
        </div>

        {/* Attack team */}
        <div className="detail-section mb-6 animate-fade-in-up stagger-4">
          <div className="detail-section-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="var(--green)"
            >
              <path d="M7.5 2l-5 5 5 5-5 5 5 5 5-5-5-5 5-5z M14.5 2l5 5-5 5 5 5-5 5-5-5 5-5-5-5z" />
            </svg>
            <span className="team-label-attack">ทีมโจมตี</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            {guide.attackHeroes.map((name) => {
              const hero = heroByName(name);
              return (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2"
                >
                  <HeroPortrait
                    hero={hero}
                    size={64}
                    className="hero-portrait-lg hero-portrait-attack"
                  />
                  <span className="text-xs font-medium text-text-primary text-center">
                    {name}
                  </span>
                  <div className="flex gap-1">
                    <SkillIcon hero={hero} skillNumber={1} />
                    <SkillIcon hero={hero} skillNumber={2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attack skill order */}
        {attackSteps.length > 0 && (
          <div className="detail-section mb-4 animate-fade-in-up stagger-5">
            <div className="detail-section-header">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-display font-semibold text-sm text-text-primary">
                ลำดับสกิลโจมตี
              </span>
              <span className="text-[10px] text-accent font-display font-semibold uppercase tracking-wider ml-auto">
                สำคัญ
              </span>
            </div>
            <SkillStepDetail
              steps={attackSteps}
              heroes={heroes}
              color="accent"
            />
          </div>
        )}

        {/* Defense skill order */}
        {defenseSteps.length > 0 && (
          <div className="detail-section mb-4 animate-fade-in-up stagger-6">
            <div className="detail-section-header">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-display font-semibold text-sm text-text-primary">
                ลำดับสกิลป้องกัน
              </span>
              <span className="text-[10px] text-text-muted font-display uppercase tracking-wider ml-auto">
                ตั้งค่าศัตรู
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {defenseSteps.map((step, i) => {
                const hero = heroes.find((h) => h.id === step.hero_id);
                const skillImage =
                  step.skill_number === 1
                    ? hero?.skill1ImageUrl
                    : hero?.skill2ImageUrl;
                const skillName =
                  step.skill_number === 1 ? "Skill 1" : "Skill 2";
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-dim)",
                    }}
                  >
                    {skillImage ? (
                      <img
                        src={skillImage}
                        alt=""
                        className="skill-icon"
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        className="skill-icon"
                        style={{
                          width: 20,
                          height: 20,
                          fontSize: 11,
                          borderRadius: 5,
                        }}
                      >
                        {hero?.name[0] ?? "?"}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {hero?.name ?? "?"}:
                    </span>
                    <span className="text-xs font-medium text-text-primary">
                      {skillName}
                    </span>
                    {step.note && (
                      <span className="text-[10px] text-text-muted">
                        ({step.note})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategy notes */}
        {guide.strategyNotes && (
          <div className="detail-section mb-6 animate-fade-in-up stagger-7">
            <div className="detail-section-header">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="font-display font-semibold text-sm text-text-primary">
                หมายเหตุกลยุทธ์
              </span>
            </div>
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {guide.strategyNotes}
            </div>
          </div>
        )}

        {/* Media gallery */}
        {guide.mediaUrls && guide.mediaUrls.length > 0 && (
          <div className="detail-section mb-6 animate-fade-in-up stagger-8">
            <div className="detail-section-header">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="font-display font-semibold text-sm text-text-primary">
                สื่อประกอบ
              </span>
            </div>
            <div className="space-y-3">
              {guide.mediaUrls.map((url, i) => {
                const ytId = getYouTubeId(url);
                if (ytId) {
                  return (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border-dim)" }}
                    >
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                        title={`Video ${i + 1}`}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                }
                return (
                  <img
                    key={i}
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full rounded-xl object-contain"
                    style={{ border: "1px solid var(--border-dim)" }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Version history */}
        <div className="mb-6 animate-fade-in-up stagger-9">
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer w-full"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>ประวัติเวอร์ชัน (v{guide.version})</span>
            <span
              className="ml-auto transition-transform"
              style={{
                transform: showVersions ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              &#x25BC;
            </span>
          </button>

          {showVersions && (
            <div className="mt-3 space-y-2">
              {/* Current version */}
              <div
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--accent-dim)",
                }}
              >
                <span
                  className="text-xs font-bold font-display"
                  style={{ color: "var(--accent)" }}
                >
                  v{guide.version}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-primary)" }}
                >
                  {guide.title}
                </span>
                <span
                  className="ml-auto text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  ปัจจุบัน
                </span>
              </div>

              {/* Previous versions */}
              {initialVersions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-dim)",
                  }}
                >
                  <span
                    className="text-xs font-bold font-display"
                    style={{ color: "var(--text-muted)" }}
                  >
                    v{v.version}
                  </span>
                  <span
                    className="text-xs truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {v.title}
                  </span>
                  <span
                    className="ml-auto text-[10px] flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {v.createdAt
                      ? new Date(v.createdAt).toLocaleDateString("th-TH")
                      : ""}
                  </span>
                </div>
              ))}

              {initialVersions.length === 0 && (
                <p
                  className="text-xs py-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  ไม่มีเวอร์ชันก่อนหน้า
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div
          className="flex items-center justify-between pt-4 animate-fade-in-up stagger-10"
          style={{ borderTop: "1px solid var(--border-dim)" }}
        >
          <Link
            href="/gvg-guides"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            กลับหน้าค้นหา
          </Link>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dim)",
            }}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            แชร์ลิงก์
          </button>
        </div>
      </div>
    </div>
  );
}
