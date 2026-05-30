const BACKGROUND_KEYS = [
    'background',
    'css',
    'image',
    'color',
    'size',
    'position',
    'repeat',
    'attachment',
    'blendMode',
];

const BACKGROUND_STYLE_PROPS = [
    'background',
    'backgroundImage',
    'backgroundColor',
    'backgroundSize',
    'backgroundPosition',
    'backgroundRepeat',
    'backgroundAttachment',
    'backgroundBlendMode',
];

export function applySlideBackground(slideEl, slide, settings = {}) {
    resetSlideBackground(slideEl);

    const spec = resolveBackgroundSpec(slide, settings);
    if (!spec) return;

    const styles = normalizeBackgroundStyles(spec);
    if (Object.keys(styles).length === 0) return;

    slideEl.classList.add('has-custom-background');
    for (const [prop, value] of Object.entries(styles)) {
        slideEl.style[prop] = value;
    }
}

function resetSlideBackground(slideEl) {
    slideEl.classList.remove('has-custom-background');
    for (const prop of BACKGROUND_STYLE_PROPS) {
        slideEl.style[prop] = '';
    }
}

function resolveBackgroundSpec(slide, settings) {
    const question = slide?.data || {};
    const layoutType = question.layout?.type || slide?.type;

    const questionBackgrounds =
        question.backgrounds ??
        question.background ??
        question.settings?.backgrounds ??
        question.settings?.background;

    const globalBackgrounds =
        settings.backgrounds ??
        settings.background;

    return (
        pickBackground(questionBackgrounds, slide, layoutType) ??
        pickBackground(globalBackgrounds, slide, layoutType)
    );
}

function pickBackground(source, slide, layoutType) {
    if (source == null) return null;
    if (typeof source === 'string') return source;
    if (typeof source !== 'object') return null;
    if (isBackgroundLeaf(source)) return source;

    const stage = stageAlias(slide?.type);
    return (
        source[slide?.type] ??
        source[stage] ??
        source[layoutType] ??
        source.default ??
        null
    );
}

function stageAlias(type) {
    if (type === 'sort-answer' || type === 'bonus-reveal') return 'reveal';
    return type;
}

function isBackgroundLeaf(value) {
    return BACKGROUND_KEYS.some(key => Object.prototype.hasOwnProperty.call(value, key));
}

function normalizeBackgroundStyles(spec) {
    if (typeof spec === 'string') {
        return isImagePath(spec)
            ? { backgroundImage: toCssUrl(spec), backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: spec };
    }

    if (typeof spec !== 'object') return {};

    const styles = {};
    const background = spec.css ?? spec.background;
    if (background) styles.background = background;
    if (spec.image) styles.backgroundImage = toCssUrl(spec.image);
    if (spec.color) styles.backgroundColor = spec.color;
    if (spec.size) styles.backgroundSize = spec.size;
    if (spec.position) styles.backgroundPosition = spec.position;
    if (spec.repeat) styles.backgroundRepeat = spec.repeat;
    if (spec.attachment) styles.backgroundAttachment = spec.attachment;
    if (spec.blendMode) styles.backgroundBlendMode = spec.blendMode;

    if (spec.image && !spec.size) styles.backgroundSize = 'cover';
    if (spec.image && !spec.position) styles.backgroundPosition = 'center';
    if (spec.image && !spec.repeat) styles.backgroundRepeat = 'no-repeat';

    return styles;
}

function isImagePath(value) {
    return /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(value);
}

function toCssUrl(value) {
    if (String(value).startsWith('url(')) return value;
    return `url("${String(value).replace(/"/g, '\\"')}")`;
}
