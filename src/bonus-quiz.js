/**
 * ????????????????????
 * API????????????DOM??
 */

import { isImagePath, appendSelectionContent } from './slide-renderer.js';

const SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** API????????????? */
export function parseAnswerOrder(answerStr) {
    if (!answerStr) return [];
    return String(answerStr)
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !Number.isNaN(n));
}

/** last_aggregate ?????????????? */
export function extractChampionAnswer(aggregate, championUserId) {
    const answers = aggregate?.answers;
    if (!answers?.length) return null;

    let entry = null;
    if (championUserId != null) {
        entry = answers.find(a => a.member?.user?.id === championUserId);
    }

    if (!entry) {
        entry = answers.reduce((earliest, current) =>
            parseFloat(current.time) < parseFloat(earliest.time) ? current : earliest
        );
        console.warn('[Bonus] ???????????????????');
    }

    return parseAnswerOrder(entry.answer);
}

/**
 * ???????????????????????????????????
 */
export function computeRevealSteps(count, championAnswer, correctAnswer) {
    let wrongIndex = -1;
    for (let i = 0; i < count; i++) {
        if (championAnswer[i] !== correctAnswer[i]) {
            wrongIndex = i;
            break;
        }
    }

    const normalSteps = [];
    if (count <= 2) {
        normalSteps.push(count);
    } else {
        for (let i = 1; i <= count - 2; i++) {
            normalSteps.push(i);
        }
        normalSteps.push(count);
    }

    if (wrongIndex < 0) return normalSteps;

    const steps = [];
    for (const revealCount of normalSteps) {
        steps.push(revealCount);
        if (revealCount > wrongIndex && revealCount < count) {
            steps.push(count);
            return steps;
        }
    }
    return steps;
}

function badgeForKey(selectionKeys, choiceNum) {
    const idx = selectionKeys.indexOf(String(choiceNum));
    return idx >= 0 ? SYMBOLS[idx] : '?';
}

function championTakuClass(count) {
    if (count <= 2) return 'champion-2taku';
    if (count >= 6) return 'champion-6taku';
    return 'champion-4taku';
}

function sortTakuClass(count) {
    if (count <= 2) return 'taku-2';
    if (count <= 4) return 'taku-4';
    return 'taku-6';
}

function resolveQuizClasses(question, itemCount) {
    const selections = question.selections || {};
    const hasImages = Object.values(selections).some(v =>
        isImagePath(v) || (Array.isArray(v) && isImagePath(v[0]))
    );
    return {
        hasImages,
        typeClass: hasImages ? 'image-quiz' : 'text-quiz',
        sortTaku: sortTakuClass(itemCount),
        champTaku: championTakuClass(itemCount),
    };
}

function appendSortAnswerItem(li, item, hasImages, revealed) {
    const { value, caption } = item;
    if (!revealed) {
        li.classList.add('sort-hidden');
        return;
    }
    if (hasImages) {
        li.classList.add('sort-image-row');
        const img = document.createElement('img');
        const imgSrc = Array.isArray(value) ? value[0] : value;
        img.src = imgSrc;
        img.alt = caption || '';
        img.className = 'sort-thumb';
        li.appendChild(img);
        if (caption) {
            const cap = document.createElement('span');
            cap.className = 'sort-caption';
            cap.innerHTML = String(caption).replace(
                /\*([^*]+)\*/g,
                '<strong class="caption-highlight">$1</strong>'
            );
            li.appendChild(cap);
        }
    } else {
        const textValue = Array.isArray(value) ? value[1] || value[0] : value;
        li.textContent = textValue;
        if (caption) {
            const cap = document.createElement('span');
            cap.className = 'answer-caption';
            cap.innerHTML = String(caption).replace(
                /\*([^*]+)\*/g,
                '<strong class="caption-highlight">$1</strong>'
            );
            li.appendChild(cap);
        }
    }
}

