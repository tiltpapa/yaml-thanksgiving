import { loadQuizYaml } from './yaml-loader.js';
import { renderQuestionSlide, renderResultSlide, renderAnswerSlide, renderTitleSlide, renderLeadInSlide, renderCaptionSlide, renderSortQuestionSlide, renderSortAnswerSlides } from './slide-renderer.js';
import { SlideController } from './slide-controller.js';
import { QuaggaApiClient, summarizeAggregate } from './quagga-api.js';
import { injectAnswerCounts, injectCorrectAnswerCount } from './result-renderer.js';
import { buildBonusSlideStack, fetchBonusData, replaceBonusSlides } from './bonus-quiz.js';

async function init() {
    const container = document.getElementById('current-slide');
    const controller = new SlideController(container);

    let quaggaApi = null;
    try {
        const { config } = await import('../config.js');
        quaggaApi = new QuaggaApiClient(config);
        console.log(`[Quagga] connected (debugMode: ${config.debugMode})`);
    } catch {
        console.info('[Quagga] config.js not found. Quagga integration disabled.');
    }

    try {
        const quizData = await loadQuizYaml('quiz.yml');
        console.log('Loaded quiz data:', quizData);

        const slides = [];

        for (const question of quizData.questions) {
            const verticalStack = [];

            if (question.title) {
                verticalStack.push({
                    type: 'title',
                    data: question,
                    element: renderTitleSlide(question),
                });
            }

            if (question['lead-in']) {
                verticalStack.push({
                    type: 'lead-in',
                    data: question,
                    element: renderLeadInSlide(question),
                });
            }

            if (question.selections) {
                const layoutType = question.layout?.type;
                const isBonus = layoutType === 'bonus';
                const isSort = layoutType === 'sort';

                if (isBonus) {
                    const qEl = renderSortQuestionSlide(question);
                    qEl.classList.add('bonus');
                    verticalStack.push({
                        type: 'question',
                        data: question,
                        element: qEl,
                    });

                    const bonusSlides = await buildBonusSlideStack(question, quaggaApi);
                    verticalStack.push(...bonusSlides);
                } else if (isSort) {
                    verticalStack.push({
                        type: 'question',
                        data: question,
                        element: renderSortQuestionSlide(question),
                    });

                    if (question.answer) {
                        const answerSlides = renderSortAnswerSlides(question);
                        for (const el of answerSlides) {
                            verticalStack.push({
                                type: 'sort-answer',
                                data: question,
                                element: el,
                            });
                        }
                    }
                } else {
                    verticalStack.push({
                        type: 'question',
                        data: question,
                        element: renderQuestionSlide(question),
                    });

                    if (question.answer) {
                        verticalStack.push({
                            type: 'result',
                            data: question,
                            element: renderResultSlide(question),
                        });
                    }

                    if (question.answer) {
                        verticalStack.push({
                            type: 'answer',
                            data: question,
                            element: renderAnswerSlide(question),
                        });
                    }

                    if (question.answer?.caption) {
                        verticalStack.push({
                            type: 'caption',
                            data: question,
                            element: renderCaptionSlide(question),
                        });
                    }
                }
            }

            if (verticalStack.length > 0) {
                slides.push(verticalStack);
            }
        }

        const statsCache = new Map();

        const loadStats = async (h) => {
            if (statsCache.has(h)) {
                return statsCache.get(h);
            }

            const aggregate = await quaggaApi.getLastAggregate();
            const stats = summarizeAggregate(aggregate);
            statsCache.set(h, stats);
            return stats;
        };

        controller.onSlideChange = async (h, v, slide) => {
            const totalH = slides.length;
            const totalV = slides[h]?.length || 0;
            console.log(`Slide [${h}/${v}] (${h + 1}/${totalH}, ${v + 1}/${totalV}): ${slide.type}`);

            if (!quaggaApi) return;

            if (slide.type === 'result') {
                try {
                    const { counts } = await loadStats(h);
                    injectAnswerCounts(slide.element, counts);
                } catch (err) {
                    console.warn('[Quagga] answer counts failed', err.message);
                }
            } else if (slide.type === 'answer' || slide.type === 'caption') {
                try {
                    const { counts } = await loadStats(h);
                    injectAnswerCounts(slide.element, counts);
                } catch (err) {
                    console.warn('[Quagga] answer counts failed', err.message);
                }
            }

            if (slide.type === 'answer' || slide.type === 'sort-answer') {
                try {
                    const { correctCount } = await loadStats(h);
                    injectCorrectAnswerCount(slide.element, correctCount);
                } catch (err) {
                    console.warn('[Quagga] correct answer count failed', err.message);
                }
            }
        };

        controller.setSlides(slides);

        if (quaggaApi) {
            document.addEventListener('keydown', async (e) => {
                if (e.key !== 'c' && e.key !== 'C') return;
                const group = slides[controller.indexH];
                if (!group?.some(s => s.type.startsWith('bonus-'))) return;

                const ref = group.find(s => s.type === 'bonus-champion' || s.type === 'bonus-error');
                if (!ref) return;

                try {
                    const { championAnswer } = await fetchBonusData(quaggaApi);
                    if (!championAnswer?.length) {
                        console.warn('[Bonus] champion answer not found');
                        return;
                    }
                    if (replaceBonusSlides(group, ref.data, championAnswer)) {
                        console.log('[Bonus] champion slides updated');
                        controller.render();
                    }
                } catch (err) {
                    console.warn('[Bonus] champion fetch failed', err.message);
                }
            });
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        container.innerHTML = `<div class="error">load error: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
