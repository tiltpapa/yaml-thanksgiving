/**
 * 回答数バーグラフのDOM生成を担当
 * QuaggaApiClient から受け取ったデータをもとに描画する。
 * スライドのDOM構造には依存しない。
 */

/**
 * 回答数を既存の result スライドの各選択肢に注入する
 * CSS の ::after { content: attr(data-count) } で表示される。
 *
 * @param {HTMLElement} slideEl  renderResultSlide() が返した要素
 * @param {{ [key: string]: number }} counts  選択肢キー → 回答数
 */
export function injectAnswerCounts(slideEl, counts) {
  const items = slideEl.querySelectorAll('ol li');
  const keys  = Object.keys(counts);

  items.forEach((li, index) => {
    const key   = keys[index];
    if (key == null) return;
    const count = counts[key] ?? 0;
    li.dataset.count = count;
  });
}

/**
 * 正解発表スライドの countdown-timer に正解者数を表示
 *
 * @param {HTMLElement} slideEl
 * @param {number} correctCount
 */
export function injectCorrectAnswerCount(slideEl, correctCount) {
  const timerEl = slideEl.querySelector('.countdown-timer');
  if (!timerEl) return;

  timerEl.dataset.mode = 'count';
  timerEl.dataset.count = String(correctCount ?? 0);
  timerEl.textContent = '';
  const numberEl = document.createElement('span');
  numberEl.className = 'count-number';
  numberEl.textContent = String(correctCount ?? 0);
  const unitEl = document.createElement('span');
  unitEl.className = 'count-unit';
  unitEl.textContent = '人';
  timerEl.append(numberEl, unitEl);
  timerEl.classList.remove('timer-warning');
}

/**
 * ランキングリストのDOM要素を生成
 *
 * @param {object[]} results  Quagga API の results 配列
 * @param {object}   [opts]
 * @param {number}   [opts.limit=10]  表示件数
 * @returns {HTMLElement}  <ol class="ranking-list">
 */
export function renderRankingList(results, { limit = 10 } = {}) {
  const ol = document.createElement('ol');
  ol.className = 'ranking-list';

  const slice = results.slice(0, limit);

  slice.forEach((result) => {
    const li = document.createElement('li');
    li.className = `ranking-item rank-${result.rank}`;

    const rankEl = document.createElement('span');
    rankEl.className = 'rank-number';
    rankEl.textContent = result.rank;

    const nameEl = document.createElement('span');
    nameEl.className = 'rank-name';
    nameEl.textContent = result.member?.user?.name ?? '—';

    const pointEl = document.createElement('span');
    pointEl.className = 'rank-point';
    pointEl.textContent = `${result.point} P`;

    const timeEl = document.createElement('span');
    timeEl.className = 'rank-time';
    timeEl.textContent = result.time
      ? `${parseFloat(result.time).toFixed(2)} s`
      : '';

    li.append(rankEl, nameEl, pointEl, timeEl);
    ol.appendChild(li);
  });

  return ol;
}

/**
 * ランキングスライドのDOM要素を生成
 *
 * @param {string}   title    スライドタイトル
 * @param {object[]} results  Quagga API の results 配列
 * @param {object}   [opts]
 * @param {number}   [opts.limit=10]
 * @returns {HTMLElement}
 */
export function renderRankingSlide(title, results, opts = {}) {
  const container = document.createElement('div');
  container.className = 'ranking-slide';

  const titleEl = document.createElement('div');
  titleEl.className = 'ranking-title';
  titleEl.textContent = title;
  container.appendChild(titleEl);

  if (results.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'ranking-empty';
    empty.textContent = 'データがありません';
    container.appendChild(empty);
    return container;
  }

  container.appendChild(renderRankingList(results, opts));
  return container;
}
