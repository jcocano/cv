export function getStaticBuildLabel(buildDate: Date): string {
  const year = buildDate.getUTCFullYear().toString();
  const month = String(buildDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(buildDate.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Resolves the Date the build label should render against, following the same
// hermetic-override pattern used by `scripts/generate-status.mjs` for the
// status.json producer: tests and CI can pin a deterministic value via the
// `GENERATE_STATUS_BUILD_TIME` env var (an ISO-8601 string) so that visual
// baselines stay stable across days. Production deploys leave the env var
// unset, falling back to `new Date()` so the label reflects the real build.
export function resolveBuildDate(): Date {
  const override = process.env.GENERATE_STATUS_BUILD_TIME;
  if (override !== undefined && override !== '') {
    return new Date(override);
  }
  return new Date();
}
