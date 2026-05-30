const AUDIO_KEYS = ['src', 'path', 'file', 'url'];

export class SlideAudioManager {
    constructor() {
        this.current = null;
        this.cache = new Map();
    }

    playForSlide(slide, settings = {}) {
        this.stop();

        const spec = resolveAudioSpec(slide, settings);
        const src = normalizeAudioSource(spec);
        if (!src) return;

        const audio = this.getAudio(src);
        audio.loop = false;
        audio.currentTime = 0;
        this.current = audio;

        audio.play().catch(err => {
            console.warn('[Audio] playback skipped:', err.message);
        });
    }

    stop() {
        if (!this.current) return;
        this.current.pause();
        this.current.currentTime = 0;
        this.current = null;
    }

    getAudio(src) {
        if (!this.cache.has(src)) {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audio.loop = false;
            this.cache.set(src, audio);
        }
        return this.cache.get(src);
    }
}

function resolveAudioSpec(slide, settings) {
    const question = slide?.data || {};
    const questionAudio =
        question.audio ??
        question.sounds ??
        question.sound ??
        question.bgm ??
        question.se ??
        question.settings?.audio ??
        question.settings?.sounds;

    const globalAudio =
        settings.audio ??
        settings.sounds ??
        settings.sound ??
        settings.bgm ??
        settings.se;

    return (
        pickAudio(questionAudio, slide) ??
        pickAudio(globalAudio, slide)
    );
}

function pickAudio(source, slide) {
    if (source == null) return null;
    if (typeof source === 'string') return source;
    if (typeof source !== 'object') return null;
    if (isAudioLeaf(source)) return source;

    const stage = audioStage(slide?.type);
    const candidates = [];

    if (stage === 'question') {
        candidates.push(source.question, source.questions, source[slide?.type], source);
    } else if (stage === 'reveal') {
        candidates.push(source.reveal, source[slide?.type]);
    } else {
        candidates.push(source[stage], source[slide?.type]);
    }

    candidates.push(source.default);

    for (const candidate of candidates) {
        const resolved = pickTimeAudio(candidate, slide, stage);
        if (resolved != null) return resolved;
    }

    return null;
}

function pickTimeAudio(source, slide, stage) {
    if (source == null) return null;
    if (typeof source === 'string' || isAudioLeaf(source)) return source;
    if (typeof source !== 'object') return null;

    if (stage === 'question') {
        const timeLimit = String(slide?.data?.time_limit ?? 10);
        const byTime = source.by_time ?? source.byTime ?? source.time_limit ?? source.timeLimit;
        return (
            source[timeLimit] ??
            source[`${timeLimit}s`] ??
            byTime?.[timeLimit] ??
            byTime?.[`${timeLimit}s`] ??
            byTime?.default ??
            source.default ??
            null
        );
    }

    return source.default ?? null;
}

function audioStage(type) {
    if (type === 'sort-answer' || type === 'bonus-reveal') return 'reveal';
    if (type === 'result') return 'result';
    if (type === 'answer') return 'answer';
    if (type === 'question') return 'question';
    return type;
}

function normalizeAudioSource(spec) {
    if (typeof spec === 'string') return spec;
    if (!spec || typeof spec !== 'object') return null;
    return spec.src ?? spec.path ?? spec.file ?? spec.url ?? null;
}

function isAudioLeaf(value) {
    if (!value || typeof value !== 'object') return false;
    return AUDIO_KEYS.some(key => Object.prototype.hasOwnProperty.call(value, key));
}
