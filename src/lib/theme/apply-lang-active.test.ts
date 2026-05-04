// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { applyLangActive } from '@/lib/theme/apply-lang-active';

function makeLangPill(): { es: HTMLElement; en: HTMLElement } {
  const root = document.createElement('div');
  root.id = 'lang-toggle';
  const es = document.createElement('span');
  es.className = 'opt';
  es.setAttribute('data-l', 'es');
  es.textContent = 'ES';
  const en = document.createElement('span');
  en.className = 'opt';
  en.setAttribute('data-l', 'en');
  en.textContent = 'EN';
  root.appendChild(es);
  root.appendChild(en);
  document.body.appendChild(root);
  return { es, en };
}

describe('applyLangActive', () => {
  it('adds "active" only to the .opt[data-l="es"] when lang === "es"', () => {
    document.body.innerHTML = '';
    const { es, en } = makeLangPill();
    applyLangActive([es, en], 'es');
    expect(es.classList.contains('active')).toBe(true);
    expect(en.classList.contains('active')).toBe(false);
  });

  it('adds "active" only to the .opt[data-l="en"] when lang === "en"', () => {
    document.body.innerHTML = '';
    const { es, en } = makeLangPill();
    applyLangActive([es, en], 'en');
    expect(es.classList.contains('active')).toBe(false);
    expect(en.classList.contains('active')).toBe(true);
  });

  it('moves "active" from one option to the other on consecutive calls', () => {
    document.body.innerHTML = '';
    const { es, en } = makeLangPill();
    applyLangActive([es, en], 'es');
    expect(es.classList.contains('active')).toBe(true);
    expect(en.classList.contains('active')).toBe(false);

    applyLangActive([es, en], 'en');
    expect(es.classList.contains('active')).toBe(false);
    expect(en.classList.contains('active')).toBe(true);

    applyLangActive([es, en], 'es');
    expect(es.classList.contains('active')).toBe(true);
    expect(en.classList.contains('active')).toBe(false);
  });

  it('does not affect options with a non-matching data-l (e.g. extra unrelated .opt[data-l="xx"])', () => {
    document.body.innerHTML = '';
    const { es, en } = makeLangPill();
    const stray = document.createElement('span');
    stray.className = 'opt';
    stray.setAttribute('data-l', 'xx');
    stray.classList.add('active');
    document.body.appendChild(stray);

    applyLangActive([es, en, stray], 'es');
    expect(es.classList.contains('active')).toBe(true);
    expect(en.classList.contains('active')).toBe(false);
    expect(stray.classList.contains('active')).toBe(false);
  });

  it('accepts an empty iterable without throwing', () => {
    expect(() => {
      applyLangActive([], 'es');
    }).not.toThrow();
  });
});
