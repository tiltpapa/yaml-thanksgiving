import { loadQuizYaml } from './yaml-loader.js';
import { renderQuestionSlide, renderAnswerSlide, renderTitleSlide } from './slide-renderer.js';
import { SlideController } from './slide-controller.js';

async function init() {
    const container = document.getElementById('current-slide');
    const controller = new SlideController(container);

    try {
        // YAMLを読み込み
        const quizData = await loadQuizYaml('quiz.yml');
        console.log('Loaded quiz data:', quizData);

        // スライドを生成
        const slides = [];
        
        for (const question of quizData.questions) {
            // タイトルスライド（titleがあれば）
            if (question.title && !question.layout) {
                slides.push({
                    type: 'title',
                    data: question,
                    element: renderTitleSlide(question)
                });
            }
            
            // 問題スライド
            if (question.selections) {
                slides.push({
                    type: 'question',
                    data: question,
                    element: renderQuestionSlide(question)
                });

                // 回答スライド
                if (question.answer) {
                    slides.push({
                        type: 'answer',
                        data: question,
                        element: renderAnswerSlide(question)
                    });
                }
            }
        }

        controller.setSlides(slides);
        
        // デバッグ用：スライド情報を表示
        controller.onSlideChange = (index, slide) => {
            console.log(`Slide ${index + 1}/${slides.length}: ${slide.type}`);
        };

    } catch (error) {
        console.error('Failed to initialize:', error);
        container.innerHTML = `<div class="error">読み込みエラー: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
