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
        
        if (Array.isArray(value)) {
            // [画像パス, キャプション] 形式
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
            // 画像パスのみ
            const img = document.createElement('img');
            img.src = value;
            img.alt = '';
            li.appendChild(img);
        } else {
            // テキスト
            li.textContent = value;
        }
        
        ol.appendChild(li);
    }
    container.appendChild(ol);

    // タイマー
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.textContent = '10';
    container.appendChild(timer);

    return container;
}

/**
 * 回答スライドを生成
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
function isImagePath(value) {
    if (typeof value !== 'string') return false;
    return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(value);
}
