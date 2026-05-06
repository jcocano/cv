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

function appendStatusJsonToBaseUrl(): string {
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
  es.textContent = esStrings['theSystem.statusError'];
  const en = document.createElement('span');
  en.setAttribute('lang', 'en');
  en.textContent = enStrings['theSystem.statusError'];
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
    const payload = await fetchAndValidate(appendStatusJsonToBaseUrl());
    paintLoadedState(target, payload);
  } catch {
    paintErrorState(target);
  }
}

if (typeof document !== 'undefined') {
  const existing = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (existing !== null) {
    void mountSiteStatus(existing);
  }
}
