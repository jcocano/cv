import type { Project } from '@/lib/schemas/projects';

function groupFeaturedSlugsByOrder(projects: readonly Project[]): Map<number, string[]> {
  const slugsByOrder = new Map<number, string[]>();
  for (const project of projects) {
    if (!project.featured) {
      continue;
    }
    if (project.order === undefined) {
      continue;
    }
    const list = slugsByOrder.get(project.order) ?? [];
    list.push(project.slug);
    slugsByOrder.set(project.order, list);
  }
  return slugsByOrder;
}

function describeOrderConflicts(slugsByOrder: ReadonlyMap<number, string[]>): string[] {
  const conflicts: string[] = [];
  for (const [order, slugs] of slugsByOrder) {
    if (slugs.length > 1) {
      conflicts.push(`order=${order.toString()} shared by [${slugs.join(', ')}]`);
    }
  }
  return conflicts;
}

export function validateProjects(projects: readonly Project[]): void {
  const slugsByOrder = groupFeaturedSlugsByOrder(projects);
  const conflicts = describeOrderConflicts(slugsByOrder);

  if (conflicts.length > 0) {
    throw new Error(
      `validateProjects: duplicate featured order detected — ${conflicts.join('; ')}`,
    );
  }
}
