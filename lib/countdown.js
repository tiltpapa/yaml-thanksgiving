/**
 * カウントダウンタイマー管理
 * スライド要素内の .countdown-timer を対象に動作する
 */
export class CountdownTimer {
    constructor() {
        this._intervalId = null;
    }

    /**
     * 指定スライド要素のタイマーを開始
     * @param {HTMLElement} slideEl - .quiz クラスを持つスライド要素
     */
    start(slideEl) {
        this.stop();

        const timerEl = slideEl.querySelector('.countdown-timer');
        if (!timerEl) return;

        const limit = parseInt(timerEl.dataset.limit, 10);
        if (isNaN(limit) || limit <= 0) return;

        let time = limit;
        timerEl.textContent = time;
        timerEl.classList.remove('timer-warning');

        this._intervalId = setInterval(() => {
            time--;
            if (time < 0) time = 0;

            timerEl.textContent = time;

            if (time <= 3) {
                timerEl.classList.remove('timer-warning');
                void timerEl.offsetWidth; // リフロー強制でアニメーションリセット
                timerEl.classList.add('timer-warning');
            }

            if (time <= 0) {
                this.stop();
                setTimeout(() => timerEl.classList.remove('timer-warning'), 1000);
            }
        }, 1000);
    }

    /**
     * タイマーを停止
     */
    stop() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }
}
