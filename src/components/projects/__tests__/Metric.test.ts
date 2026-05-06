import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import Metric from '@/components/projects/Metric.astro';

async function renderMetric(value: string, labelEs: string, labelEn: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Metric, {
    props: { value, labelEs, labelEn },
  });
}

describe('Metric (render-test)', () => {
  it('renders the value text inside the .num element', async () => {
    const html = await renderMetric('42', 'pruebas', 'tests');
    expect(html).toContain('42');
  });

  it('renders the Spanish label inside <span lang="es">', async () => {
    const html = await renderMetric(
      '0',
      'firmas requeridas en auth',
      'signatures required for auth',
    );
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>firmas requeridas en auth<\/span>/);
  });

  it('renders the English label inside <span lang="en">', async () => {
    const html = await renderMetric(
      '0',
      'firmas requeridas en auth',
      'signatures required for auth',
    );
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>signatures required for auth<\/span>/);
  });

  it('places the value before the label in document order', async () => {
    const html = await renderMetric('VAL-MARKER', 'lab-marker-es', 'lab-marker-en');
    const valIdx = html.indexOf('VAL-MARKER');
    const labIdx = html.indexOf('lab-marker-es');
    expect(valIdx).toBeGreaterThan(-1);
    expect(labIdx).toBeGreaterThan(-1);
    expect(valIdx).toBeLessThan(labIdx);
  });

  it('renders a root container that has a class (CSS module hashed, not the literal "metric")', async () => {
    const html = await renderMetric('1', 'a', 'a');
    const rootMatch = html.match(/^\s*<div[^>]*class="([^"]+)"/);
    expect(rootMatch).not.toBeNull();
    const classValue = rootMatch?.[1] ?? '';
    expect(classValue.length).toBeGreaterThan(0);
    expect(classValue).not.toBe('metric');
  });

  it('preserves special characters in the value (e.g. "<1s", "~95%", "O(log n)")', async () => {
    const html = await renderMetric('<1s', 'latencia', 'latency');
    expect(html).toContain('&lt;1s');
  });
});
