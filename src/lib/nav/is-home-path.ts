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
