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

  it('renders the brand wrapper as a <div> (not an <a>) containing exactly 2 anchors', async () => {
    const html = await renderSiteNav();
    // Match the brand wrapper: a <div class="..._navBrand_..."> ... </div>
    const brandMatch = html.match(/<div\s+class="[^"]*_navBrand_[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    expect(brandMatch).not.toBeNull();
    if (brandMatch === null) return;
    const inner = brandMatch[1] ?? '';
    const anchorMatches = Array.from(inner.matchAll(/<a\b[^>]*>/g));
    expect(anchorMatches).toHaveLength(2);
  });

  it('renders the brand logo sub-link <a href="#top"> wrapping the dot and "jcocano" span (no "/" or "cv" inside)', async () => {
    const html = await renderSiteNav();
    expect(html).toMatch(
      /<a[^>]*href="#top"[^>]*>\s*<span[^>]*class="dot"[^>]*><\/span>\s*<span[^>]*>jcocano<\/span>\s*<\/a>/,
    );
  });

  it('renders the brand "/" separator span with inline style color: var(--fg-mute) outside any anchor', async () => {
    const html = await renderSiteNav();
    // Locate the brand wrapper and search the separator within it.
    const brandMatch = html.match(/<div\s+class="[^"]*_navBrand_[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    expect(brandMatch).not.toBeNull();
    if (brandMatch === null) return;
    const inner = brandMatch[1] ?? '';
    expect(inner).toMatch(/<span[^>]*style="[^"]*color:\s*var\(--fg-mute\)[^"]*"[^>]*>\/<\/span>/);
    // The separator must NOT be wrapped inside an <a>.
    // Strip everything inside <a>...</a> blocks and assert the separator is still present.
    const innerWithoutAnchors = inner.replace(/<a\b[\s\S]*?<\/a>/g, '');
    expect(innerWithoutAnchors).toMatch(
      /<span[^>]*style="[^"]*color:\s*var\(--fg-mute\)[^"]*"[^>]*>\/<\/span>/,
    );
  });

  it('renders the brand CV sub-link <a> with cv-pdf href, download, target="_blank", rel="noopener", aria-label, title, literal text "cv"', async () => {
    const html = await renderSiteNav();
    // The CV anchor: text content is the literal `cv`, contains all required attributes.
    const cvAnchorMatch = html.match(/<a\b([^>]*)>cv<\/a>/);
    expect(cvAnchorMatch).not.toBeNull();
    if (cvAnchorMatch === null) return;
    const attrs = cvAnchorMatch[1] ?? '';
    // href ends with jesus_cocano_cv.pdf
    const hrefMatch = attrs.match(/href="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    if (hrefMatch === null) return;
    expect(hrefMatch[1]).toMatch(/jesus_cocano_cv\.pdf$/);
    // target, rel, download, aria-label, title.
    expect(attrs).toMatch(/\btarget="_blank"/);
    expect(attrs).toMatch(/\brel="noopener"/);
    expect(attrs).toMatch(/\bdownload\b/);
    expect(attrs).toMatch(/\baria-label="Download CV"/);
    expect(attrs).toMatch(/\btitle="Download CV"/);
  });

  it('applies the navBrandCv CSS module class on the CV sub-link', async () => {
    const html = await renderSiteNav();
    const cvAnchorMatch = html.match(/<a\b([^>]*)>cv<\/a>/);
    expect(cvAnchorMatch).not.toBeNull();
    if (cvAnchorMatch === null) return;
    const attrs = cvAnchorMatch[1] ?? '';
    const classMatch = attrs.match(/class="([^"]+)"/);
    expect(classMatch).not.toBeNull();
    if (classMatch === null) return;
    expect(classMatch[1]).toMatch(/_navBrandCv_[a-z0-9]+(?:_\d+)?/);
  });

  it('applies the navBrandLogo CSS module class on the brand logo sub-link <a href="#top"> (so the inner anchor is a flex container and the .dot span renders with its 8x8 size)', async () => {
    const html = await renderSiteNav();
    // Match the brand logo anchor (the one wrapping the .dot + jcocano span).
    const logoAnchorMatch = html.match(
      /<a\b([^>]*)href="#top"[^>]*>\s*<span[^>]*class="dot"[^>]*><\/span>/,
    );
    expect(logoAnchorMatch).not.toBeNull();
    if (logoAnchorMatch === null) return;
    const attrs = logoAnchorMatch[1] ?? '';
    const classMatch = attrs.match(/class="([^"]+)"/);
    expect(classMatch).not.toBeNull();
    if (classMatch === null) return;
    expect(classMatch[1]).toMatch(/_navBrandLogo_[a-z0-9]+(?:_\d+)?/);
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

  it('renders three theme-icon wrappers inside #theme-toggle, one per theme (dark, light, paper)', async () => {
    const html = await renderSiteNav();
    const buttonMatch = html.match(/<button[^>]*id="theme-toggle"[\s\S]*?<\/button>/);
    expect(buttonMatch).not.toBeNull();
    if (buttonMatch === null) return;
    const buttonHtml = buttonMatch[0];
    const wrapperMatches = Array.from(buttonHtml.matchAll(/<span[^>]*data-theme-icon="([^"]+)"/g));
    expect(wrapperMatches).toHaveLength(3);
    const themes = wrapperMatches.map((m) => m[1]);
    expect(themes).toEqual(['dark', 'light', 'paper']);
  });

  it('renders the SunIcon (circle + 8 rays) inside the data-theme-icon="dark" wrapper', async () => {
    const html = await renderSiteNav();
    // Sun: <circle cx="12" cy="12" r="4"/> identifies it uniquely vs moon path / paper rect.
    const sunWrapper = html.match(/<span[^>]*data-theme-icon="dark"[^>]*>[\s\S]*?<\/span>/);
    expect(sunWrapper).not.toBeNull();
    if (sunWrapper === null) return;
    expect(sunWrapper[0]).toMatch(/<circle[^>]*cx="12"[^>]*cy="12"[^>]*r="4"[^>]*\/?>/);
    // At least one of the 8 ray paths (top: M12 2v2).
    expect(sunWrapper[0]).toMatch(/<path[^>]*d="M12 2v2"[^>]*\/?>/);
  });

  it('renders the PaperIcon (rect + horizontal lines) inside the data-theme-icon="light" wrapper', async () => {
    const html = await renderSiteNav();
    const paperWrapper = html.match(/<span[^>]*data-theme-icon="light"[^>]*>[\s\S]*?<\/span>/);
    expect(paperWrapper).not.toBeNull();
    if (paperWrapper === null) return;
    expect(paperWrapper[0]).toMatch(
      /<rect[^>]*x="6"[^>]*y="3"[^>]*width="12"[^>]*height="18"[^>]*rx="1"[^>]*\/?>/,
    );
    expect(paperWrapper[0]).toMatch(/<line[^>]*x1="9"[^>]*y1="8"[^>]*x2="15"[^>]*y2="8"[^>]*\/?>/);
  });

  it('renders the MoonIcon (handoff path) inside the data-theme-icon="paper" wrapper', async () => {
    const html = await renderSiteNav();
    const moonWrapper = html.match(/<span[^>]*data-theme-icon="paper"[^>]*>[\s\S]*?<\/span>/);
    expect(moonWrapper).not.toBeNull();
    if (moonWrapper === null) return;
    expect(moonWrapper[0]).toMatch(
      /<path[^>]*d="M21 12\.79A9 9 0 1 1 11\.21 3 7 7 0 0 0 21 12\.79z"[^>]*\/?>/,
    );
  });

  it('does NOT render any inline stylesheet block (CSS modules must be used; cf docs/conventions.md §3)', async () => {
    const html = await renderSiteNav();
    const styleTag = ['<', 'style'].join('');
    expect(html.toLowerCase().includes(styleTag)).toBe(false);
  });
});

describe('SiteNav (CSS module class application)', () => {
  // Vite emits CSS module locals with shape `_<camelCaseKey>_<hash>` (Vitest mock,
  // e.g. `_navBrand_82c115`) or `_<camelCaseKey>_<hash>_<index>` (production build,
  // e.g. `_navBrand_r76ka_16`). With `localsConvention: 'camelCaseOnly'` the
  // kebab-case keys are dropped, so the CSS module file MUST declare the classes
  // in camelCase and the component MUST consume them via dot notation; otherwise
  // the kebab key resolves to `undefined` (build) or to a kebab-cased token
  // (Vitest mock) and these assertions break.
  const HASHED = (name: string): RegExp => new RegExp(`_${name}_[a-z0-9]+(?:_\\d+)?`);

  it('applies the navInner CSS module class on the inner wrapper alongside the literal `container` class', async () => {
    const html = await renderSiteNav();
    const innerMatch = html.match(/<div\s+class="([^"]+)"[^>]*>\s*<div\s+class="[^"]*_navBrand_/);
    expect(innerMatch).not.toBeNull();
    if (innerMatch === null) return;
    const classAttr = innerMatch[1] ?? '';
    expect(classAttr).toMatch(HASHED('navInner'));
    expect(classAttr.split(/\s+/)).toContain('container');
  });

  it('applies the navBrand CSS module class on the brand <div> wrapper', async () => {
    const html = await renderSiteNav();
    const brandMatch = html.match(/<div\s+class="([^"]+)"[^>]*>\s*<a[^>]*href="#top"/);
    expect(brandMatch).not.toBeNull();
    if (brandMatch === null) return;
    expect(brandMatch[1]).toMatch(HASHED('navBrand'));
  });

  it('applies the navLinks CSS module class on the nav-links wrapper <div>', async () => {
    const html = await renderSiteNav();
    // nav-links wrapper: the <div> whose first child is the `<a class="nav-link" href="#about">`.
    const linksMatch = html.match(
      /<div\s+class="([^"]+)"[^>]*>\s*<a[^>]*class="nav-link"[^>]*href="#about"/,
    );
    expect(linksMatch).not.toBeNull();
    if (linksMatch === null) return;
    expect(linksMatch[1]).toMatch(HASHED('navLinks'));
  });

  it('applies the navTools CSS module class on the tools wrapper <div>', async () => {
    const html = await renderSiteNav();
    const toolsMatch = html.match(/<div\s+class="([^"]+)"[^>]*>\s*<button[^>]*id="lang-toggle"/);
    expect(toolsMatch).not.toBeNull();
    if (toolsMatch === null) return;
    expect(toolsMatch[1]).toMatch(HASHED('navTools'));
  });

  it('applies the langBtn CSS module class on the <button id="lang-toggle">', async () => {
    const html = await renderSiteNav();
    const langMatch = html.match(/<button[^>]*\sclass="([^"]+)"[^>]*id="lang-toggle"/);
    expect(langMatch).not.toBeNull();
    if (langMatch === null) return;
    expect(langMatch[1]).toMatch(HASHED('langBtn'));
  });

  it('applies the iconBtn CSS module class on the <button id="theme-toggle">', async () => {
    const html = await renderSiteNav();
    const themeMatch = html.match(/<button[^>]*\sclass="([^"]+)"[^>]*id="theme-toggle"/);
    expect(themeMatch).not.toBeNull();
    if (themeMatch === null) return;
    expect(themeMatch[1]).toMatch(HASHED('iconBtn'));
  });
});
