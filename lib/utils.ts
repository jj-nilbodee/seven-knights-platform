import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function winRateColor(rate: number) {
  if (rate >= 60) return "text-green";
  if (rate >= 40) return "text-gold";
  return "text-accent";
}

export function winRateBarBg(rate: number) {
  if (rate >= 60) return "bg-green/30";
  if (rate >= 40) return "bg-gold/30";
  return "bg-accent/30";
}

export function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
