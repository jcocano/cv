export function getStaticBuildLabel(buildDate: Date): string {
  const year = buildDate.getUTCFullYear().toString();
  const month = String(buildDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(buildDate.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
