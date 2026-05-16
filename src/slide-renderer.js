/**
 * スライドのDOM生成を担当
 */

/**
 * 問題スライドを生成
 */
export function renderQuestionSlide(question) {
    const container = document.createElement('div');
    const layout = question.layout || {};
    const selections = question.selections || {};
    
    // レイアウトクラスを決定
    const layoutClass = determineLayoutClass(selections, layout);
    container.className = `quiz ${layoutClass}`;

    // タイトル（問題文）
    const title = document.createElement('h1');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = layout['mini-title'] || question.title || '';
    title.appendChild(titleSpan);
    container.appendChild(title);

    // 大きな画像がある場合
    if (layout['large-image']) {
        const h2 = document.createElement('h2');
        const img = document.createElement('img');
        img.src = layout['large-image'];
        img.alt = '';
        h2.appendChild(img);
        container.appendChild(h2);
    }

    // 選択肢リスト
    const ol = document.createElement('ol');

    for (const value of Object.values(selections)) {
        const li = document.createElement('li');
        appendSelectionContent(li, value);
        ol.appendChild(li);
    }
    container.appendChild(ol);

    // タイマー（time_limit 未設定時は10秒）
    const timeLimit = question.time_limit ?? 10;
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.dataset.limit = timeLimit;
    timer.textContent = timeLimit;
    container.appendChild(timer);

    return container;
}

/**
 * 回答数表示スライドを生成
 * answerクラスでmaru-Xなし = 回答数表示用
 */
export function renderResultSlide(question) {
    const container = renderQuestionSlide(question);
    container.className = container.className.replace('quiz', 'answer');
    
    return container;
}

/**
 * 回答スライドを生成（正解表示）
 * answerクラス + maru-X = 正解ハイライト
 */
export function renderAnswerSlide(question) {
    const container = renderQuestionSlide(question);
    container.className = container.className.replace('quiz', 'answer');
    
    const answer = question.answer || {};
    const correctAnswers = answer.answer || [];
    
    // 正解のクラスを追加
    if (Array.isArray(correctAnswers) && correctAnswers.length === 1) {
        container.classList.add(`maru-${correctAnswers[0]}`);
    }
    
    return container;
}

/**
 * 解説スライドを生成（ハイライトなし、回答数非表示）
 * answer.caption: { 1: "...", 2: "..." } に対応
 * キャプションテキスト内の *テキスト* を太字赤で表示
 */
export function renderCaptionSlide(question) {
    // 問題スライドをベースに生成（ハイライトなし）
    const container = renderQuestionSlide(question);
    container.className = container.className.replace('quiz', 'answer');
    container.classList.add('caption-slide');

    const answer = question.answer || {};
    const captions = answer.caption || {};
    const selections = question.selections || {};

    const items = container.querySelectorAll('ol li');
    const keys = Object.keys(selections);

    items.forEach((li, index) => {
        const key = keys[index];
        const captionText = captions[key];
        if (!captionText) return;

        const captionEl = document.createElement('span');
        captionEl.className = 'answer-caption';
        // *テキスト* を <strong class="highlight"> に変換
        captionEl.innerHTML = String(captionText).replace(
            /\*([^*]+)\*/g,
            '<strong class="caption-highlight">$1</strong>'
        );
        li.appendChild(captionEl);
    });

    return container;
}

/**
 * 前フリスライドを生成
 * lead-in: { text: string|string[], image: string } に対応
 */
export function renderLeadInSlide(question) {
    const container = document.createElement('div');
    container.className = 'lead-in-slide';

    const leadIn = question['lead-in'] || {};

    // テキスト（複数行対応）
    if (leadIn.text) {
        const texts = Array.isArray(leadIn.text) ? leadIn.text : [leadIn.text];
        const textEl = document.createElement('div');
        textEl.className = 'lead-in-text';
        for (const line of texts) {
            const p = document.createElement('p');
            p.textContent = line;
            textEl.appendChild(p);
        }
        container.appendChild(textEl);
    }

    // 画像
    if (leadIn.image) {
        const img = document.createElement('img');
        img.src = leadIn.image;
        img.alt = '';
        img.className = 'lead-in-image';
        container.appendChild(img);
    }

    return container;
}

