import type { Project } from '@/lib/schemas/projects';

interface SplitFeaturedResult {
  featured: Project;
  rest: Project[];
}

/**
 * Splits a list of projects into the single hero `featured` card and the rest
 * of the grid. When more than one project is marked as featured, the one with
 * the lowest `order` wins and the others fall through to `rest`. The `rest`
 * array is always sorted by `order` ascending so callers can render the grid
 * deterministically.
 *
 * Contract: throws when there are zero featured projects — the Work section
 * assumes a featured card always exists, so a missing one is a content bug
 * we want to surface during build, not a silent UI degradation.
 */
export function splitFeatured(projects: Project[]): SplitFeaturedResult {
  const featuredCandidates = projects.filter((project) => project.featured);

  if (featuredCandidates.length === 0) {
    throw new Error('splitFeatured requires at least one featured project, got 0');
  }

  const sortedFeatured = [...featuredCandidates].sort((a, b) => a.order - b.order);
  const featured = sortedFeatured[0];
  if (featured === undefined) {
    // Defensive: filter().length === 0 already returned above; this branch is
    // unreachable but keeps the type non-undefined without a non-null assertion.
    throw new Error('splitFeatured requires at least one featured project, got 0');
  }

  const rest = projects
    .filter((project) => project !== featured)
    .slice()
    .sort((a, b) => a.order - b.order);

  return { featured, rest };
}
