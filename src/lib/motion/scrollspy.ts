export interface SectionIntersection {
  id: string;
  ratio: number;
}

export function currentVisibleSection(intersections: SectionIntersection[]): string | null {
  let bestId: string | null = null;
  let bestRatio = 0;
  for (const entry of intersections) {
    if (entry.ratio > bestRatio) {
      bestRatio = entry.ratio;
      bestId = entry.id;
    }
  }
  return bestId;
}
