const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const VIDEO_EXT_PATTERN = /\.(mp4|webm|mov|m4v|ogg)$/i;
const AUDIO_EXT_PATTERN = /\.(mp3|wav|m4a|aac|flac|oga|ogg)$/i;

export function isImagePath(value) {
    if (typeof value !== 'string') return false;
    return IMAGE_EXT_PATTERN.test(value);
}

export function isVideoPath(value) {
    if (typeof value !== 'string') return false;
    return VIDEO_EXT_PATTERN.test(value);
}

export function isAudioPath(value) {
    if (typeof value !== 'string') return false;
    return AUDIO_EXT_PATTERN.test(value);
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

    const mediaType = resolveMediaType(source, stage);
    if (!mediaType) return null;

    const el = document.createElement(mediaType);

    if (className) {
        el.className = className;
    }

    if (mediaType === 'video') {
        el.src = source;
        el.autoplay = true;
        el.loop = false;
        el.muted = shouldMuteVideo(stage);
        el.playsInline = true;
        el.preload = 'auto';
        el.controls = false;
    } else if (mediaType === 'audio') {
        el.src = source;
        el.autoplay = true;
        el.loop = false;
        el.muted = false;
        el.preload = 'auto';
        el.controls = false;
    } else {
        el.src = resolveStillImagePath(source);
        el.alt = alt || '';
    }

    return el;
}

export function playSlideMedia(slideEl) {
    const mediaElements = slideEl.querySelectorAll('video, audio');
    for (const media of mediaElements) {
        media.currentTime = 0;
        media.play().catch(err => {
            console.warn('[Media] playback skipped:', err.message);
        });
    }
}

function resolveMediaType(source, stage) {
    if (isAudioPath(source)) return shouldRenderAudio(stage) ? 'audio' : null;
    if (isVideoPath(source)) return shouldRenderVideo(stage) ? 'video' : 'img';
    if (isImagePath(source)) return 'img';
    return null;
}

function shouldRenderVideo(stage) {
    return stage === 'question' || stage === 'title' || stage === 'lead-in';
}

function shouldRenderAudio(stage) {
    return stage === 'title' || stage === 'lead-in';
}

function shouldMuteVideo(stage) {
    return stage === 'question';
}
