import type { Project } from '@/lib/schemas/projects';

const FEATURED_ORDER_MIN = 1;
const FEATURED_ORDER_MAX = 3;

export interface FeaturedConflictResult {
  conflicting: Project | null;
}

function assertOrderInRange(candidateOrder: number): void {
  if (
    !Number.isInteger(candidateOrder) ||
    candidateOrder < FEATURED_ORDER_MIN ||
    candidateOrder > FEATURED_ORDER_MAX
  ) {
    throw new Error(
      `featured-rules: order must be an integer in [${FEATURED_ORDER_MIN.toString()}, ${FEATURED_ORDER_MAX.toString()}], received ${candidateOrder.toString()}`,
    );
  }
}

export function detectFeaturedConflict(
  projects: readonly Project[],
  candidateOrder: number,
): FeaturedConflictResult {
  assertOrderInRange(candidateOrder);
  const conflicting =
    projects.find((project) => project.featured && project.order === candidateOrder) ?? null;
  return { conflicting };
}

export function proposeDemotion(projects: readonly Project[], candidateOrder: number): Project[] {
  const { conflicting } = detectFeaturedConflict(projects, candidateOrder);
  return conflicting === null ? [] : [conflicting];
}

export function proposePromotion(projects: readonly Project[], freedOrder: number): Project[] {
  assertOrderInRange(freedOrder);
  const nonFeatured = projects.filter((project) => !project.featured);
  const sortedCandidates = [...nonFeatured].sort((firstProject, secondProject) => {
    if (firstProject.year !== secondProject.year) {
      return secondProject.year - firstProject.year;
    }
    return firstProject.slug.localeCompare(secondProject.slug);
  });
  return sortedCandidates;
}