/**
 * ????????????
 * ?????????? answer sort + champion.css?champion-right / champion-choices?????
 */
export function renderChampionSlide(question, championAnswer) {
    const layout = question.layout || {};
    const selections = question.selections || {};
    const selectionKeys = Object.keys(selections);
    const { hasImages, typeClass, sortTaku, champTaku } = resolveQuizClasses(
        question,
        championAnswer.length
    );

    const container = document.createElement("div");
    container.className =
        `champion-answer answer sort bonus-champion ${typeClass} ${sortTaku} ${champTaku}`;

    const title = document.createElement('h1');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = layout['champion-title'] || '?????????';
    title.appendChild(titleSpan);
    container.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = 'champion-container';

    const left = document.createElement("div");
    left.className = 'champion-left';

    const crown = document.createElement("div");
    crown.className = 'crown-icon';
    left.appendChild(crown);

    const symbolsDiv = document.createElement("div");
    symbolsDiv.className = 'answer-symbols';
    championAnswer.forEach(choiceNum => {
        const sym = document.createElement("div");
        sym.className = 'symbol-item';
        sym.textContent = badgeForKey(selectionKeys, choiceNum);
        sym.dataset.color = String(choiceNum);
        symbolsDiv.appendChild(sym);
    });
    left.appendChild(symbolsDiv);

    const arrow = document.createElement("div");
    arrow.className = 'arrow-icon';
    left.appendChild(arrow);

    const right = document.createElement("div");
    right.className = 'champion-right';
    const ol = document.createElement('ol');
    ol.className = 'champion-choices';
    championAnswer.forEach(choiceNum => {
        const li = document.createElement('li');
        const value = selections[String(choiceNum)];
        li.dataset.symbol = badgeForKey(selectionKeys, choiceNum);
        li.classList.add(`color-${choiceNum}`);
        if (hasImages && value) {
            appendSelectionContent(li, value);
        } else {
            const label = Array.isArray(value) ? value[1] || value[0] : value;
            li.textContent = label ?? '';
        }
        ol.appendChild(li);
    });
    right.appendChild(ol);

    wrap.appendChild(left);
    wrap.appendChild(right);
    container.appendChild(wrap);

    return container;
}

/**
 * ???????????????? + ??????????????
 * @returns {HTMLElement[]}
 */
export function renderBonusRevealSlides(question, championAnswer) {
    const layout = question.layout || {};
    const selections = question.selections || {};
    const answer = question.answer || {};
    const correctOrder = answer.answer || [];
    const captions = answer.caption || {};
    const selectionKeys = Object.keys(selections);

    const { hasImages, typeClass, sortTaku, champTaku } = resolveQuizClasses(
        question,
        correctOrder.length
    );

    const orderedItems = correctOrder.map(key => {
        const strKey = String(key);
        return {
            key: strKey,
            value: selections[strKey],
            caption: captions[strKey] || null,
        };
    });

    const count = correctOrder.length;
    const steps = computeRevealSteps(count, championAnswer, correctOrder);

    let wrongIndex = -1;
    for (let i = 0; i < count; i++) {
        if (championAnswer[i] !== correctOrder[i]) {
            wrongIndex = i;
            break;
        }
    }

    return steps.map(revealCount => {
        const container = document.createElement("div");
        container.className =
            `answer sort bonus-reveal ${typeClass} ${sortTaku} ${champTaku}`;

        const title = document.createElement('h1');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = layout['mini-title'] || question.title || '';
        title.appendChild(titleSpan);
        container.appendChild(title);

        const bonusWrap = document.createElement("div");
        bonusWrap.className = 'bonus-reveal-layout';

        const symbolCol = document.createElement("div");
        symbolCol.className = 'bonus-champion-symbols';
        if (wrongIndex >= 0 && revealCount > wrongIndex) {
            symbolCol.classList.add('grayscale');
        }

        const crownSmall = document.createElement("div");
        crownSmall.className = 'crown-icon crown-icon--compact';
        symbolCol.appendChild(crownSmall);

        const symbolsStack = document.createElement("div");
        symbolsStack.className = 'answer-symbols answer-symbols--compact';
        for (let i = 0; i < revealCount; i++) {
            const choiceNum = championAnswer[i];
            const sym = document.createElement("div");
            sym.className = 'symbol-item';
            sym.textContent = badgeForKey(selectionKeys, choiceNum);
            sym.dataset.color = String(choiceNum);
            if (choiceNum !== correctOrder[i]) {
                sym.classList.add('symbol-wrong');
            }
            symbolsStack.appendChild(sym);
        }
        symbolCol.appendChild(symbolsStack);

        const ol = document.createElement('ol');
        orderedItems.forEach((item, index) => {
            const li = document.createElement('li');
            const revealed = index < revealCount;
            const originalIndex = selectionKeys.indexOf(item.key);
            const badgeLabel = String.fromCharCode(65 + originalIndex);
            li.dataset.badge = badgeLabel;
            li.classList.add(`badge-${originalIndex + 1}`);
            appendSortAnswerItem(li, item, hasImages, revealed);
            ol.appendChild(li);
        });

        bonusWrap.appendChild(symbolCol);
        bonusWrap.appendChild(ol);
        container.appendChild(bonusWrap);

        return container;
    });
}

