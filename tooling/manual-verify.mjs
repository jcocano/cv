#!/usr/bin/env node
// Diagnóstico de verificación manual para feature #18.
// Recorre los 6 combos (3 themes × 2 langs) en todas las páginas y reporta:
//   - acceptance #11: errores y warnings de consola
//   - acceptance #6:  outline computado en cada elemento interactivo (focus visible)
//   - acceptance #8:  Lab pieces sin animation-name activo bajo prefers-reduced-motion
//   - acceptance #10: scrollspy actualiza .nav-link.active al scrollear bajo reduced motion
//   - acceptance #12: tab order (secuencia de focus al presionar Tab)
//
// Uso: node tooling/manual-verify.mjs
// Requiere preview server activo en 127.0.0.1:4322.

import { chromium } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4322/cv';

const THEMES = ['dark', 'light', 'paper'];
const LANGS = ['es', 'en'];

const PATHS = [
  { path: '', slug: 'home' },
  { path: 'projects/cluster-separation/', slug: 'project-cluster-separation' },
  { path: 'projects/incommers-nft/', slug: 'project-incommers-nft' },
  { path: 'projects/made-by-apes/', slug: 'project-made-by-apes' },
  { path: 'design-system/', slug: 'design-system' },
];

/**
 * Empareja `console` y `pageerror`. Devuelve arrays mutables
 * que el caller inspecciona después del navigation.
 */
function collectConsole(page) {
  const errors = [];
  const warnings = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    else if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return { errors, warnings };
}

async function setStorage(page, theme, lang) {
  await page.addInitScript(
    ({ theme, lang }) => {
      window.localStorage.setItem('theme', theme);
      window.localStorage.setItem('lang', lang);
    },
    { theme, lang },
  );
}

/**
 * Verifica acceptance #6: outline visible en todos los elementos interactivos.
 * Estrategia: para cada candidato (a, button), tab hasta él y mide:
 *   - getComputedStyle(focused).outlineStyle !== 'none' || ...
 *   - O al menos algún token visual cambia entre estado normal y focus.
 * Reporta el set de tagName+textSnippet sin outline detectado.
 */
async function auditFocusOutlines(page) {
  // Devuelve, por elemento focusable, si tiene un indicador visible al :focus-visible.
  return await page.evaluate(() => {
    const interactives = Array.from(
      document.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    const results = [];
    for (const el of interactives) {
      const before = getComputedStyle(el);
      const beforeOutline = before.outlineStyle;
      const beforeColor = before.color;
      const beforeBorder = before.borderColor;
      const beforeBg = before.backgroundColor;
      el.focus();
      const after = getComputedStyle(el);
      const hasOutline = after.outlineStyle !== 'none' && after.outlineStyle !== beforeOutline;
      const hasColorChange = after.color !== beforeColor;
      const hasBorderChange = after.borderColor !== beforeBorder;
      const hasBgChange = after.backgroundColor !== beforeBg;
      const visible = hasOutline || hasColorChange || hasBorderChange || hasBgChange;
      const text = (el.textContent ?? '').trim().slice(0, 40);
      const tag = el.tagName.toLowerCase();
      const id = el.id || '';
      results.push({
        tag,
        id,
        text,
        visible,
        outlineStyle: after.outlineStyle,
        outlineColor: after.outlineColor,
        outlineWidth: after.outlineWidth,
      });
      el.blur();
    }
    return results;
  });
}

/**
 * Acceptance #8: con prefers-reduced-motion, los Lab pieces no animan.
 * Verificación: que no haya animation-play-state running ni animation-name distinto de 'none'
 * en los selectores de las 3 piezas Lab.
 */
async function auditLabReducedMotion(page) {
  return await page.evaluate(() => {
    const labs = Array.from(document.querySelectorAll('[data-lab-piece]'));
    return labs.map((el) => {
      const cs = getComputedStyle(el);
      // animation-name = 'none' es lo que esperamos (y/o paused).
      return {
        slug: el.getAttribute('data-lab-piece') ?? 'unknown',
        animationName: cs.animationName,
        animationPlayState: cs.animationPlayState,
      };
    });
  });
}

/**
 * Acceptance #10: scrollspy actualiza .nav-link.active bajo reduced motion.
 * Estrategia: scrollea al centro de cada wrapper observado por el scrollspy
 * (#about, #work, #contact) y espera el IntersectionObserver tick.
 * 800ms cubre el ciclo completo del observer con `rootMargin: '-30% 0px -60% 0px'`.
 */
async function auditScrollspy(page) {
  const observed = [];
  for (const id of ['about', 'work', 'contact']) {
    await page.evaluate((targetId) => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top + r.height / 2 - 450);
    }, id);
    await page.waitForTimeout(800);
    const active = await page.evaluate(() => {
      const a = document.querySelector('.nav-link.active');
      return a ? a.getAttribute('href') : null;
    });
    observed.push({ section: id, activeNavHref: active });
  }
  return observed;
}

