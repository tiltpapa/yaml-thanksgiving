const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const VIDEO_EXT_PATTERN = /\.(mp4|webm|mov|m4v|ogg)$/i;

export function isImagePath(value) {
    if (typeof value !== 'string') return false;
    return IMAGE_EXT_PATTERN.test(value);
}

export function isVideoPath(value) {
    if (typeof value !== 'string') return false;
    return VIDEO_EXT_PATTERN.test(value);
}

export function isVisualMediaPath(value) {
    return isImagePath(value) || isVideoPath(value);
}

export function resolveStillImagePath(value) {
    if (typeof value !== 'string') return value;
    if (!isVideoPath(value)) return value;
    return value.replace(/\.[^.\\/]+$/, '.png');
}

export function getMediaSource(value) {
    return Array.isArray(value) ? value[0] : value;
}

export function getMediaLabel(value) {
    if (!Array.isArray(value)) return '';
    return value[1] || '';
}

export function createMediaElement(value, { stage = 'question', alt = '', className = '' } = {}) {
    const source = getMediaSource(value);
    if (typeof source !== 'string' || !source) return null;

    const useVideo = stage === 'question' && isVideoPath(source);
    const el = document.createElement(useVideo ? 'video' : 'img');

    if (className) {
        el.className = className;
    }

    if (useVideo) {
        el.src = source;
        el.autoplay = true;
        el.loop = false;
        el.muted = true;
        el.playsInline = true;
        el.preload = 'auto';
        el.controls = false;
    } else {
        el.src = resolveStillImagePath(source);
        el.alt = alt || '';
    }

    return el;
}
