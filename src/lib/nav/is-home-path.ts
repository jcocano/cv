/**
 * Returns true when `pathname` represents the site's home page under `baseUrl`.
 *
 * Astro's `import.meta.env.BASE_URL` is `"/cv/"` in production and `"/"` in
 * local preview without a base. `Astro.url.pathname` may or may not include a
 * trailing slash and may resolve to `"<base>index.html"` depending on context.
 * This helper normalizes both inputs by stripping trailing slashes and treating
 * `"<base>"` and `"<base>index.html"` as equivalent home representations.
 */
export function isHomePath(pathname: string, baseUrl: string): boolean {
  const baseNoSlash = stripTrailingSlash(baseUrl);
  const pathNoSlash = stripTrailingSlash(pathname);
  if (pathNoSlash === baseNoSlash) {
    return true;
  }
  const indexHtml = baseNoSlash === '' ? '/index.html' : `${baseNoSlash}/index.html`;
  if (pathNoSlash === indexHtml) {
    return true;
  }
  return false;
}

function stripTrailingSlash(value: string): string {
  if (value.length > 1 && value.endsWith('/')) {
    return value.slice(0, -1);
  }
  if (value === '/') {
    return '';
  }
  return value;
}
