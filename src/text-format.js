/**
 * テキストフォーマットユーティリティ
 * YAML から取得した任意のテキスト要素に適用する共通処理
 *
 * 対応記法:
 *   *テキスト*        → <strong class="caption-highlight"> で赤字
 *   半角スペース2つ   → <span class="spacer"></span> で改行
 *                       spacer がある場合は親要素に .text-multiline クラスが付き
 *                       フォントサイズが縮小される（styles.css で調整可）
 */

/**
 * テキストをフォーマットして HTML 文字列を返す
 * @param {string|number} text
 * @returns {{ html: string, multiline: boolean }}
 */
export function formatText(text) {
    const raw = String(text)
        .replace(/\*([^*]+)\*/g, '<strong class="caption-highlight">$1</strong>');

    const multiline = raw.includes('  ');
    const html = raw.replace(/  /g, '<span class="spacer"></span>');

    return { html, multiline };
}

/**
 * 要素に formatText を適用する
 * - innerHTML にフォーマット済み HTML をセット
 * - spacer（改行）が含まれる場合は .text-multiline クラスを付与
 * @param {HTMLElement} el
 * @param {string|number} text
 */
export function applyFormatText(el, text) {
    const { html, multiline } = formatText(text);
    el.innerHTML = html;
    if (multiline) {
        el.classList.add('text-multiline');
    }
}
