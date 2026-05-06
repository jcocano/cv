import type { LangCode } from '@/lib/theme/toggle-lang';

const ACTIVE_CLASS = 'active';
const LANG_DATA_ATTR = 'data-l';

export function applyLangActive(langOptions: Iterable<HTMLElement>, lang: LangCode): void {
  for (const option of langOptions) {
    if (option.getAttribute(LANG_DATA_ATTR) === lang) {
      option.classList.add(ACTIVE_CLASS);
    } else {
      option.classList.remove(ACTIVE_CLASS);
    }
  }
}
