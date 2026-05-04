/**
 * Returns a human-readable label for an external url: strips the protocol
 * (`http://` / `https://`), an optional leading `www.`, and a trailing slash.
 *
 * Used by row components that render external links (e.g. `SideProjectRow`).
 */
export function readableHost(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}
