import {
    createMediaElement,
    getMediaLabel,
    getMediaSource,
    isVisualMediaPath,
} from './media.js';

export function renderQuestionSlide(question, { stage = 'question' } = {}) {
    const container = document.createElement('div');
    const layout = question.layout || {};
    const selections = question.selections || {};

    const layoutClass = determineLayoutClass(selections, layout);
    container.className = `quiz ${layoutClass}`;

    const title = document.createElement('h1');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = layout['mini-title'] || question.title || '';
    title.appendChild(titleSpan);
    container.appendChild(title);

    if (layout['large-image']) {
        const h2 = document.createElement('h2');
        const media = createMediaElement(layout['large-image'], { stage, alt: '' });
        if (media) {
            h2.appendChild(media);
        }
        container.appendChild(h2);
    }

    const ol = document.createElement('ol');
    for (const value of Object.values(selections)) {
        const li = document.createElement('li');
        appendSelectionContent(li, value, { stage });
        ol.appendChild(li);
    }
    container.appendChild(ol);

    const timeLimit = question.time_limit ?? 10;
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.dataset.limit = timeLimit;
    timer.textContent = timeLimit;
    container.appendChild(timer);

    return container;
}

export function renderResultSlide(question) {
    const container = renderQuestionSlide(question, { stage: 'answer' });
    container.className = container.className.replace('quiz', 'answer');
    return container;
}

export function renderAnswerSlide(question) {
    const container = renderQuestionSlide(question, { stage: 'answer' });
    container.className = container.className.replace('quiz', 'answer');

    const answer = question.answer || {};
    const correctAnswers = answer.answer || [];

    if (Array.isArray(correctAnswers) && correctAnswers.length === 1) {
        container.classList.add(`maru-${correctAnswers[0]}`);
    }

    return container;
}

export function renderCaptionSlide(question) {
    const container = renderQuestionSlide(question, { stage: 'answer' });
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
        captionEl.innerHTML = String(captionText).replace(
            /\*([^*]+)\*/g,
            '<strong class="caption-highlight">$1</strong>'
        );
        li.appendChild(captionEl);
    });

    return container;
}

export function renderLeadInSlide(question) {
    const container = document.createElement('div');
    container.className = 'lead-in-slide';

    const leadIn = question['lead-in'] || {};

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

    if (leadIn.image) {
        const media = createMediaElement(leadIn.image, { stage: 'question', alt: '' });
        if (media) {
            media.className = media.tagName === 'VIDEO'
                ? 'lead-in-media lead-in-video'
                : 'lead-in-media lead-in-image';
            container.appendChild(media);
        }
    }

    return container;
}

export function renderSortQuestionSlide(question) {
    const container = document.createElement('div');
    const layout = question.layout || {};
    const selections = question.selections || {};

    const hasImages = Object.values(selections).some(v =>
        isVisualMediaPath(v) || (Array.isArray(v) && isVisualMediaPath(v[0]))
    );
    const count = Object.keys(selections).length;
    const takuClass = count <= 2 ? 'taku-2' : count <= 4 ? 'taku-4' : 'taku-6';
    const typeClass = hasImages ? 'image-quiz' : 'text-quiz';

    container.className = `quiz sort ${typeClass} ${takuClass}`;

    const title = document.createElement('h1');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = layout['mini-title'] || question.title || '';
    title.appendChild(titleSpan);
    container.appendChild(title);

    const ol = document.createElement('ol');
    for (const value of Object.values(selections)) {
        const li = document.createElement('li');
        appendSelectionContent(li, value, { stage: 'question' });
        ol.appendChild(li);
    }
    container.appendChild(ol);

    const timeLimit = question.time_limit ?? 10;
    const timer = document.createElement('div');
    timer.className = 'countdown-timer';
    timer.dataset.limit = timeLimit;
    timer.textContent = timeLimit;
    container.appendChild(timer);

    return container;
}

export function renderSortAnswerSlides(question) {
    const layout = question.layout || {};
    const selections = question.selections || {};
    const answer = question.answer || {};
    const correctOrder = answer.answer || [];
    const captions = answer.caption || {};

    const selectionKeys = Object.keys(selections);
    const hasImages = Object.values(selections).some(v =>
        isVisualMediaPath(v) || (Array.isArray(v) && isVisualMediaPath(v[0]))
    );
    const count = correctOrder.length;
    const takuClass = count <= 2 ? 'taku-2' : count <= 4 ? 'taku-4' : 'taku-6';
    const typeClass = hasImages ? 'image-quiz' : 'text-quiz';

    const orderedItems = correctOrder.map(key => {
        const strKey = String(key);
        return {
            key: strKey,
            value: selections[strKey],
            caption: captions[strKey] || null,
        };
    });

    const steps = [];
    if (count <= 2) {
        steps.push(count);
    } else {
        for (let i = 1; i <= count - 2; i++) {
            steps.push(i);
        }
        steps.push(count);
    }

    return steps.map(revealCount => {
        const container = document.createElement('div');
        container.className = `answer sort ${typeClass} ${takuClass}`;

        const title = document.createElement('h1');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = layout['mini-title'] || question.title || '';
        title.appendChild(titleSpan);
        container.appendChild(title);

        const ol = document.createElement('ol');
        orderedItems.forEach((item, index) => {
            const li = document.createElement('li');
            const revealed = index < revealCount;

            const originalIndex = selectionKeys.indexOf(item.key);
            const badgeLabel = String.fromCharCode(65 + originalIndex);
            li.dataset.badge = badgeLabel;
            li.classList.add(`badge-${originalIndex + 1}`);

            if (!revealed) {
                li.classList.add('sort-hidden');
            } else if (hasImages) {
                li.classList.add('sort-image-row');
                const media = createMediaElement(item.value, {
                    stage: 'answer',
                    alt: item.caption || '',
                });
                if (media) {
                    media.className = 'sort-thumb';
                    li.appendChild(media);
                }

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

export function appendSelectionContent(li, value, { stage = 'question' } = {}) {
    const source = getMediaSource(value);
    const label = getMediaLabel(value);

    if (typeof source === 'string' && isVisualMediaPath(source)) {
        const media = createMediaElement(source, { stage, alt: label });
        if (media) {
            li.appendChild(media);
        }
        if (label) {
            const caption = document.createElement('span');
            caption.className = 'caption';
            caption.textContent = label;
            li.appendChild(caption);
        }
        return;
    }

    if (Array.isArray(value)) {
        li.textContent = label || source || '';
        return;
    }

    li.textContent = value;
}

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

function determineLayoutClass(selections, layout) {
    const count = Object.keys(selections).length;
    const hasImages = Object.values(selections).some(v =>
        isVisualMediaPath(v) || (Array.isArray(v) && isVisualMediaPath(v[0]))
    );
    const hasLargeImage = !!layout['large-image'];

    const typeClass = hasImages ? 'image-quiz' : 'text-quiz';
    const takuClass = count <= 2 ? 'taku-2' : count <= 4 ? 'taku-4' : 'taku-6';

    if (hasLargeImage) {
        return `${typeClass} ${takuClass} large-image`;
    }

    return `${typeClass} ${takuClass}`;
}

export { isImagePath } from './media.js';
