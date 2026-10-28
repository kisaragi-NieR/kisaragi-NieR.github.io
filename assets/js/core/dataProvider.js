import { u } from './basePath.js';
import { fetchJson } from './fetcher.js';
import { log } from './logger.js';
import { normalizeInput, toFileKey, toFileName } from './searchNormalizer.js';

let modePromise = null;
let pagesPromise = null;
let metaPromise = null;

function sanitize(text) {
  return String(text || '')
    .trim()
    .replace(/[\x00-\x1F\x7F\u2028\u2029]/g, '')
    .replace(/\u3000/g, ' ');
}

function normalizePath(path) {
  const p = String(path || '').trim();
  if (!p) return u('index.html');
  if (/^(https?:)?\/\//i.test(p)) return p;
  if (p.startsWith('/')) return u(p.replace(/^\/+/, ''));
  return u(p.replace(/^\.\/+/, ''));
}

async function detectMode() {
  const hinted = String((window.YACHO_PROVIDER_MODE || '')).toLowerCase();
  if (hinted === 'api' || hinted === 'json') return hinted;

  try {
    const res = await fetch(u('api/meta.php'), { cache: 'no-store' });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) return 'api';
    }
  } catch { /* ignore */ }

  return 'json';
}

async function loadPages() {
  if (!pagesPromise) {
    pagesPromise = fetchJson('data/structure.json')
      .then((data) => (Array.isArray(data?.pages) ? data.pages : []))
      .then((pages) => pages.filter((p) => (p?.kind ?? 'page') !== 'include'))
      .catch(() => []);
  }
  return pagesPromise;
}

async function loadMeta() {
  if (!metaPromise) {
    metaPromise = fetchJson('data/meta.json').catch(() => null);
  }
  return metaPromise;
}

/**
 * 個別ファイルから検索結果を取得するヘルパー
 */
function parseResults(fileData, defaultTitle) {
  const seen = new Set();
  const results = [];

  if (Array.isArray(fileData?.results)) {
    for (const item of fileData.results) {
      const path = normalizePath(item?.path);
      if (seen.has(path)) continue;
      seen.add(path);
      results.push({ title: item?.title || defaultTitle, path });
    }
    return { results, hint: fileData.hint || null };
  }

  if (Array.isArray(fileData)) {
    for (const item of fileData) {
      const path = normalizePath(item?.path);
      if (seen.has(path)) continue;
      seen.add(path);
      results.push({ title: item?.title || defaultTitle, path });
    }
    return { results, hint: null };
  }

  return { results: [], hint: null };
}

function createApiProvider() {
  return {
    async meta() {
      try {
        const data = await fetchJson('api/meta.php');
        return { total: Number(data?.total ?? 0) || 0 };
      } catch {
        log('error', 'provider_api_meta_failed');
        return { total: 0 };
      }
    },

    async page(slug) {
      try {
        const s = encodeURIComponent(String(slug || 'index'));
        const data = await fetchJson(`api/page.php?slug=${s}`);
        return {
          page_no: Number(data?.page_no ?? 0) || null,
          total: Number(data?.total ?? 0) || 0,
        };
      } catch {
        log('error', 'provider_api_page_failed', { slug });
        return { page_no: null, total: 0 };
      }
    },

    async search(rawInput) {
      const input = sanitize(rawInput);
      if (!input) return { results: [], hint: null };

      try {
        const data = await fetchJson(`api/search.php?q=${encodeURIComponent(input)}`);
        return {
          results: Array.isArray(data?.results)
            ? data.results.map((item) => ({
                title: item?.title || input,
                path: normalizePath(item?.path),
              }))
            : [],
          hint: data?.hint || null,
        };
      } catch {
        log('error', 'provider_api_search_failed');
        return { results: [], hint: null };
      }
    },
  };
}

function createJsonProvider() {
  return {
    async meta() {
      const meta = await loadMeta();
      if (meta && Number.isFinite(Number(meta.total))) {
        return { total: Number(meta.total) };
      }
      const pages = await loadPages();
      return { total: pages.length };
    },

    async page(slug) {
      const pages = await loadPages();
      const targetSlug = String(slug || 'index').trim();
      const found = pages.find((p, i) => {
        const pSlug = String(p?.slug || p?.id || '').trim();
        if (pSlug === targetSlug) return true;
        if (targetSlug === 'index' && i === 0) return true;
        return false;
      });
      const meta = await this.meta();

      if (!found) {
        return { page_no: null, total: meta.total || pages.length };
      }

      const pageNo = Number.isFinite(Number(found.page_no))
        ? Number(found.page_no)
        : (pages.indexOf(found) + 1);

      return { page_no: pageNo, total: meta.total || pages.length };
    },

    async search(rawInput) {
      const input = sanitize(rawInput);
      if (!input) return { results: [], hint: null };

      // 共通正規化を適用（NFKC + 空白統一）
      const normalized = normalizeInput(input);
      if (!normalized) return { results: [], hint: null };

      // スペースを除去して1語検索（人名「田中 太郎」→「田中太郎」に対応）
      const fileKey = toFileKey(normalized);
      if (fileKey) {
        try {
          const fileData = await fetchJson('data/search/' + toFileName(fileKey) + '.json');
          if (fileData) {
            const result = parseResults(fileData, normalized);
            if (result.results.length > 0 || result.hint) return result;
          }
        } catch { /* ファイルがなければ分割検索へ */ }
      }

      // スペースで分割して2語検索
      const tokens = normalized.split(/\s+/).filter(Boolean);
      if (tokens.length <= 1) return { results: [], hint: null };

      // 2語検索
      if (tokens.length >= 2) {
        const k1 = toFileKey(tokens[0]);
        const k2 = toFileKey(tokens[1]);
        const sorted = [k1, k2].sort();
        const combined = sorted.join('');
        try {
          const fileData = await fetchJson('data/search/' + toFileName(combined) + '.json');
          if (fileData) {
            const result = parseResults(fileData, `${tokens[0]} ${tokens[1]}`);
            if (result.results.length > 0) return result;
          }
        } catch { /* ignore */ }

        let hasPartial = false;
        for (const token of [k1, k2]) {
          try {
            const fileData = await fetchJson('data/search/' + toFileName(token) + '.json');
            if (fileData) {
              const r = parseResults(fileData, token);
              if (r.results.length > 0 || r.hint) {
                hasPartial = true;
                break;
              }
            }
          } catch { /* ignore */ }
        }

        return { results: [], hint: hasPartial ? 'partial' : null };
      }

      return { results: [], hint: null };
    },
  };
}

export function createProvider() {
  const resolveMode = async () => {
    if (!modePromise) {
      modePromise = detectMode();
    }
    return modePromise;
  };

  return {
    async meta() {
      const mode = await resolveMode();
      return mode === 'api' ? createApiProvider().meta() : createJsonProvider().meta();
    },

    async page(slug) {
      const mode = await resolveMode();
      return mode === 'api' ? createApiProvider().page(slug) : createJsonProvider().page(slug);
    },

    async search(rawInput) {
      const mode = await resolveMode();
      return mode === 'api'
        ? createApiProvider().search(rawInput)
        : createJsonProvider().search(rawInput);
    },
  };
}