/** API????????????? */
export async function fetchBonusData(quaggaApi) {
    const [championRes, aggregate] = await Promise.all([
        quaggaApi.getChampion('last_aggregate'),
        quaggaApi.getLastAggregate(),
    ]);
    const championUserId = championRes.champion?.user?.id;
    const championAnswer = extractChampionAnswer(aggregate, championUserId);
    return { championAnswer, champion: championRes.champion, aggregate };
}

/** ??????????????????? */
export async function buildBonusSlideStack(question, quaggaApi) {
    const stack = [];
    const correctOrder = question.answer?.answer || [];

    let championAnswer = null;
    if (quaggaApi) {
        try {
            const data = await fetchBonusData(quaggaApi);
            championAnswer = data.championAnswer;
        } catch (err) {
            console.warn('[Bonus] API????:', err.message);
        }
    }

    if (!championAnswer?.length) {
        const placeholder = document.createElement("div");
        placeholder.className = 'bonus-error';
        placeholder.textContent =
            '?????????????????config.js / API??????C???????';
        stack.push({ type: 'bonus-error', data: question, element: placeholder });
        return stack;
    }

    if (championAnswer.length !== correctOrder.length) {
        console.warn('[Bonus] ?????????????', championAnswer, correctOrder);
    }

    stack.push({
        type: 'bonus-champion',
        data: { ...question, championAnswer },
        element: renderChampionSlide(question, championAnswer),
    });

    for (const el of renderBonusRevealSlides(question, championAnswer)) {
        stack.push({
            type: 'bonus-reveal',
            data: { ...question, championAnswer },
            element: el,
        });
    }

    return stack;
}

/** ????????????????API???????? */
export function replaceBonusSlides(verticalStack, question, championAnswer) {
    const idx = verticalStack.findIndex(
        s => s.type === 'bonus-champion' || s.type === 'bonus-error'
    );
    if (idx < 0) return false;

    while (verticalStack[idx]?.type?.startsWith('bonus-')) {
        verticalStack.splice(idx, 1);
    }

    const newSlides = [];
    newSlides.push({
        type: 'bonus-champion',
        data: { ...question, championAnswer },
        element: renderChampionSlide(question, championAnswer),
    });
    for (const el of renderBonusRevealSlides(question, championAnswer)) {
        newSlides.push({
            type: 'bonus-reveal',
            data: { ...question, championAnswer },
            element: el,
        });
    }
    verticalStack.splice(idx, 0, ...newSlides);
    return true;
}
