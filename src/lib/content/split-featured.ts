import type { Project } from '@/lib/schemas/projects';

interface SplitFeaturedResult {
  featured: Project | null;
  rest: Project[];
}

/**
 * Splits a list of FEATURED projects into the hero card (lowest `order`) and
 * the rest of the grid (sorted by `order` ascending).
 *
 * Contract (relaxed in feature #37):
 * - The collection may be empty or have zero featured entries; in either case
 *   the function returns `{ featured: null, rest: [] }` without throwing. The
 *   caller decides whether to render the bloque.
 * - Non-featured entries are ignored — they belong to the "More projects"
 *   bucket (`src/data/more_projects.json`), not to the case-studies grid.
 */
export function splitFeatured(projects: readonly Project[]): SplitFeaturedResult {
  const featuredCandidates = projects.filter((project) => project.featured);

  if (featuredCandidates.length === 0) {
    return { featured: null, rest: [] };
  }

  const sortedFeatured = [...featuredCandidates].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  const [featured, ...rest] = sortedFeatured;
  if (featured === undefined) {
    return { featured: null, rest: [] };
  }

  return { featured, rest };
}