/**
 * Acceptance #12: tab order coherente. Recorre con Tab y registra la secuencia.
 */
async function auditTabOrder(page, maxTabs = 30) {
  const sequence = [];
  // Click body para asegurar foco neutro antes de empezar.
  await page.evaluate(() => {
    document.body.focus();
    if (document.activeElement) document.activeElement.blur();
  });
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      const text = (a.textContent ?? '').trim().slice(0, 40);
      const rect = a.getBoundingClientRect();
      return {
        tag: a.tagName.toLowerCase(),
        id: a.id || '',
        text,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
      };
    });
    if (info) sequence.push(info);
  }
  return sequence;
}

async function runCombo(browser, combo) {
  const { path, slug, theme, lang } = combo;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const { errors, warnings } = collectConsole(page);

  await setStorage(page, theme, lang);
  const url = `${BASE_URL}/${path}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const focusReport = await auditFocusOutlines(page);
  const labReport = slug === 'home' ? await auditLabReducedMotion(page) : [];
  const scrollspyReport = slug === 'home' ? await auditScrollspy(page) : [];
  const tabOrder = await auditTabOrder(page, 25);

  await context.close();

  return {
    combo: `${slug} · ${theme} · ${lang}`,
    consoleErrors: errors,
    consoleWarnings: warnings,
    focusReport,
    labReport,
    scrollspyReport,
    tabOrder,
  };
}

async function main() {
  const browser = await chromium.launch();
  const summary = [];

  for (const page of PATHS) {
    for (const theme of THEMES) {
      for (const lang of LANGS) {
        const result = await runCombo(browser, {
          path: page.path,
          slug: page.slug,
          theme,
          lang,
        });
        summary.push(result);
        const errCount = result.consoleErrors.length;
        const warnCount = result.consoleWarnings.length;
        const focusInvisible = result.focusReport.filter((r) => !r.visible);
        const labRunning = result.labReport.filter(
          (r) => r.animationName !== 'none' && r.animationPlayState !== 'paused',
        );
        console.log(
          `${result.combo} → console err:${errCount} warn:${warnCount} ` +
            `focus-invisible:${focusInvisible.length} lab-animating:${labRunning.length}`,
        );
        if (errCount > 0) {
          console.log('  errors:', result.consoleErrors);
        }
        if (warnCount > 0) {
          console.log('  warnings:', result.consoleWarnings);
        }
        if (focusInvisible.length > 0) {
          console.log(
            '  focus-invisible elements:',
            focusInvisible.map((f) => `${f.tag}#${f.id}[${f.text}]`),
          );
        }
        if (labRunning.length > 0) {
          console.log('  lab-still-animating:', labRunning);
        }
      }
    }
  }

  // Render compact JSON al final para copiar a current.md
  console.log('\n=== JSON SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
}

await main();
