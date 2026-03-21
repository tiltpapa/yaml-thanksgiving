/**
 * スライドの2次元ナビゲーションを管理
 * Reveal.js互換の横方向・縦方向スライド構造
 */
export class SlideController {
    constructor(containerEl) {
        this.container = containerEl;
        // 2次元配列: slides[h][v] - 横方向インデックス h、縦方向インデックス v
        this.slides = [];
        this.indexH = 0; // 横方向インデックス
        this.indexV = 0; // 縦方向インデックス
        this.onSlideChange = null;
        
        this.bindEvents();
        this.initHashNavigation();
    }

    /**
     * スライドデータを2次元配列で設定
     * @param {Array<Array<Object>>} slides - slides[h][v]形式
     */
    setSlides(slides) {
        this.slides = slides;
        
        // URLハッシュから初期位置を取得、なければ(0,0)
        const { h, v } = this.parseHash();
        this.indexH = Math.min(h, this.slides.length - 1);
        this.indexV = Math.min(v, this.getVerticalLength() - 1);
        
        this.render();
    }

    /**
     * 現在の縦方向スライド数を取得
     */
    getVerticalLength() {
        if (this.slides.length === 0) return 0;
        return this.slides[this.indexH]?.length || 0;
    }

    /**
     * 現在のスライドを描画
     */
    render() {
        if (this.slides.length === 0) return;
        
        const slide = this.slides[this.indexH]?.[this.indexV];
        if (!slide) return;
        
        this.container.innerHTML = '';
        this.container.appendChild(slide.element);
        
        this.updateHash();
        
        if (this.onSlideChange) {
            this.onSlideChange(this.indexH, this.indexV, slide);
        }
    }

    /**
     * 右へ移動（次の横方向スライド）
     */
    right() {
        if (this.indexH < this.slides.length - 1) {
            this.indexH++;
            this.indexV = 0; // 縦方向は先頭にリセット
            this.render();
        }
    }

    /**
     * 左へ移動（前の横方向スライド）
     */
    left() {
        if (this.indexH > 0) {
            this.indexH--;
            this.indexV = 0; // 縦方向は先頭にリセット
            this.render();
        }
    }

    /**
     * 下へ移動（次の縦方向スライド）
     */
    down() {
        const vLength = this.getVerticalLength();
        if (this.indexV < vLength - 1) {
            this.indexV++;
            this.render();
        }
    }

    /**
     * 上へ移動（前の縦方向スライド）
     */
    up() {
        if (this.indexV > 0) {
            this.indexV--;
            this.render();
        }
    }

    /**
     * 次へ（Space/Enter用）- 縦優先で進む
     */
    next() {
        const vLength = this.getVerticalLength();
        if (this.indexV < vLength - 1) {
            this.down();
        } else if (this.indexH < this.slides.length - 1) {
            this.right();
        }
    }

    /**
     * 前へ（Backspace用）- 縦優先で戻る
     */
    prev() {
        if (this.indexV > 0) {
            this.up();
        } else if (this.indexH > 0) {
            this.indexH--;
            this.indexV = (this.slides[this.indexH]?.length || 1) - 1;
            this.render();
        }
    }

    /**
     * 指定位置へ移動
     */
    goTo(h, v = 0) {
        if (h >= 0 && h < this.slides.length) {
            this.indexH = h;
            const vLength = this.slides[h]?.length || 0;
            this.indexV = Math.min(Math.max(0, v), vLength - 1);
            this.render();
        }
    }

    /**
     * URLハッシュを更新
     */
    updateHash() {
        const hash = this.indexV === 0 
            ? `#/${this.indexH}` 
            : `#/${this.indexH}/${this.indexV}`;
        
        if (window.location.hash !== hash) {
            history.replaceState(null, '', hash);
        }
    }

    /**
     * URLハッシュをパース
     */
    parseHash() {
        const hash = window.location.hash.replace('#/', '');
        const parts = hash.split('/').map(Number);
        return {
            h: isNaN(parts[0]) ? 0 : parts[0],
            v: isNaN(parts[1]) ? 0 : parts[1]
        };
    }

    /**
     * ハッシュ変更時のナビゲーション初期化
     */
    initHashNavigation() {
        window.addEventListener('hashchange', () => {
            const { h, v } = this.parseHash();
            if (h !== this.indexH || v !== this.indexV) {
                this.goTo(h, v);
            }
        });
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    this.right();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.left();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.down();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.up();
                    break;
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.next();
                    break;
                case 'Backspace':
                    e.preventDefault();
                    this.prev();
                    break;
            }
        });
    }
}