/**
 * 並び替えクイズ：問題スライドを生成
 * 選択肢バッジは A B C D ... 表示
 */
export function renderSortQuestionSlide(question) {
    const container = document.createElement('div');
    const layout = question.layout || {};
    const selections = question.selections || {};

    const hasImages = Object.values(selections).some(v =>
        isImagePath(v) || (Array.isArray(v) && isImagePath(v[0]))
    );
    const count = Object.keys(selections).length;
    const takuClass = count <= 2 ? 'taku-2' : count <= 4 ? 'taku-4' : 'taku-6';
    const typeClass = hasImages ? 'image-quiz' : 'text-quiz';

    // sort クラスを付与（バッジを A B C D にするため）
    container.className = `quiz sort ${typeClass} ${takuClass}`;

    // タイトル（問題文）
    const title = document.createElement('h1');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = layout['mini-title'] || question.title || '';
    title.appendChild(titleSpan);
    container.appendChild(title);

    // 選択肢リスト（元の順番で表示）
    const ol = document.createElement('ol');
    for (const value of Object.values(selections)) {
        const li = document.createElement('li');
        appendSelectionContent(li, value);
        ol.appendChild(li);
    }
    container.appendChild(ol);

    // タイマー
    const timeLimit = question.time_limit ?? 10;
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.dataset.limit = timeLimit;
    timer.textContent = timeLimit;
    container.appendChild(timer);

    return container;
}

/**
 * 並び替えクイズ：正解発表スライドを複数枚生成して返す
 * - 正解順に選択肢を並べ替えて表示
 * - 最後の2つは同時開示、それ以外は1枚ずつ
 * - 選択肢が画像の場合：バッジ横に小さい画像＋キャプション（横並び）
 * @returns {Array<HTMLElement>} スライド要素の配列
 */
