import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SiteNav from '@/components/nav/SiteNav.astro';

async function renderSiteNav(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SiteNav);
}

describe('SiteNav (render-test)', () => {
  it('renders a single <nav> root element', async () => {
    const html = await renderSiteNav();
    const navMatches = html.match(/<nav\b/g);
    expect(navMatches).not.toBeNull();
    expect(navMatches).toHaveLength(1);
  });

  it('renders the brand anchor href="#top" with 4 child <span>s in order: dot, "jcocano", "/", "cv"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#top"[^>]*>\s*<span[^>]*><\/span>\s*<span[^>]*>jcocano<\/span>\s*<span[^>]*>\/<\/span>\s*<span[^>]*>cv<\/span>\s*<\/a>/,
    );
  });

  it('renders the brand "/" separator with inline style color: var(--fg-mute)', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(/<span[^>]*style="[^"]*color:\s*var\(--fg-mute\)[^"]*"[^>]*>\/<\/span>/);
  });

  it('renders the brand "cv" suffix with inline style color: var(--fg-dim)', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(/<span[^>]*style="[^"]*color:\s*var\(--fg-dim\)[^"]*"[^>]*>cv<\/span>/);
  });

  it('renders exactly 5 nav-link anchors with the expected hrefs in order', async () => {
    const html = await renderSiteNav();
    const navLinkMatches = Array.from(
      html.matchAll(/<a[^>]*class="[^"]*\bnav-link\b[^"]*"[^>]*>/g),
    );
    expect(navLinkMatches).toHaveLength(5);
    const hrefs = navLinkMatches.map((match) => {
      const hrefMatch = match[0].match(/href="([^"]+)"/);
      if (hrefMatch === null || hrefMatch[1] === undefined) {
        throw new Error('expected href on nav-link');
      }
      return hrefMatch[1];
    });
    expect(hrefs).toEqual(['#about', '#experience', '#stack', '#work', '#contact']);
  });

  it('renders the 5 numbered prefixes "01" through "05" inside <span class="num"> within nav-links', async () => {
    const html = await renderSiteNav();
    const expected = ['01', '02', '03', '04', '05'];
    for (const num of expected) {
      expect(html).toMatch(new RegExp(`<span[^>]*class="num"[^>]*>${num}</span>`));
    }
  });

  it('renders the bilingual labels for #about with exact texts "Acerca" / "About"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#about"[^>]*>[\s\S]*?<span[^>]*lang="es"[^>]*>Acerca<\/span>[\s\S]*?<span[^>]*lang="en"[^>]*>About<\/span>[\s\S]*?<\/a>/,
    );
  });

  it('renders the bilingual labels for #experience with exact texts "Experiencia" / "Experience"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#experience"[^>]*>[\s\S]*?<span[^>]*lang="es"[^>]*>Experiencia<\/span>[\s\S]*?<span[^>]*lang="en"[^>]*>Experience<\/span>[\s\S]*?<\/a>/,
    );
  });

  it('renders the bilingual labels for #stack with exact texts "Stack" / "Stack"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#stack"[^>]*>[\s\S]*?<span[^>]*lang="es"[^>]*>Stack<\/span>[\s\S]*?<span[^>]*lang="en"[^>]*>Stack<\/span>[\s\S]*?<\/a>/,
    );
  });

  it('renders the bilingual labels for #work with exact texts "Proyectos" / "Work"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#work"[^>]*>[\s\S]*?<span[^>]*lang="es"[^>]*>Proyectos<\/span>[\s\S]*?<span[^>]*lang="en"[^>]*>Work<\/span>[\s\S]*?<\/a>/,
    );
  });

  it('renders the bilingual labels for #contact with exact texts "Contacto" / "Contact"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#contact"[^>]*>[\s\S]*?<span[^>]*lang="es"[^>]*>Contacto<\/span>[\s\S]*?<span[^>]*lang="en"[^>]*>Contact<\/span>[\s\S]*?<\/a>/,
    );
  });

  it('renders the lang-btn pill with two <span class="opt"> children carrying data-l="es" and data-l="en"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<button[^>]*id="lang-toggle"[^>]*aria-label="Toggle language"[^>]*>[\s\S]*?<span[^>]*class="[^"]*\bopt\b[^"]*"[^>]*data-l="es"[^>]*>ES<\/span>[\s\S]*?<span[^>]*class="[^"]*\bopt\b[^"]*"[^>]*data-l="en"[^>]*>EN<\/span>[\s\S]*?<\/button>/,
    );
  });

  it('renders the theme icon-btn with aria-label, title, and the moon path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(/<button[^>]*id="theme-toggle"[^>]*aria-label="Toggle theme"[^>]*>/);
    expect(html).toMatch(
      /<button[^>]*id="theme-toggle"[^>]*title="Cycle theme \(dark \/ light \/ paper\)"[^>]*>/,
    );
    expect(html).toMatch(/<path[^>]*d="M21 12\.79A9 9 0 1 1 11\.21 3 7 7 0 0 0 21 12\.79z"[^>]*>/);
  });

  it('does NOT render any inline stylesheet block (CSS modules must be used; cf docs/conventions.md §3)', async () => {
    const html = await renderSiteNav();
    const styleTag = ['<', 'style'].join('');
    expect(html.toLowerCase().includes(styleTag)).toBe(false);
  });
});
