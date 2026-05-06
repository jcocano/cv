import type { Project } from '@/lib/schemas/projects';

interface SplitFeaturedResult {
  featured: Project | null;
  rest: Project[];
}

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