export function renderSortAnswerSlides(question) {
    const layout = question.layout || {};
    const selections = question.selections || {};
    const answer = question.answer || {};
    const correctOrder = answer.answer || []; // 正解の順番（選択肢キー）
    const captions = answer.caption || {};

    const selectionKeys = Object.keys(selections);
    const hasImages = Object.values(selections).some(v =>
        isImagePath(v) || (Array.isArray(v) && isImagePath(v[0]))
    );
    const count = correctOrder.length;
    const takuClass = count <= 2 ? 'taku-2' : count <= 4 ? 'taku-4' : 'taku-6';
    const typeClass = hasImages ? 'image-quiz' : 'text-quiz';

    // 正解順に並べた選択肢データを構築
    // { key, value, caption } の配列
    const orderedItems = correctOrder.map(key => {
        const strKey = String(key);
        return {
            key: strKey,
            value: selections[strKey],
            caption: captions[strKey] || null,
        };
    });

    // 開示ステップを決定
    // 最後の2つは同時開示、それ以外は1枚ずつ
    // 例: 4択 → [1枚目:1個, 2枚目:2個, 3枚目:4個]
    const steps = [];
    if (count <= 2) {
        steps.push(count); // 全部一気に
    } else {
        for (let i = 1; i <= count - 2; i++) {
            steps.push(i);
        }
        steps.push(count); // 最後の2つを一気に
    }

    return steps.map(revealCount => {
        const container = document.createElement('div');
        container.className = `answer sort ${typeClass} ${takuClass}`;

        // タイトル
        const title = document.createElement('h1');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = layout['mini-title'] || question.title || '';
        title.appendChild(titleSpan);
        container.appendChild(title);

        // 選択肢リスト（正解順）
        const ol = document.createElement('ol');
        orderedItems.forEach((item, index) => {
            const li = document.createElement('li');
            const revealed = index < revealCount;

            // 元の選択肢キーから何番目かを求めてバッジ文字・色クラスを決定
            // selectionKeys は ['1','2','3','4'] など
            const originalIndex = selectionKeys.indexOf(item.key); // 0始まり
            const badgeLabel = String.fromCharCode(65 + originalIndex); // A,B,C,D...
            li.dataset.badge = badgeLabel;
            li.classList.add(`badge-${originalIndex + 1}`); // badge-1, badge-2...

            if (!revealed) {
                // 未開示：完全非表示
                li.classList.add('sort-hidden');
            } else if (hasImages) {
                // 画像問題：バッジ横に小さい画像＋キャプション（横並び）
                li.classList.add('sort-image-row');
                const img = document.createElement('img');
                const imgSrc = Array.isArray(item.value) ? item.value[0] : item.value;
                img.src = imgSrc;
                img.alt = item.caption || '';
                img.className = 'sort-thumb';
                li.appendChild(img);

                if (item.caption) {
                    const cap = document.createElement('span');
                    cap.className = 'sort-caption';
                    cap.innerHTML = String(item.caption).replace(
                        /\*([^*]+)\*/g,
                        '<strong class="caption-highlight">$1</strong>'
                    );
                    li.appendChild(cap);
                }
            } else {
                // テキスト問題
                const textValue = Array.isArray(item.value) ? item.value[1] || item.value[0] : item.value;
                li.textContent = textValue;

                if (item.caption) {
                    const cap = document.createElement('span');
                    cap.className = 'answer-caption';
                    cap.innerHTML = String(item.caption).replace(
                        /\*([^*]+)\*/g,
                        '<strong class="caption-highlight">$1</strong>'
                    );
                    li.appendChild(cap);
                }
            }

            ol.appendChild(li);
        });
        container.appendChild(ol);

        return container;
    });
}

/**
 * 選択肢の内容をliに追加（共通ヘルパー）
 */
export function appendSelectionContent(li, value) {
    if (Array.isArray(value)) {
        const img = document.createElement('img');
        img.src = value[0];
        img.alt = value[1] || '';
        li.appendChild(img);
        if (value[1]) {
            const caption = document.createElement('span');
            caption.className = 'caption';
            caption.textContent = value[1];
            li.appendChild(caption);
        }
    } else if (typeof value === 'string' && isImagePath(value)) {
        const img = document.createElement('img');
        img.src = value;
        img.alt = '';
        li.appendChild(img);
    } else {
        li.textContent = value;
    }
}

/**
 * タイトルスライドを生成
 */
export function renderTitleSlide(question) {
    const container = document.createElement('div');
    container.className = 'title-slide';
    
    const title = document.createElement('h1');
    title.textContent = question.title || '';
    container.appendChild(title);
    
    if (question.subtitle) {
        const subtitle = document.createElement('h2');
        subtitle.textContent = question.subtitle;
        container.appendChild(subtitle);
    }
    
    return container;
}

/**
 * レイアウトクラスを決定
 * 新クラス構造: [type]-quiz taku-[n] [large-image]
 */
function determineLayoutClass(selections, layout) {
    const count = Object.keys(selections).length;
    const hasImages = Object.values(selections).some(v => 
        isImagePath(v) || (Array.isArray(v) && isImagePath(v[0]))
    );
    const hasLargeImage = !!layout['large-image'];
    
    const typeClass = hasImages ? 'image-quiz' : 'text-quiz';
    const takuClass = count <= 2 ? 'taku-2' : count <= 4 ? 'taku-4' : 'taku-6';
    
    if (hasLargeImage) {
        return `${typeClass} ${takuClass} large-image`;
    }
    
    return `${typeClass} ${takuClass}`;
}

/**
 * 画像パスかどうか判定
 */
export function isImagePath(value) {
    if (typeof value !== 'string') return false;
    return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(value);
}
