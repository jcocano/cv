// Client module — paints the SiteStatus skeleton with values from the
// `/cv/status.json` sidecar. See docs/learnings_dependencia_circular_site_status.md
// for the producer-vs-pipeline architecture this module implements.
//
// The component renders a bilingual skeleton at SSR time. This script:
//   1. Locates the skeleton (default: the <dl data-component="site-status">).
//   2. Resolves the endpoint URL respecting Astro's BASE_URL (so /cv/ deploys
//      keep working without hardcoding the prefix).
//   3. Fetches and validates the payload with `siteStatusSchema`.
//   4. Replaces every <dd data-status-key> with the formatted value or, on
//      failure, with a bilingual "Status unavailable" / "Estado no disponible"
//      message.
//   5. Updates `aria-busy` and `data-status-state` so screen readers and CSS
//      can react to the loaded/error state.

import enStrings from '@/i18n/en.json';
import esStrings from '@/i18n/es.json';
import { siteStatusSchema, type SiteStatus } from '@/lib/schemas/site-status';

const ROOT_SELECTOR = '[data-component="site-status"]';

const STATUS_KEYS = [
  'build_sha',
  'build_time',
  'schema_version',
  'page_weight_kb',
  'js_payload_kb',
  'css_payload_kb',
  'routes_count',
] as const satisfies ReadonlyArray<keyof SiteStatus>;

type StatusKey = (typeof STATUS_KEYS)[number];

const SHA_TRUNCATE_LENGTH = 7;

function resolveEndpointUrl(): string {
  // Astro's BASE_URL is `/cv/` in production and `/` during dev/tests. We
  // append `status.json` so the deployed endpoint resolves to `/cv/status.json`.
  const baseUrl = import.meta.env.BASE_URL;
  return `${baseUrl}status.json`;
}

function findRoot(explicit: HTMLElement | undefined): HTMLElement | null {
  if (explicit !== undefined) {
    return explicit;
  }
  return document.querySelector<HTMLElement>(ROOT_SELECTOR);
}

function isSiteStatusRoot(node: HTMLElement): boolean {
  return node.getAttribute('data-component') === 'site-status';
}

function clearChildren(node: Element): void {
  while (node.firstChild !== null) {
    node.removeChild(node.firstChild);
  }
}

function formatKbValue(kb: number): string {
  return `${kb.toString()} kB`;
}

function setStateLoaded(root: HTMLElement): void {
  root.setAttribute('aria-busy', 'false');
  root.setAttribute('data-status-state', 'loaded');
}

function setStateError(root: HTMLElement): void {
  root.setAttribute('aria-busy', 'false');
  root.setAttribute('data-status-state', 'error');
}

function paintTextValue(cell: HTMLElement, value: string): void {
  clearChildren(cell);
  cell.appendChild(document.createTextNode(value));
}

function paintTimeValue(cell: HTMLElement, isoDateTime: string): void {
  clearChildren(cell);
  const time = document.createElement('time');
  time.setAttribute('datetime', isoDateTime);
  time.textContent = isoDateTime;
  cell.appendChild(time);
}

function paintErrorIntoCell(cell: HTMLElement): void {
  clearChildren(cell);
  const es = document.createElement('span');
  es.setAttribute('lang', 'es');
  es.textContent = esStrings['designSystem.statusError'];
  const en = document.createElement('span');
  en.setAttribute('lang', 'en');
  en.textContent = enStrings['designSystem.statusError'];
  cell.appendChild(es);
  cell.appendChild(en);
}

function paintErrorState(root: HTMLElement): void {
  for (const key of STATUS_KEYS) {
    const cell = root.querySelector<HTMLElement>(`dd[data-status-key="${key}"]`);
    if (cell !== null) {
      paintErrorIntoCell(cell);
    }
  }
  setStateError(root);
}

function formatValueForKey(key: StatusKey, payload: SiteStatus): string {
  switch (key) {
    case 'build_sha':
      return payload.build_sha.slice(0, SHA_TRUNCATE_LENGTH);
    case 'build_time':
      // Painted via <time>, this branch is unused by paintLoadedState — kept
      // for completeness so the function totals every key.
      return payload.build_time;
    case 'schema_version':
      return payload.schema_version;
    case 'page_weight_kb':
      return formatKbValue(payload.page_weight_kb);
    case 'js_payload_kb':
      return formatKbValue(payload.js_payload_kb);
    case 'css_payload_kb':
      return formatKbValue(payload.css_payload_kb);
    case 'routes_count':
      return payload.routes_count.toString();
  }
}

function paintLoadedState(root: HTMLElement, payload: SiteStatus): void {
  for (const key of STATUS_KEYS) {
    const cell = root.querySelector<HTMLElement>(`dd[data-status-key="${key}"]`);
    if (cell === null) {
      continue;
    }
    if (key === 'build_time') {
      paintTimeValue(cell, payload.build_time);
      continue;
    }
    paintTextValue(cell, formatValueForKey(key, payload));
  }
  setStateLoaded(root);
}

async function fetchAndValidate(url: string): Promise<SiteStatus> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`site-status: endpoint returned status ${response.status.toString()}`);
  }
  const json: unknown = await response.json();
  return siteStatusSchema.parse(json);
}

export async function mountSiteStatus(root?: HTMLElement): Promise<void> {
  const target = findRoot(root);
  if (target === null) {
    return;
  }
  if (!isSiteStatusRoot(target)) {
    return;
  }
  try {
    const payload = await fetchAndValidate(resolveEndpointUrl());
    paintLoadedState(target, payload);
  } catch {
    paintErrorState(target);
  }
}

// Self-bootstrap when the module is imported by the component's <script>.
// In test environments (jsdom + vitest) the importer must call mountSiteStatus
// explicitly with the test-managed skeleton, so we only auto-mount when a
// skeleton already exists in the document at import time.
if (typeof document !== 'undefined') {
  const existing = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (existing !== null) {
    void mountSiteStatus(existing);
  }
}
