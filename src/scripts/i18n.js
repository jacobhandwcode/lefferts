/**
 * Lefferts i18n - Client-side translation engine
 * Supports: English (en), Spanish (es), Brazilian Portuguese (pt-br)
 */

import en from '../data/translations/en.json';
import es from '../data/translations/es.json';
import ptBr from '../data/translations/pt-br.json';

const translations = { en, es, 'pt-br': ptBr };
const STORAGE_KEY = 'lefferts-lang';
const DEFAULT_LANG = 'en';

function getSavedLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

function getTranslation(lang, key) {
  const keys = key.split('.');
  let value = translations[lang];
  for (const k of keys) {
    if (value == null) return null;
    value = value[k];
  }
  return value;
}

function applyTranslations(lang) {
  document.documentElement.lang = lang === 'pt-br' ? 'pt-BR' : lang;

  // Translate elements with data-i18n (text content)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = getTranslation(lang, key);
    if (value != null) {
      el.textContent = value;
    }
  });

  // Translate elements with data-i18n-html (innerHTML)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const value = getTranslation(lang, key);
    if (value != null) {
      el.innerHTML = value;
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = getTranslation(lang, key);
    if (value != null) {
      el.placeholder = value;
    }
  });

  // Update active state on language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    btn.classList.toggle('active', btnLang === lang);
  });

  // Update the current language indicator
  document.querySelectorAll('.lang-current').forEach(el => {
    const labelMap = { en: 'EN', es: 'ES', 'pt-br': 'PT' };
    el.textContent = labelMap[lang] || 'EN';
  });

  // Update CSS custom properties for pseudo-element translations (stats)
  const million = getTranslation(lang, 'stats.million');
  const billion = getTranslation(lang, 'stats.billion');
  if (million) document.documentElement.style.setProperty('--stat-million', `'${million}'`);
  if (billion) document.documentElement.style.setProperty('--stat-billion', `'${billion}'`);
}

function setLanguage(lang) {
  if (!translations[lang]) lang = DEFAULT_LANG;
  saveLang(lang);
  applyTranslations(lang);
}

function initI18n() {
  const lang = getSavedLang();
  applyTranslations(lang);

  // Attach event listeners to language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newLang = btn.getAttribute('data-lang');
      setLanguage(newLang);

      // Close dropdown if open
      const dropdown = document.querySelector('.lang-dropdown');
      if (dropdown) {
        dropdown.classList.remove('open');
      }
    });
  });

  // Toggle dropdown on click
  document.querySelectorAll('.lang-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = toggle.closest('.lang-switcher').querySelector('.lang-dropdown');
      if (dropdown) {
        dropdown.classList.toggle('open');
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-switcher')) {
      document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('open'));
    }
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

// Re-initialize after Astro view transitions
document.addEventListener('astro:after-swap', () => {
  setTimeout(initI18n, 50);
});

// Expose globally for other scripts
window.__i18n = { setLanguage, getSavedLang, getTranslation, translations };
