function initReportShare() {
  const button = document.getElementById('reportShareButton');
  if (!button) return;

  button.addEventListener('click', () => {
    const text = '消えた限定プリン事件で犯人を特定しました。';
    const hashtags = '消えた限定プリン事件';
    const sharedUrl = 'https://note.com/nmkmnbaby/n/nf1a5f9ead15e?app_launch=false';
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharedUrl)}&hashtags=${encodeURIComponent(hashtags)}`;

    const link = document.createElement('a');
    link.href = shareUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReportShare);
} else {
  initReportShare();
}
