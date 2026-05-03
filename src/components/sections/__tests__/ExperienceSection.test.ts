import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ExperienceSection from '@/components/sections/ExperienceSection.astro';
import experienceStyles from '@/components/sections/ExperienceSection.module.css';

async function renderExperience(lang: 'es' | 'en'): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ExperienceSection, { props: { lang } });
}

describe('ExperienceSection (render-test)', () => {
  it('renders the section root as <section id="experience">', async () => {
    const html = await renderExperience('es');
    expect(html).toMatch(/<section[^>]*id="experience"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderExperience('es');
    expect(html).toMatch(
      /<section[^>]*id="experience"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/,
    );
  });

  it('renders the SectionHead with eyebrow num "02" and bilingual labels', async () => {
    const html = await renderExperience('es');
    expect(html).toMatch(/<span[^>]*>02<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>experiencia<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>experience<\/span>/);
  });

  it('renders the bilingual h2 timeline title', async () => {
    const html = await renderExperience('es');
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Trayectoria[\s\S]*profesional\.[\s\S]*<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Career[\s\S]*timeline\.[\s\S]*<\/h2>/);
  });

  it('renders exactly five <article> entries (one per role)', async () => {
    const html = await renderExperience('es');
    const articleMatches = html.match(/<article\b/g);
    expect(articleMatches).not.toBeNull();
    if (articleMatches === null) {
      throw new Error('expected five <article> elements');
    }
    expect(articleMatches).toHaveLength(5);
  });

  it('renders the same number of </article> closing tags as opening tags', async () => {
    const html = await renderExperience('es');
    const opens = html.match(/<article\b/g)?.length ?? 0;
    const closes = html.match(/<\/article>/g)?.length ?? 0;
    expect(opens).toBe(5);
    expect(closes).toBe(5);
  });

  it('orders the entries with Yuga Labs first and Early career last (sortByDateDesc)', async () => {
    const html = await renderExperience('es');
    const yugaIndex = html.indexOf('Yuga Labs');
    const tokenproofIndex = html.indexOf('tokenproof');
    const metaoneIndex = html.indexOf('METAONE');
    const savareIndex = html.indexOf('Savare Medika');
    // The "early career" row uses bilingual <span lang="…">Varios/Various</span>
    // for the company; locate it by its unique displayDate "2006 → 2013".
    const earlyIndex = html.indexOf('2006 → 2013');
    expect(yugaIndex).toBeGreaterThan(-1);
    expect(tokenproofIndex).toBeGreaterThan(-1);
    expect(metaoneIndex).toBeGreaterThan(-1);
    expect(savareIndex).toBeGreaterThan(-1);
    expect(earlyIndex).toBeGreaterThan(-1);
    expect(yugaIndex).toBeLessThan(tokenproofIndex);
    expect(tokenproofIndex).toBeLessThan(metaoneIndex);
    expect(metaoneIndex).toBeLessThan(savareIndex);
    expect(savareIndex).toBeLessThan(earlyIndex);
  });

  it('renders the displayDate verbatim for entries that declare it', async () => {
    const html = await renderExperience('es');
    expect(html).toContain('Dic 2024 → Feb 2026');
    expect(html).toContain('Dec 2024 → Feb 2026');
    expect(html).toContain('2022 → Dic 2024');
    expect(html).toContain('2022 → Dec 2024');
    expect(html).toContain('Mar 2022 → Sep 2022');
    expect(html).toContain('Mar 2018 → Mar 2022');
    expect(html).toContain('2006 → 2013');
  });

  it('renders the bilingual location text inside Yuga Labs', async () => {
    const html = await renderExperience('es');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Remoto<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Remote<\/span>/);
  });

  it('renders the location for METAONE in both languages (Híbrido / Hybrid · GLD Mex)', async () => {
    const html = await renderExperience('es');
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Híbrido · GLD Mex<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Hybrid · GLD Mex<\/span>/);
  });

  it('renders one h3 with the role per article (5 total)', async () => {
    const html = await renderExperience('es');
    const h3Matches = html.match(/<h3\b/g);
    expect(h3Matches).not.toBeNull();
    if (h3Matches === null) {
      throw new Error('expected five <h3> role headings');
    }
    expect(h3Matches).toHaveLength(5);
  });

  it('renders bilingual description text for every role', async () => {
    const html = await renderExperience('es');
    expect(html).toContain('Diseño y evolución de servicios backend distribuidos');
    expect(html).toContain('Designed and evolved distributed backend services');
    expect(html).toContain('Sistemas de autenticación distribuidos');
    expect(html).toContain('Distributed authentication systems');
    expect(html).toContain('Liderazgo técnico en productos Web3');
    expect(html).toContain('Technical leadership of early-stage Web3');
    expect(html).toContain('Backend enterprise en Java y C#');
    expect(html).toContain('Enterprise backend in Java and C#');
    expect(html).toContain('Servidores enterprise, redes, firewalls');
    expect(html).toContain('Enterprise servers, networking, firewalls');
  });

  it('renders the tags as <span> pills containing every tag declared in frontmatter', async () => {
    const html = await renderExperience('es');
    // Yuga Labs
    expect(html).toMatch(/<span[^>]*>TypeScript<\/span>/);
    expect(html).toMatch(/<span[^>]*>NestJS<\/span>/);
    expect(html).toMatch(/<span[^>]*>Kubernetes<\/span>/);
    expect(html).toMatch(/<span[^>]*>AWS<\/span>/);
    expect(html).toMatch(/<span[^>]*>GCP<\/span>/);
    expect(html).toMatch(/<span[^>]*>Web3<\/span>/);
    // tokenproof
    expect(html).toMatch(/<span[^>]*>Pulsar<\/span>/);
    expect(html).toMatch(/<span[^>]*>Pub\/Sub<\/span>/);
    expect(html).toMatch(/<span[^>]*>Terraform<\/span>/);
    expect(html).toMatch(/<span[^>]*>EKS<\/span>/);
    expect(html).toMatch(/<span[^>]*>CI\/CD<\/span>/);
    // METAONE
    expect(html).toMatch(/<span[^>]*>Solidity<\/span>/);
    expect(html).toMatch(/<span[^>]*>Ethers\.js<\/span>/);
    expect(html).toMatch(/<span[^>]*>Next\.js<\/span>/);
    expect(html).toMatch(/<span[^>]*>DeFi<\/span>/);
    expect(html).toMatch(/<span[^>]*>NFT<\/span>/);
    // Savare Medika
    expect(html).toMatch(/<span[^>]*>Java<\/span>/);
    expect(html).toMatch(/<span[^>]*>C#<\/span>/);
    expect(html).toMatch(/<span[^>]*>\.NET Core<\/span>/);
    expect(html).toMatch(/<span[^>]*>Kafka<\/span>/);
    expect(html).toMatch(/<span[^>]*>Salesforce<\/span>/);
    // Early career
    expect(html).toMatch(/<span[^>]*>Linux<\/span>/);
    expect(html).toMatch(/<span[^>]*>Networking<\/span>/);
    expect(html).toMatch(/<span[^>]*>Firewalls<\/span>/);
    expect(html).toMatch(/<span[^>]*>Hosting<\/span>/);
  });

  it('renders the company text for each non-bilingual company', async () => {
    const html = await renderExperience('es');
    expect(html).toContain('Yuga Labs');
    expect(html).toContain('tokenproof');
    expect(html).toContain('METAONE');
    expect(html).toContain('Savare Medika');
  });

  it('renders the company "Various" for the Early career row', async () => {
    const html = await renderExperience('es');
    expect(html).toContain('Various');
  });

  it('renders identical HTML regardless of the lang prop (content is fully bilingual)', async () => {
    const htmlEs = await renderExperience('es');
    const htmlEn = await renderExperience('en');
    expect(htmlEs).toBe(htmlEn);
  });

  it('adds the global "reveal" class on every <article class=exp> (5 articles, handoff L314/L332/L350/L368/L386)', async () => {
    const html = await renderExperience('es');
    const expClassName = experienceStyles.exp;
    if (expClassName === undefined) {
      throw new Error('experienceStyles.exp must be defined');
    }
    const articleMatches = html.match(/<article\b[^>]*>/g) ?? [];
    expect(articleMatches).toHaveLength(5);
    const articlesWithReveal = articleMatches.filter(
      (tag) => tag.includes(expClassName) && /\breveal\b/.test(tag),
    );
    expect(articlesWithReveal).toHaveLength(5);
  });
});
