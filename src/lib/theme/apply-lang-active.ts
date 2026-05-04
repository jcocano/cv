import type { LangCode } from '@/lib/theme/toggle-lang';

const ACTIVE_CLASS = 'active';
const LANG_DATA_ATTR = 'data-l';

/**
 * Toggles the `.active` class across the lang-pill `.opt` children so the
 * one whose `data-l` attribute matches `lang` gains it and the others lose
 * it. Mirrors the bilingual lang toggle from the original design.
 */
export function applyLangActive(langOptions: Iterable<HTMLElement>, lang: LangCode): void {
  for (const option of langOptions) {
    if (option.getAttribute(LANG_DATA_ATTR) === lang) {
      option.classList.add(ACTIVE_CLASS);
    } else {
      option.classList.remove(ACTIVE_CLASS);
    }
  }
}
