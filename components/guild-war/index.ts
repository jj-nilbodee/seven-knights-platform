export { HeroSelector } from "./hero-selector";
export { FormationSelector } from "./formation-selector";
export { FormationGrid } from "./formation-grid";
export { SkillSequenceSelector } from "./skill-sequence-selector";
export { TeamComposition } from "./team-composition";

// Hero type matching our DB schema (heroes table)
export interface HeroData {
  id: string;
  name: string;
  heroType: string;
  rarity: string;
  imageUrl: string | null;
  skill1Id: string | null;
  skill1Name: string;
  skill1Type: string;
  skill1ImageUrl: string | null;
  skill2Id: string | null;
  skill2Name: string;
  skill2Type: string;
  skill2ImageUrl: string | null;
  skill3Id: string | null;
  skill3Name: string;
  skill3Type: string;
  skill3ImageUrl: string | null;
}

export type Position = "front" | "back";
export type Formation = "4-1" | "3-2" | "1-4" | "2-3" | null;

export interface SelectedHero {
  heroId: string;
  hero: HeroData;
  position: Position | null;
}

export interface SkillSequenceItem {
  heroId: string;
  skillId: string;
  order: 1 | 2 | 3;
  heroName: string;
  skillName: string;
}

export interface TeamCompositionState {
  selectedHeroes: SelectedHero[];
  formation: Formation;
  skillSequence: SkillSequenceItem[];
  speed: number | "";
}

export const initialTeamState: TeamCompositionState = {
  selectedHeroes: [],
  formation: null,
  skillSequence: [],
  speed: "",
};
