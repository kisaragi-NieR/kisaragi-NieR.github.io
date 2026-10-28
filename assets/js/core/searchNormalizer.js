/**
 * YACHO - 検索キーワード正規化（クライアント用 ES Module）
 *
 * server/core/searchNormalizer.js と同一のロジック。
 * サーバー側とクライアント側で同じ正規化ルールを適用し、
 * キーワードの不一致を防止する。
 */

/**
 * 入力文字列を正規化する
 * @param {string} raw
 * @returns {string}
 */
export function normalizeInput(raw) {
  if (typeof raw !== 'string') return '';
  return raw.normalize('NFKC').trim().replace(/[\s\u3000]+/g, ' ');
}

/**
 * 正規化済み文字列からファイルキーを生成する
 * @param {string} normalized
 * @returns {string}
 */
export function toFileKey(normalized) {
  return normalized.replace(/\s+/g, '').normalize('NFC');
}

/**
 * ファイルキーを ASCII-safe なファイル名に変換する（UTF-8 hex エンコード）
 * @param {string} fileKey toFileKey() で生成されたキー
 * @returns {string} hex 文字列
 */
export function toFileName(fileKey) {
  const bytes = new TextEncoder().encode(fileKey);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
