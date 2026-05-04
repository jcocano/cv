/**
 * Resolves the href for a SiteNav section link (e.g. `#about`).
 *
 * On home, the hash is returned unchanged so the browser performs in-page
 * navigation with smooth scroll. Off home, the hash is prefixed with the
 * site's baseUrl so clicking the link navigates back to home and lands on
 * the anchor.
 */
export function resolveSectionHref(hash: string, isHome: boolean, baseUrl: string): string {
  if (isHome) {
    return hash;
  }
  return `${ensureTrailingSlash(baseUrl)}${hash}`;
}

/**
 * Resolves the href for the SiteNav brand logo (the `jcocano` mark).
 *
 * On home it returns `#top` so clicking scrolls to the page top. Off home it
 * returns the bare baseUrl so clicking navigates to home (no hash, lands at
 * top by default).
 */
export function resolveBrandHref(isHome: boolean, baseUrl: string): string {
  if (isHome) {
    return '#top';
  }
  return ensureTrailingSlash(baseUrl);
}

function ensureTrailingSlash(value: string): string {
  if (value.endsWith('/')) {
    return value;
  }
  return `${value}/`;
}
