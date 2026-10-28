const STORAGE_KEY = 'gag_case_progress_v1';
const REQUIRED_SLUGS = [
  'purchase-record',
  'fridge-log',
  'family-line-log',
  'mother-statement',
  'father-statement',
  'brother-statement',
  'my-statement',
];

document.addEventListener('DOMContentLoaded', () => {
  const slug = resolveSlug(location.pathname);
  const progress = readProgress();

  if (REQUIRED_SLUGS.includes(slug)) {
    progress[slug] = true;
    writeProgress(progress);
  }

  const suspectAction = document.getElementById('suspectAction');
  if (!suspectAction) return;

  const unlocked = REQUIRED_SLUGS.every((requiredSlug) => progress[requiredSlug]);
  suspectAction.hidden = !unlocked;
});

function resolveSlug(pathname) {
  const file = String(pathname || '')
    .split('/')
    .pop()
    .replace(/\.html?$/i, '')
    .trim();

  return file || 'index';
}

function readProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_error) {
    return {};
  }
}

function writeProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (_error) {
    // Ignore storage write failures.
  }
}
