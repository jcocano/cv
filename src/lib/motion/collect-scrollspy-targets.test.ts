// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { collectScrollspyTargetsFromNavLinks } from '@/lib/motion/collect-scrollspy-targets';

function makeAnchor(href: string | null): HTMLAnchorElement {
  const a = document.createElement('a');
  if (href !== null) {
    a.setAttribute('href', href);
  }
  return a;
}

describe('collectScrollspyTargetsFromNavLinks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the in-document elements whose ids match each nav-link hash', () => {
    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    const workSection = document.createElement('section');
    workSection.id = 'work';
    document.body.appendChild(aboutSection);
    document.body.appendChild(workSection);

    const links = [makeAnchor('#about'), makeAnchor('#work')];

    const targets = collectScrollspyTargetsFromNavLinks(links);

    expect(targets).toHaveLength(2);
    expect(targets[0]).toBe(aboutSection);
    expect(targets[1]).toBe(workSection);
  });

  it('skips links with non-hash hrefs (absolute URLs, paths, mailto, etc.)', () => {
    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    document.body.appendChild(aboutSection);

    const links = [
      makeAnchor('/somewhere'),
      makeAnchor('https://example.com'),
      makeAnchor('mailto:test@example.com'),
      makeAnchor('#about'),
    ];

    const targets = collectScrollspyTargetsFromNavLinks(links);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toBe(aboutSection);
  });

  it('skips links without an href attribute', () => {
    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    document.body.appendChild(aboutSection);

    const links = [makeAnchor(null), makeAnchor('#about')];

    const targets = collectScrollspyTargetsFromNavLinks(links);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toBe(aboutSection);
  });

  it('skips hash hrefs that do not resolve to an element in the document', () => {
    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    document.body.appendChild(aboutSection);

    const links = [makeAnchor('#missing'), makeAnchor('#about'), makeAnchor('#also-missing')];

    const targets = collectScrollspyTargetsFromNavLinks(links);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toBe(aboutSection);
  });

  it('returns an empty array when no link resolves to a target', () => {
    const links = [makeAnchor('#missing'), makeAnchor('/path'), makeAnchor(null)];

    const targets = collectScrollspyTargetsFromNavLinks(links);

    expect(targets).toEqual([]);
  });

  it('preserves the order of the input links (document order from caller)', () => {
    const work = document.createElement('section');
    work.id = 'work';
    const about = document.createElement('div');
    about.id = 'about';
    const contact = document.createElement('section');
    contact.id = 'contact';
    document.body.appendChild(work);
    document.body.appendChild(about);
    document.body.appendChild(contact);

    const links = [makeAnchor('#contact'), makeAnchor('#about'), makeAnchor('#work')];

    const targets = collectScrollspyTargetsFromNavLinks(links);

    expect(targets).toHaveLength(3);
    expect(targets[0]).toBe(contact);
    expect(targets[1]).toBe(about);
    expect(targets[2]).toBe(work);
  });

  it('accepts a NodeListOf<HTMLAnchorElement> (real querySelectorAll output)', () => {
    document.body.innerHTML = `
      <nav>
        <a class="nav-link" href="#about">About</a>
        <a class="nav-link" href="#work">Work</a>
      </nav>
      <div id="about"></div>
      <section id="work"></section>
    `;
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a.nav-link');

    const targets = collectScrollspyTargetsFromNavLinks(navLinks);

    expect(targets).toHaveLength(2);
    expect(targets[0]?.id).toBe('about');
    expect(targets[1]?.id).toBe('work');
  });
});
