import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import ExperienceSection from '@/components/sections/ExperienceSection.astro';
import experienceStyles from '@/components/sections/ExperienceSection.module.css';
import sectionHeadStyles from '@/components/ui/SectionHead.module.css';

async function renderExperience(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ExperienceSection);
}

describe('ExperienceSection (render-test)', () => {
  it('renders the section root as <section id="experience">', async () => {
    const html = await renderExperience();
    expect(html).toMatch(/<section[^>]*id="experience"/);
  });

  it('wraps the inner content with a .container div', async () => {
    const html = await renderExperience();
    expect(html).toMatch(
      /<section[^>]*id="experience"[^>]*>\s*<div[^>]*class="[^"]*container[^"]*"/,
    );
  });

  it('renders the SectionHead with eyebrow num "02" and bilingual labels', async () => {
    const html = await renderExperience();
    expect(html).toMatch(/<span[^>]*>02<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>experiencia<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>experience<\/span>/);
  });

  it('renders the bilingual h2 timeline title', async () => {
    const html = await renderExperience();
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Trayectoria[\s\S]*profesional\.[\s\S]*<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>[\s\S]*Career[\s\S]*timeline\.[\s\S]*<\/h2>/);
  });

  it('renders exactly five <article> entries (one per role)', async () => {
    const html = await renderExperience();
    const articleMatches = html.match(/<article\b/g);
    expect(articleMatches).not.toBeNull();
    if (articleMatches === null) {
      throw new Error('expected five <article> elements');
    }
    expect(articleMatches).toHaveLength(5);
  });

  it('renders the same number of </article> closing tags as opening tags', async () => {
    const html = await renderExperience();
    const opens = html.match(/<article\b/g)?.length ?? 0;
    const closes = html.match(/<\/article>/g)?.length ?? 0;
    expect(opens).toBe(5);
    expect(closes).toBe(5);
  });

  it('orders the entries with Yuga Labs first and Early career last (sortByDateDesc)', async () => {
    const html = await renderExperience();
    const yugaIndex = html.indexOf('Yuga Labs');
    const tokenproofIndex = html.indexOf('tokenproof');
    const metaoneIndex = html.indexOf('METAONE');
    const savareIndex = html.indexOf('Savare Medika');
    const earlyIndex = html.indexOf('2006 → 2018');
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
    const html = await renderExperience();
    expect(html).toContain('Dic 2024 → Feb 2026');
    expect(html).toContain('Dec 2024 → Feb 2026');
    expect(html).toContain('2022 → Dic 2024');
    expect(html).toContain('2022 → Dec 2024');
    expect(html).toContain('Mar 2022 → Sep 2022');
    expect(html).toContain('Mar 2018 → Mar 2022');
    expect(html).toContain('2006 → 2018');
  });

  it('renders the bilingual location text inside Yuga Labs', async () => {
    const html = await renderExperience();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Remoto<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Remote<\/span>/);
  });

  it('renders the location for METAONE in both languages (Híbrido / Hybrid · GLD Mex)', async () => {
    const html = await renderExperience();
    expect(html).toMatch(/<span[^>]*lang="es"[^>]*>Híbrido · GLD Mex<\/span>/);
    expect(html).toMatch(/<span[^>]*lang="en"[^>]*>Hybrid · GLD Mex<\/span>/);
  });

  it('renders one h3 with the role per article (5 total)', async () => {
    const html = await renderExperience();
    const h3Matches = html.match(/<h3\b/g);
    expect(h3Matches).not.toBeNull();
    if (h3Matches === null) {
      throw new Error('expected five <h3> role headings');
    }
    expect(h3Matches).toHaveLength(5);
  });

  it('renders bilingual description text for every role', async () => {
    const html = await renderExperience();
    expect(html).toContain(
      'Servicios backend distribuidos para productos blockchain a gran escala',
    );
    expect(html).toContain('Distributed backend services for high-traffic blockchain products');
    expect(html).toContain('Sistemas de autenticación distribuidos con verificación on-chain');
    expect(html).toContain('Distributed authentication systems with on-chain verification');
    expect(html).toContain('Liderazgo técnico en productos Web3');
    expect(html).toContain('Technical leadership of early-stage Web3');
    expect(html).toContain(
      'Sincronización HA Salesforce ↔ CONTPAQi vía Apache Camel + API C# + proxy JS',
    );
    expect(html).toContain('HA Salesforce ↔ CONTPAQi sync via Apache Camel + C# API + JS proxy');
    expect(html).toContain('Sysadmin generalista en entornos enterprise');
    expect(html).toContain('Generalist sysadmin in enterprise environments');
  });

  it('renders the tags as <span> pills containing every tag declared in frontmatter', async () => {
    const html = await renderExperience();
    expect(html).toMatch(/<span[^>]*>TypeScript<\/span>/);
    expect(html).toMatch(/<span[^>]*>NestJS<\/span>/);
    expect(html).toMatch(/<span[^>]*>Kubernetes<\/span>/);
    expect(html).toMatch(/<span[^>]*>AWS<\/span>/);
    expect(html).toMatch(/<span[^>]*>GCP<\/span>/);
    expect(html).toMatch(/<span[^>]*>Web3<\/span>/);
    expect(html).toMatch(/<span[^>]*>Pulsar<\/span>/);
    expect(html).toMatch(/<span[^>]*>Pub\/Sub<\/span>/);
    expect(html).toMatch(/<span[^>]*>Terraform<\/span>/);
    expect(html).toMatch(/<span[^>]*>DevOps<\/span>/);
    expect(html).toMatch(/<span[^>]*>MongoDB<\/span>/);
    expect(html).toMatch(/<span[^>]*>SOQL<\/span>/);
    expect(html).toMatch(/<span[^>]*>Visualforce<\/span>/);
    expect(html).toMatch(/<span[^>]*>Solidity<\/span>/);
    expect(html).toMatch(/<span[^>]*>Ethers\.js<\/span>/);
    expect(html).toMatch(/<span[^>]*>Next\.js<\/span>/);
    expect(html).toMatch(/<span[^>]*>DeFi<\/span>/);
    expect(html).toMatch(/<span[^>]*>NFT<\/span>/);
    expect(html).toMatch(/<span[^>]*>Java<\/span>/);
    expect(html).toMatch(/<span[^>]*>C#<\/span>/);
    expect(html).toMatch(/<span[^>]*>AWS<\/span>/);
    expect(html).toMatch(/<span[^>]*>Apache Camel<\/span>/);
    expect(html).toMatch(/<span[^>]*>Kafka<\/span>/);
    expect(html).toMatch(/<span[^>]*>Linux\/Windows<\/span>/);
    expect(html).toMatch(/<span[^>]*>Networking<\/span>/);
    expect(html).toMatch(/<span[^>]*>Active Directory<\/span>/);
    expect(html).toMatch(/<span[^>]*>Firewalls<\/span>/);
    expect(html).toMatch(/<span[^>]*>Storage<\/span>/);
  });

  it('renders the company text for each non-bilingual company', async () => {
    const html = await renderExperience();
    expect(html).toContain('Yuga Labs');
    expect(html).toContain('tokenproof');
    expect(html).toContain('METAONE');
    expect(html).toContain('Savare Medika');
  });

  it('renders the company "Various" for the Early career row', async () => {
    const html = await renderExperience();
    expect(html).toContain('Various');
  });

  it('does NOT render a <p class=lede> in the SectionHead (Experience has no lede; feature #21)', async () => {
    const html = await renderExperience();
    const ledeClassName = sectionHeadStyles.lede;
    if (ledeClassName === undefined) {
      throw new Error('sectionHeadStyles.lede must be defined');
    }
    const escaped = ledeClassName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<p\\b[^>]*class="[^"]*\\b${escaped}\\b[^"]*"`);
    expect(html).not.toMatch(re);
  });

  it('adds the global "reveal" class on every <article class=exp> (5 articles, handoff L314/L332/L350/L368/L386)', async () => {
    const html = await renderExperience();
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
