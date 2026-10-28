document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('suspectTrigger');
  const modal = document.getElementById('suspectModal');
  const form = document.getElementById('suspectForm');

  if (!trigger || !modal || !form) return;

  const openModal = () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  };

  trigger.addEventListener('click', openModal);

  modal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeModal === 'true') {
      closeModal();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = new FormData(form).get('suspect');
    const resultWindow = window.open('', '_blank');

    if (!value) {
      renderResultPage(resultWindow, {
        title: '判定不可',
        heading: '選択が確認できませんでした',
        body: '<p><strong>未選択:</strong> 母・父・兄・私のいずれかを選択してください。</p>',
      });
      return;
    }

    if (value === 'father') {
      renderResultPage(resultWindow, {
        title: '判定結果: 正解',
        heading: '正解: 父',
        body: '<p>02:13の台所方面での物音、父自身による深夜移動の可能性の言及、ならびに小さいスプーンの残置状況を総合すると、父が寝ぼけた状態で対象プリンを摂食した可能性が最も高い。</p><p>最終調査報告にて報告する</p>',
      });
      closeModal();
      return;
    }

    const wrongLabelMap = {
      mother: '母',
      brother: '兄',
      daughter: '私',
    };
    const wrongLabel = wrongLabelMap[value] || '該当者';
    renderResultPage(resultWindow, {
      title: '判定結果: 再検討',
      heading: '再検討: ' + wrongLabel,
      body: '<p>' + wrongLabel + ' を示す直接的根拠は不十分です。</p><p>深夜帯の台所接近記録と食器の所在、そして当人の発言の曖昧さを中心に再確認してください。</p>',
    });
    closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
});

function renderResultPage(resultWindow, { title, heading, body }) {
  if (!resultWindow) return;

  resultWindow.document.open();
  resultWindow.document.write(`<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="assets/css/style.css">
  <style>
    body { padding: 1rem; }
    .result-wrap { max-width: 760px; margin: 3rem auto; }
  </style>
</head>
<body>
  <div class="result-wrap">
    <article class="article">
      <header class="article-header">
        <h1 class="article-title">${escapeHtml(heading)}</h1>
      </header>
      <div class="article-body">${body}</div>
    </article>
  </div>
</body>
</html>`);
  resultWindow.document.close();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
