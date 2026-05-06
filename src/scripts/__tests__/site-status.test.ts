// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import statusFixture from '@/fixtures/status-fixture.json';
import type { SiteStatus } from '@/lib/schemas/site-status';

import { mountSiteStatus } from '@/scripts/site-status';

const STATUS_KEYS = [
  'build_sha',
  'build_time',
  'schema_version',
  'page_weight_kb',
  'js_payload_kb',
  'css_payload_kb',
  'routes_count',
] as const;

function makeSkeleton(): HTMLDivElement {
  document.body.innerHTML = '';
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-busy', 'true');
  region.setAttribute('data-component', 'site-status');
  region.setAttribute('data-status-state', 'loading');
  const dl = document.createElement('dl');
  for (const key of STATUS_KEYS) {
    const dt = document.createElement('dt');
    dt.id = `status-row-${key.replace(/_/g, '-')}`;
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.setAttribute('data-status-key', key);
    const loadingEs = document.createElement('span');
    loadingEs.setAttribute('lang', 'es');
    loadingEs.textContent = 'Cargando estado…';
    const loadingEn = document.createElement('span');
    loadingEn.setAttribute('lang', 'en');
    loadingEn.textContent = 'Loading status…';
    dd.appendChild(loadingEs);
    dd.appendChild(loadingEn);
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
  region.appendChild(dl);
  document.body.appendChild(region);
  return region;
}

function getCellText(root: HTMLElement, key: (typeof STATUS_KEYS)[number]): string {
  const cell = root.querySelector<HTMLElement>(`dd[data-status-key="${key}"]`);
  if (cell === null) {
    throw new Error(`expected <dd data-status-key="${key}"> to exist`);
  }
  return cell.textContent ?? '';
}

interface FetchMock {
  readonly fn: ReturnType<typeof vi.fn>;
  restore: () => void;
}

function installFetchMock(impl: typeof fetch): FetchMock {
  const fn = vi.fn(impl);
  const previous = globalThis.fetch;
  globalThis.fetch = fn as unknown as typeof fetch;
  return {
    fn,
    restore: () => {
      globalThis.fetch = previous;
    },
  };
}

describe('mountSiteStatus — success path', () => {
  let mock: FetchMock | null = null;

  afterEach(() => {
    mock?.restore();
    mock = null;
  });

  it('fetches the status endpoint and replaces every <dd> with the formatted value', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response(JSON.stringify(statusFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    const fixture: SiteStatus = statusFixture;
    expect(getCellText(root, 'build_sha')).toContain(fixture.build_sha.slice(0, 7));
    expect(getCellText(root, 'build_time')).toContain(fixture.build_time);
    expect(getCellText(root, 'schema_version')).toContain(fixture.schema_version);
    expect(getCellText(root, 'page_weight_kb')).toContain(`${fixture.page_weight_kb.toString()}`);
    expect(getCellText(root, 'page_weight_kb')).toContain('kB');
    expect(getCellText(root, 'js_payload_kb')).toContain(`${fixture.js_payload_kb.toString()}`);
    expect(getCellText(root, 'js_payload_kb')).toContain('kB');
    expect(getCellText(root, 'css_payload_kb')).toContain(`${fixture.css_payload_kb.toString()}`);
    expect(getCellText(root, 'css_payload_kb')).toContain('kB');
    expect(getCellText(root, 'routes_count')).toContain(fixture.routes_count.toString());
  });

  it('flips aria-busy to "false" and data-status-state to "loaded" after success', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response(JSON.stringify(statusFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    expect(root.getAttribute('aria-busy')).toBe('false');
    expect(root.getAttribute('data-status-state')).toBe('loaded');
  });

  it('removes the bilingual loading copy from every cell once values are painted', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response(JSON.stringify(statusFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    expect(root.textContent ?? '').not.toContain('Loading status…');
    expect(root.textContent ?? '').not.toContain('Cargando estado…');
  });

  it('renders the build_time inside a <time datetime> element for screen readers', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response(JSON.stringify(statusFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    const timeNode = root.querySelector<HTMLTimeElement>('dd[data-status-key="build_time"] time');
    expect(timeNode).not.toBeNull();
    if (timeNode === null) {
      throw new Error('expected <time> inside the deployed cell');
    }
    expect(timeNode.getAttribute('datetime')).toBe(statusFixture.build_time);
  });

  it('resolves the endpoint URL with the BASE_URL prefix (so /cv/ deploys keep working)', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response(JSON.stringify(statusFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    expect(mock.fn).toHaveBeenCalledTimes(1);
    const callArg = mock.fn.mock.calls[0]?.[0];
    expect(typeof callArg).toBe('string');
    if (typeof callArg !== 'string') {
      throw new Error('expected fetch to be called with a string URL');
    }
    expect(callArg).toMatch(/status\.json$/);
  });
});

describe('mountSiteStatus — error paths', () => {
  let mock: FetchMock | null = null;

  afterEach(() => {
    mock?.restore();
    mock = null;
  });

  it('paints "Status unavailable" / "Estado no disponible" when fetch rejects', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      throw new Error('network down');
    });

    await mountSiteStatus(root);

    for (const key of STATUS_KEYS) {
      expect(getCellText(root, key)).toContain('Status unavailable');
      expect(getCellText(root, key)).toContain('Estado no disponible');
    }
    expect(root.getAttribute('aria-busy')).toBe('false');
    expect(root.getAttribute('data-status-state')).toBe('error');
  });

  it('paints the error copy when the response is not OK', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response('not found', { status: 404 });
    });

    await mountSiteStatus(root);

    for (const key of STATUS_KEYS) {
      expect(getCellText(root, key)).toContain('Status unavailable');
      expect(getCellText(root, key)).toContain('Estado no disponible');
    }
    expect(root.getAttribute('aria-busy')).toBe('false');
    expect(root.getAttribute('data-status-state')).toBe('error');
  });

  it('paints the error copy when the JSON body fails schema validation (extra field, strict mode)', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      const bad = { ...statusFixture, surprise_extra_field: 'should not pass strict' };
      return new Response(JSON.stringify(bad), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    for (const key of STATUS_KEYS) {
      expect(getCellText(root, key)).toContain('Status unavailable');
    }
    expect(root.getAttribute('aria-busy')).toBe('false');
    expect(root.getAttribute('data-status-state')).toBe('error');
  });

  it('paints the error copy when the JSON body has an invalid sha (regex mismatch)', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      const bad = { ...statusFixture, build_sha: 'NOT-A-SHA' };
      return new Response(JSON.stringify(bad), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    for (const key of STATUS_KEYS) {
      expect(getCellText(root, key)).toContain('Status unavailable');
    }
    expect(root.getAttribute('data-status-state')).toBe('error');
  });

  it('paints the error copy when the response body is not valid JSON', async () => {
    const root = makeSkeleton();
    mock = installFetchMock(async () => {
      return new Response('this is not json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    await mountSiteStatus(root);

    for (const key of STATUS_KEYS) {
      expect(getCellText(root, key)).toContain('Status unavailable');
    }
    expect(root.getAttribute('data-status-state')).toBe('error');
  });
});

describe('mountSiteStatus — defensive guards', () => {
  it('is a no-op (does not call fetch) when the root has no data-component="site-status"', async () => {
    document.body.innerHTML = '<div></div>';
    const stranger = document.body.firstElementChild;
    if (!(stranger instanceof HTMLElement)) {
      throw new Error('expected an HTMLElement root');
    }
    const fn = vi.fn();
    const previous = globalThis.fetch;
    globalThis.fetch = fn as unknown as typeof fetch;
    try {
      await mountSiteStatus(stranger);
      expect(fn).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = previous;
    }
  });

  it('falls back to document lookup when called with no argument and a skeleton exists', async () => {
    const root = makeSkeleton();
    const previous = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify(statusFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    try {
      await mountSiteStatus();
      expect(root.getAttribute('aria-busy')).toBe('false');
    } finally {
      globalThis.fetch = previous;
    }
  });
});

beforeEach(() => {
  document.body.innerHTML = '';
});
