const TEMPLATE_DEFAULTS_KEY = 'vfx_template_defaults';

export function loadTemplateDefaults() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TEMPLATE_DEFAULTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveTemplateDefaults(templateDefaults) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(TEMPLATE_DEFAULTS_KEY, JSON.stringify(templateDefaults));
  } catch {
    // ignore storage failures
  }
}
