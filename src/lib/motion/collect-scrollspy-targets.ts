export function collectScrollspyTargetsFromNavLinks(
  navLinks: Iterable<HTMLAnchorElement>,
): HTMLElement[] {
  const targets: HTMLElement[] = [];
  for (const link of navLinks) {
    const href = link.getAttribute('href');
    if (href === null || !href.startsWith('#')) {
      continue;
    }
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (target !== null) {
      targets.push(target);
    }
  }
  return targets;
}
