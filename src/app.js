import { loadQuizYaml } from './yaml-loader.js';
import { renderQuestionSlide, renderResultSlide, renderAnswerSlide, renderTitleSlide, renderLeadInSlide, renderCaptionSlide, renderSortQuestionSlide, renderSortAnswerSlides } from './slide-renderer.js';
import { SlideController } from './slide-controller.js';
import { QuaggaApiClient } from './quagga-api.js';
import { injectAnswerCounts } from './result-renderer.js';
import { buildBonusSlideStack, fetchBonusData, replaceBonusSlides } from './bonus-quiz.js';

async function init() {
    const container = document.getElementById('current-slide');
    const controller = new SlideController(container);

    // config.js が存在しない場合はQuagga連携を無効化
    let quaggaApi = null;
    try {
        const { config } = await import('../config.js');
        quaggaApi = new QuaggaApiClient(config);
        console.log(`[Quagga] 連携有効 (debugMode: ${config.debugMode})`);
    } catch {
        console.info('[Quagga] config.js が見つかりません。Quagga連携は無効です。');
    }

    try {
        const quizData = await loadQuizYaml('quiz.yml');
        console.log('Loaded quiz data:', quizData);

        // 2次元スライド配列を生成
        // slides[h][v] - 横方向が問題グループ、縦方向が問題→回答
        const slides = [];
        
        for (const question of quizData.questions) {
            const verticalStack = [];
            
            // タイトルスライド
            if (question.title) {
                verticalStack.push({
                    type: 'title',
                    data: question,
                    element: renderTitleSlide(question)
                });
            }

            // 前フリスライド
            if (question['lead-in']) {
                verticalStack.push({
                    type: 'lead-in',
                    data: question,
                    element: renderLeadInSlide(question)
                });
            }
            
            // 問題スライド
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
                    // 並び替えクイズ
                    verticalStack.push({
                        type: 'question',
                        data: question,
                        element: renderSortQuestionSlide(question)
                    });

                    // 正解発表スライド（複数枚、回答数スライドはスキップ）
                    if (question.answer) {
                        const answerSlides = renderSortAnswerSlides(question);
                        for (const el of answerSlides) {
                            verticalStack.push({
                                type: 'sort-answer',
                                data: question,
                                element: el
                            });
                        }
                    }
                } else {
                    // 通常の選択クイズ
                    verticalStack.push({
                        type: 'question',
                        data: question,
                        element: renderQuestionSlide(question)
                    });

                    // 回答数表示スライド（縦方向に配置）
                    if (question.answer) {
                        verticalStack.push({
                            type: 'result',
                            data: question,
                            element: renderResultSlide(question)
                        });
                    }

                    // 回答スライド（正解表示、縦方向に配置）
                    if (question.answer) {
                        verticalStack.push({
                            type: 'answer',
                            data: question,
                            element: renderAnswerSlide(question)
                        });
                    }

                    // 解説スライド（caption がある場合のみ）
                    if (question.answer?.caption) {
                        verticalStack.push({
                            type: 'caption',
                            data: question,
                            element: renderCaptionSlide(question)
                        });
                    }
                }
            }
            
            if (verticalStack.length > 0) {
                slides.push(verticalStack);
            }
        }

        // setSlides より先に登録（初期表示でも呼ばれるようにする）
        // result スライドで取得したカウントをキャッシュ（問題インデックスをキーに保持）
        const countCache = new Map(); // key: h, value: counts

        controller.onSlideChange = async (h, v, slide) => {
            const totalH = slides.length;
            const totalV = slides[h]?.length || 0;
            console.log(`Slide [${h}/${v}] (${h+1}/${totalH}, ${v+1}/${totalV}): ${slide.type}`);

            if (!quaggaApi) return;

            if (slide.type === 'result') {
                // 回答数を取得してキャッシュ＆注入
                try {
                    const counts = await quaggaApi.getAnswerCounts();
                    countCache.set(h, counts);
                    injectAnswerCounts(slide.element, counts);
                } catch (err) {
                    console.warn('[Quagga] 回答数取得失敗:', err.message);
                }
            } else if (slide.type === 'answer' || slide.type === 'caption') {
                // キャッシュがあれば再リクエストせず注入
                const counts = countCache.get(h);
                console.log(`[Quagga] cache for h=${h}:`, counts);
                if (counts) {
                    injectAnswerCounts(slide.element, counts);
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
                        console.warn('[Bonus] 再取得: 回答なし');
                        return;
                    }
                    if (replaceBonusSlides(group, ref.data, championAnswer)) {
                        console.log('[Bonus] チャンピオン回答を再読み込み');
                        controller.render();
                    }
                } catch (err) {
                    console.warn('[Bonus] 再取得失敗:', err.message);
                }
            });
        }

    } catch (error) {
        console.error('Failed to initialize:', error);
        container.innerHTML = `<div class="error">読み込みエラー: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
