import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ContactSection from '@/components/sections/ContactSection.astro';
import contactStyles from '@/components/sections/ContactSection.module.css';

async function renderContactSection(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ContactSection);
}

describe('ContactSection (render-test)', () => {
  it('renders the section root as <section id="contact">', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(/<section[^>]*id="contact"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(/<section[^>]*id="contact"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/);
  });

  it('renders the eyebrow with num="05" and bilingual labels (contacto / contact)', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(/<span[^>]*>05<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>contacto<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>contact<\/span>/);
  });

  it('renders the bilingual h2 with the Spanish leading accent (Construyamos) before the rest', async () => {
    const html = await renderContactSection();
    const headlineMatch = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/);
    expect(headlineMatch).not.toBeNull();
    if (headlineMatch === null) {
      throw new Error('expected an <h2> element with the headline');
    }
    const headlineHtml = headlineMatch[0];
    const accentIdx = headlineHtml.indexOf('Construyamos');
    const restIdx = headlineHtml.indexOf('algo serio.');
    expect(accentIdx).toBeGreaterThan(-1);
    expect(restIdx).toBeGreaterThan(-1);
    expect(accentIdx).toBeLessThan(restIdx);
  });

  it('renders the bilingual h2 with the English trailing accent (something serious.) after the rest', async () => {
    const html = await renderContactSection();
    const headlineMatch = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/);
    expect(headlineMatch).not.toBeNull();
    if (headlineMatch === null) {
      throw new Error('expected an <h2> element with the headline');
    }
    const headlineHtml = headlineMatch[0];
    const restIdx = headlineHtml.indexOf('Let&#39;s build');
    const accentIdx = headlineHtml.indexOf('something serious.');
    expect(restIdx).toBeGreaterThan(-1);
    expect(accentIdx).toBeGreaterThan(-1);
    expect(restIdx).toBeLessThan(accentIdx);
  });

  it('marks the accent fragment with a dedicated span class so CSS can italicize it', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(/<span[^>]*class="[^"]*accent[^"]*"[^>]*>Construyamos<\/span>/);
    expect(html).toMatch(/<span[^>]*class="[^"]*accent[^"]*"[^>]*>something serious\.<\/span>/);
  });

  it('renders the bilingual lede paragraph from hero.json contact.lede', async () => {
    const html = await renderContactSection();
    expect(html).toContain('Disponible para roles senior en backend, platform o infraestructura.');
    expect(html).toContain('Available for senior roles in backend, platform, or infrastructure.');
  });

  it('renders exactly three anchors in document order: email (mailto), github, linkedin', async () => {
    const html = await renderContactSection();
    const emailIdx = html.indexOf('mailto:jesus.cocano@gmail.com');
    const githubIdx = html.indexOf('https://github.com/jcocano');
    const linkedinIdx = html.indexOf('https://linkedin.com/in/jcocano');
    expect(emailIdx).toBeGreaterThan(-1);
    expect(githubIdx).toBeGreaterThan(-1);
    expect(linkedinIdx).toBeGreaterThan(-1);
    expect(emailIdx).toBeLessThan(githubIdx);
    expect(githubIdx).toBeLessThan(linkedinIdx);
    const anchorMatches = html.match(
      /<a[^>]*href="(mailto:[^"]+|https:\/\/(?:github|linkedin)[^"]+)"/g,
    );
    expect(anchorMatches).not.toBeNull();
    if (anchorMatches === null) {
      throw new Error('expected exactly three CTA anchors');
    }
    expect(anchorMatches).toHaveLength(3);
  });

  it('marks the email CTA with the ctaPrimary CSS-module class so it gets the primary look', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(
      /<a[^>]*class="[^"]*ctaPrimary[^"]*"[^>]*href="mailto:jesus\.cocano@gmail\.com"/,
    );
  });

  it('applies BOTH styles.cta and styles.ctaPrimary on the email CTA so the primary button inherits base layout (padding/border/font-mono/transition)', async () => {
    const html = await renderContactSection();
    const emailAnchorMatch = html.match(/<a[^>]*href="mailto:jesus\.cocano@gmail\.com"[^>]*>/);
    expect(emailAnchorMatch).not.toBeNull();
    if (emailAnchorMatch === null) {
      throw new Error('expected an email anchor');
    }
    const emailAnchor = emailAnchorMatch[0];
    const classAttrMatch = emailAnchor.match(/class="([^"]+)"/);
    expect(classAttrMatch).not.toBeNull();
    if (classAttrMatch === null || classAttrMatch[1] === undefined) {
      throw new Error('expected a class attribute on the email anchor');
    }
    const classTokens = classAttrMatch[1].split(/\s+/).filter((token) => token.length > 0);
    expect(classTokens).toContain(contactStyles.cta);
    expect(classTokens).toContain(contactStyles.ctaPrimary);
  });

  it('renders the email CTA with mailto: href and visible address text', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(/<a[^>]*href="mailto:jesus\.cocano@gmail\.com"/);
    expect(html).toContain('jesus.cocano@gmail.com');
  });

  it('renders github and linkedin CTAs with target="_blank" and rel="noopener noreferrer"', async () => {
    const html = await renderContactSection();
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/github\.com\/jcocano"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/linkedin\.com\/in\/jcocano"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
  });

  it('does NOT add target="_blank" to the email CTA (mailto: opens in the local mail client)', async () => {
    const html = await renderContactSection();
    const emailAnchorMatch = html.match(/<a[^>]*href="mailto:jesus\.cocano@gmail\.com"[^>]*>/);
    expect(emailAnchorMatch).not.toBeNull();
    if (emailAnchorMatch === null) {
      throw new Error('expected an email anchor');
    }
    expect(emailAnchorMatch[0]).not.toMatch(/target="_blank"/);
  });

  it('renders the github CTA with the visible label github.com/jcocano', async () => {
    const html = await renderContactSection();
    expect(html).toContain('github.com/jcocano');
  });

  it('renders the linkedin CTA with the visible label linkedin.com/in/jcocano', async () => {
    const html = await renderContactSection();
    expect(html).toContain('linkedin.com/in/jcocano');
  });

  it('renders an inline svg icon next to each CTA', async () => {
    const html = await renderContactSection();
    const svgMatches = html.match(/<svg[^>]*>/g);
    expect(svgMatches).not.toBeNull();
    if (svgMatches === null) {
      throw new Error('expected at least three svg icons (one per CTA)');
    }
    expect(svgMatches.length).toBeGreaterThanOrEqual(3);
  });

  it('uses the shared EmailIcon component (no inline svg with stroke-width="1.8") so SVGs live in src/components/ui/icons', async () => {
    const html = await renderContactSection();
    expect(html).not.toContain('stroke-width="1.8"');
    expect(html).toContain('stroke-width="1.6"');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('does NOT render a Download CV CTA (out of scope per decision D2)', async () => {
    const html = await renderContactSection();
    expect(html).not.toMatch(/href="[^"]*jesus_cocano_cv\.pdf/);
    expect(html).not.toMatch(/lang="es"[^>]*>Descargar CV/);
    expect(html).not.toMatch(/lang="en"[^>]*>Download CV/);
  });

  it('does NOT render a footer of its own (the footer is global, lives in BaseLayout)', async () => {
    const html = await renderContactSection();
    expect(html).not.toMatch(/<footer\b/);
  });
});
