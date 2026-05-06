import type { Project } from '@/lib/schemas/projects';

export function validateProjects(projects: readonly Project[]): void {
  const featured = projects.filter((project) => project.featured);
  const slugsByOrder = new Map<number, string[]>();
  for (const project of featured) {
    if (project.order === undefined) {
      continue;
    }
    const list = slugsByOrder.get(project.order) ?? [];
    list.push(project.slug);
    slugsByOrder.set(project.order, list);
  }

  const conflicts: string[] = [];
  for (const [order, slugs] of slugsByOrder) {
    if (slugs.length > 1) {
      conflicts.push(`order=${order.toString()} shared by [${slugs.join(', ')}]`);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `validateProjects: duplicate featured order detected — ${conflicts.join('; ')}`,
    );
  }
}
