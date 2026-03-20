/**
 * スライドの遷移・操作を管理
 */
export class SlideController {
    constructor(containerEl) {
        this.container = containerEl;
        this.slides = [];
        this.currentIndex = 0;
        this.onSlideChange = null;
        
        this.bindEvents();
    }

    /**
     * スライドデータを設定
     */
    setSlides(slides) {
        this.slides = slides;
        this.currentIndex = 0;
        this.render();
    }

    /**
     * 現在のスライドを描画
     */
    render() {
        if (this.slides.length === 0) return;
        
        const slide = this.slides[this.currentIndex];
        this.container.innerHTML = '';
        this.container.appendChild(slide.element);
        
        if (this.onSlideChange) {
            this.onSlideChange(this.currentIndex, slide);
        }
    }

    /**
     * 次のスライドへ
     */
    next() {
        if (this.currentIndex < this.slides.length - 1) {
            this.currentIndex++;
            this.render();
        }
    }

    /**
     * 前のスライドへ
     */
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.render();
        }
    }

    /**
     * 指定インデックスへ移動
     */
    goTo(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentIndex = index;
            this.render();
        }
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.next();
                    break;
                case 'ArrowLeft':
                case 'Backspace':
                    e.preventDefault();
                    this.prev();
                    break;
            }
        });

        // クリックで次へ
        this.container.addEventListener('click', () => {
            this.next();
        });
    }
}
