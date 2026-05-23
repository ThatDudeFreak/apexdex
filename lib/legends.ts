import seed from "@/data/legends.json";

export type Legend = {
  slug: string;
  name: string;
  class: string;
  realName?: string;
  origin?: string;
  tagline: string;
  abilities: {
    passive: { name: string; description: string };
    tactical: { name: string; description: string };
    ultimate: { name: string; description: string };
  };
};

const legends: Legend[] = seed as Legend[];

export function getAllLegends(): Legend[] {
  return legends;
}

export function getLegendBySlug(slug: string): Legend | undefined {
  return legends.find((l) => l.slug === slug);
}
