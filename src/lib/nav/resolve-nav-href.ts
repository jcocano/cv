export function resolveSectionHref(hash: string, isHome: boolean, baseUrl: string): string {
  if (isHome) {
    return hash;
  }
  return `${ensureTrailingSlash(baseUrl)}${hash}`;
}

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
