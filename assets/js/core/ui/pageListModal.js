// assets/js/core/ui/pageListModal.js
// ページカウンタークリック → ページ一覧ポップアップ直接表示

import { whenReady, getProgress } from '../visitTracker.js';
import { renderPageList } from './pageListRenderer.js';
import { u } from '../basePath.js';

/** CSS が未ロードなら動的に挿入 */
function ensureModalCss() {
  if (document.querySelector('link[href*="page-list-modal.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = u('assets/css/page-list-modal.css');
  document.head.appendChild(link);
}

/**
 * ページカウンターのクリックでページ一覧を開く。
 *
 * @param {object} [options]
 * @param {string} [options.mode='modal'] 'modal' | 'page'
 * @param {boolean} [options.showUnvisitedTitle=false]
 * @param {string} [options.pageHref=''] page モード時の遷移先 URL
 */
export function initPageListModal(options = {}) {
  ensureModalCss();
  const counter = document.getElementById('page-counter');
  if (!counter) return;

  const mode = options.mode || 'modal';
  counter.dataset.yachoPageListMode = mode;
  counter.dataset.yachoPageListHref = options.pageHref || '';
  if (counter.dataset.yachoPageListInitialized === 'true') return;
  counter.dataset.yachoPageListInitialized = 'true';

  // modal モードの場合のみポップアップを生成
  let popup = null;
  if (mode === 'modal') {
    popup = createPopup();
    document.body.appendChild(popup.root);
  }

  let popupOpen = false;

  // ── ページ一覧ポップアップ操作 ──

  const showPopup = async () => {
    if (!popup) return;
    await whenReady();
    const progress = getProgress();
    renderPageList(popup.body, progress, options);
    popup.root.classList.remove('hidden');
    popupOpen = true;
  };

  const hidePopup = () => {
    if (!popup) return;
    popup.root.classList.add('hidden');
    popup.body.innerHTML = '';
    popupOpen = false;
  };

  // ── イベント ──

  // ポップアップの閉じるボタン
  if (popup) {
    popup.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hidePopup();
    });
  }

  // カウンタークリック → 直接ポップアップ表示
  counter.addEventListener('click', (e) => {
    e.stopPropagation();
    // page モード: 別ページに遷移
    const currentMode = counter.dataset.yachoPageListMode || mode;
    const currentHref = counter.dataset.yachoPageListHref || options.pageHref || '';
    if (currentMode === 'page' && currentHref) {
      window.open(currentHref, '_blank', 'noopener');
      return;
    }
    // modal モード: トグル
    if (popupOpen) {
      hidePopup();
    } else {
      showPopup();
    }
  });

  // 外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (popupOpen) {
      const target = e.target;
      if (!counter.contains(target) && (!popup || !popup.root.contains(target))) {
        hidePopup();
      }
    }
  });

  // ESC キーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopup();
  });
}

// ── ポップアップ DOM 生成 ──

function createPopup() {
  const root = document.createElement('div');
  root.className = 'page-list-popup hidden';

  // ヘッダー
  const header = document.createElement('div');
  header.className = 'page-list-popup__header';

  const title = document.createElement('span');
  title.className = 'page-list-popup__title';
  title.textContent = 'ページ一覧';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'page-list-popup__close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', '閉じる');

  header.append(title, closeBtn);

  // ボディ
  const body = document.createElement('div');
  body.className = 'page-list-popup__body';

  root.append(header, body);

  return { root, closeBtn, body };
}
