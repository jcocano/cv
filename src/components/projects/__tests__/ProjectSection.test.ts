import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ProjectSection from '@/components/projects/ProjectSection.astro';

async function renderProjectSection(
  labelEs: string,
  labelEn: string,
  slot: string,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectSection, {
    props: { labelEs, labelEn },
    slots: { default: slot },
  });
}

describe('ProjectSection (render-test)', () => {
  it('renders the root as a <section> element', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>body</p>');
    expect(html).toMatch(/<section\b/);
  });

  it('wraps the inner layout with a .container div', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>body</p>');
    expect(html).toMatch(/<section[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the Spanish label as "// contexto" inside <span lang="es">', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>body</p>');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>\/\/ contexto<\/span>/);
  });

  it('renders the English label as "// context" inside <span lang="en">', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>body</p>');
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>\/\/ context<\/span>/);
  });

  it('renders the slot content verbatim inside the right column', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>cuerpo del deep-dive</p>');
    expect(html).toContain('<p>cuerpo del deep-dive</p>');
  });

  it('places the label markup before the slot content in document order', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>marker-body</p>');
    const labelIdx = html.indexOf('// contexto');
    const bodyIdx = html.indexOf('marker-body');
    expect(labelIdx).toBeGreaterThan(-1);
    expect(bodyIdx).toBeGreaterThan(-1);
    expect(labelIdx).toBeLessThan(bodyIdx);
  });

  it('emits exactly one hashed module class on the <section> root (no .first variant, iter 5)', async () => {
    const html = await renderProjectSection('contexto', 'context', '<p>body</p>');
    const sectionMatch = html.match(/<section\s+class="([^"]+)"/);
    expect(sectionMatch).not.toBeNull();
    if (sectionMatch === null) {
      throw new Error('expected the <section> tag to have a class attribute');
    }
    const classValue = sectionMatch[1];
    if (classValue === undefined) {
      throw new Error('expected the class attribute to have a value');
    }
    const hashedClasses = classValue.split(/\s+/).filter((cls) => cls.startsWith('_'));
    expect(hashedClasses).toHaveLength(1);
  });

  it('ignores a legacy `first: true` prop and still emits exactly one hashed class (iter 5)', async () => {
    const container = await AstroContainer.create();
    const propsWithLegacy: Record<string, unknown> = {
      labelEs: 'contexto',
      labelEn: 'context',
      first: true,
    };
    const html = await container.renderToString(ProjectSection, {
      props: propsWithLegacy,
      slots: { default: '<p>body</p>' },
    });
    const sectionMatch = html.match(/<section\s+class="([^"]+)"/);
    expect(sectionMatch).not.toBeNull();
    if (sectionMatch === null) {
      throw new Error('expected the <section> tag to have a class attribute');
    }
    const classValue = sectionMatch[1];
    if (classValue === undefined) {
      throw new Error('expected the class attribute to have a value');
    }
    const hashedClasses = classValue.split(/\s+/).filter((cls) => cls.startsWith('_'));
    expect(hashedClasses).toHaveLength(1);
  });
});
