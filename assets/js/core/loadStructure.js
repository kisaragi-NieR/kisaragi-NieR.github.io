// assets/js/core/loadStructure.js
// ============================================
// DEPRECATED (V11)
// structure.json は生成されなくなりました。
// 代わりに以下を使用してください：
// - /data/meta.json（総ページ数）
// - /data/pages/{slug}.json（個別ページ情報）
// - /data/search/{hash}.json（検索用）
// ============================================

export async function loadStructure() {
  console.warn('[loadStructure] DEPRECATED: structure.json is no longer generated');
  return [];
}
