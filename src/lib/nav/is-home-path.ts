export function isHomePath(pathname: string, baseUrl: string): boolean {
  const baseNoSlash = stripTrailingSlash(baseUrl);
  const pathNoSlash = stripTrailingSlash(pathname);
  return pathNoSlash === baseNoSlash || pathNoSlash === appendIndexHtml(baseNoSlash);
}

export function appendIndexHtml(baseNoSlash: string): string {
  if (baseNoSlash === '') {
    return '/index.html';
  }
  return `${baseNoSlash}/index.html`;
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
