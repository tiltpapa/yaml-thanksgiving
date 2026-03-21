import { loadQuizYaml } from './yaml-loader.js';
import { renderQuestionSlide, renderAnswerSlide, renderTitleSlide } from './slide-renderer.js';
import { SlideController } from './slide-controller.js';

async function init() {
    const container = document.getElementById('current-slide');
    const controller = new SlideController(container);

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
            
            // 問題スライド
            if (question.selections) {
                verticalStack.push({
                    type: 'question',
                    data: question,
                    element: renderQuestionSlide(question)
                });

                // 回答スライド（縦方向に配置）
                if (question.answer) {
                    verticalStack.push({
                        type: 'answer',
                        data: question,
                        element: renderAnswerSlide(question)
                    });
                }
            }
            
            if (verticalStack.length > 0) {
                slides.push(verticalStack);
            }
        }

        controller.setSlides(slides);
        
        // デバッグ用
        controller.onSlideChange = (h, v, slide) => {
            const totalH = slides.length;
            const totalV = slides[h]?.length || 0;
            console.log(`Slide [${h}/${v}] (${h+1}/${totalH}, ${v+1}/${totalV}): ${slide.type}`);
        };

    } catch (error) {
        console.error('Failed to initialize:', error);
        container.innerHTML = `<div class="error">読み込みエラー: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
