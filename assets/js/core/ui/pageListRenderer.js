// assets/js/core/ui/pageListRenderer.js
// ページ一覧の共通描画ロジック
// モーダル表示と別ページ表示で共有する

import { u } from '../basePath.js';

/**
 * ページ一覧をコンテナに描画する
 *
 * @param {HTMLElement} container 描画先コンテナ
 * @param {object} progress visitTracker.getProgress() の戻り値
 * @param {object} [options]
 * @param {boolean} [options.showUnvisitedTitle=false] 未閲覧ページのタイトルを表示するか
 */
export function renderPageList(container, progress, options = {}) {
  const showUnvisitedTitle = options.showUnvisitedTitle || false;
  container.innerHTML = '';

  // ── ページリスト ──
  const list = document.createElement('ul');
  list.className = 'page-list__items';

  for (const page of progress.pages) {
    const item = document.createElement('li');
    item.className = 'page-list__item' + (page.visited ? ' is-visited' : '');

    // ページ番号
    const no = document.createElement('span');
    no.className = 'page-list__page-no';
    no.textContent = page.page_no != null
      ? `#${String(page.page_no).padStart(2, '0')}`
      : '-';

    // ステータスアイコン
    const icon = document.createElement('span');
    icon.className = 'page-list__status';
    icon.textContent = page.visited ? '✓' : '○';

    // タイトル
    const title = document.createElement('span');
    title.className = 'page-list__title';

    if (page.visited) {
      // 閲覧済み → リンク付きタイトル
      const link = document.createElement('a');
      link.className = 'page-list__link';
      link.href = resolvePath(page);
      link.textContent = page.title || page.slug;
      title.appendChild(link);
    } else if (showUnvisitedTitle) {
      // 未閲覧だがタイトル表示許可
      title.textContent = page.title || page.slug;
    } else {
      // 未閲覧 → タイトル非表示
      title.textContent = '???';
      title.classList.add('is-hidden');
    }

    item.append(no, icon, title);
    list.appendChild(item);
  }

  container.appendChild(list);
}

/**
 * ページのパスを解決する
 */
function resolvePath(page) {
  if (page.path) {
    const p = page.path.replace(/^\//, '');
    return u(p);
  }
  if (page.slug === 'index') return u('index.html');
  return u('contents/' + page.slug + '.html');
}
