import type { Project } from '@/lib/schemas/projects';

/**
 * Validates the consistency of a `projects` collection at build time.
 *
 * Contract (relaxed in feature #37): the collection may be empty. The only
 * invariant enforced here is that no two featured entries share the same
 * `order`. Per-entry shape (featured ↔ order requirement, range 1..3) is
 * already enforced by `projectSchema`.
 *
 * Throws an Error listing every slug that participates in an order conflict
 * so the build log surfaces the source of the duplicate immediately.
 */
export function validateProjects(projects: readonly Project[]): void {
  const featured = projects.filter((project) => project.featured);
  const slugsByOrder = new Map<number, string[]>();
  for (const project of featured) {
    if (project.order === undefined) {
      // Schema-level invariant: featured entries always carry an order. If the
      // schema is bypassed for some reason, skip silently here so the schema
      // error surfaces at the right layer instead of being shadowed by ours.
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
