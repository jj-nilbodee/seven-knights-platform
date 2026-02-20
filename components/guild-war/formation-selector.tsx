"use client";

import type { Formation } from "./index";
import { cn } from "@/lib/utils";

interface FormationSelectorProps {
  value: Formation;
  onChange: (formation: Formation) => void;
  maxHeroes?: number;
  variant: "allied" | "enemy";
  disabled?: boolean;
}

const formations: {
  value: Formation;
  label: string;
  front: number;
  back: number;
}[] = [
  { value: null, label: "ไม่มี", front: 0, back: 0 },
  { value: "4-1", label: "4-1", front: 4, back: 1 },
  { value: "3-2", label: "3-2", front: 3, back: 2 },
  { value: "1-4", label: "1-4", front: 1, back: 4 },
  { value: "2-3", label: "2-3", front: 2, back: 3 },
];

const variantStyles = {
  allied: {
    selected: "bg-cyan/20 border-cyan text-cyan",
    hover: "hover:border-cyan/50 hover:bg-cyan/10",
  },
  enemy: {
    selected: "bg-accent/20 border-accent text-accent",
    hover: "hover:border-accent/50 hover:bg-accent/10",
  },
};

export function FormationSelector({
  value,
  onChange,
  maxHeroes = 3,
  variant,
  disabled = false,
}: FormationSelectorProps) {
  const styles = variantStyles[variant];

  const getDescription = (formation: Formation): string => {
    if (formation === null) {
      return `ไม่มีจัดทัพ — วางฮีโร่ได้อิสระ (0-${maxHeroes})`;
    }
    const f = formations.find((f) => f.value === formation);
    if (!f) return "";
    return `${f.front} หน้า + ${f.back} หลัง — วาง ${maxHeroes} ฮีโร่ในตำแหน่งใดก็ได้`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center">
        {formations.map((formation) => {
          const isSelected = value === formation.value;

          return (
            <button
              key={formation.label}
              onClick={() => onChange(formation.value)}
              disabled={disabled}
              className={cn(
                "h-11 min-w-[56px] px-4 rounded-[var(--radius-md)] border font-medium transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? styles.selected
                  : cn(
                      "bg-bg-input border-border-default text-text-primary",
                      styles.hover,
                    ),
              )}
            >
              {formation.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-text-muted text-center">
        {getDescription(value)}
      </p>
    </div>
  );
}
