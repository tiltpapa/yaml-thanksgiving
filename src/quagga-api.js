/**
 * Quagga API クライアント
 * データ取得ロジックのみを担当。UIには一切触れない。
 *
 * ベースURL: https://quagga.studio/api/v1
 * 認証: Authorization: Bearer <token>
 */

const API_BASE = 'https://quagga.studio/api/v1';

/**
 * モックデータ（debugMode: true のとき使用）
 */
const MOCK = {
  lastAggregate: {
    question: {
      id: 'mock-question-1',
      period: 1,
      description: 'テスト問題',
      q_format: 'alternative',
      answer: '1',
      choice_number: 4,
      answer_number: 1,
    },
    answers: [
      { id: 1, answer: '1', correct: true,  point: 3, time: '3.21', member: { id: 1, admin: false, user: { id: 1, name: 'Alice',   name_gana: 'ありす'   } } },
      { id: 2, answer: '2', correct: false, point: 0, time: '5.10', member: { id: 2, admin: false, user: { id: 2, name: 'Bob',     name_gana: 'ぼぶ'     } } },
      { id: 3, answer: '1', correct: true,  point: 3, time: '4.55', member: { id: 3, admin: false, user: { id: 3, name: 'Charlie', name_gana: 'ちゃーりー' } } },
      { id: 4, answer: '3', correct: false, point: 0, time: '6.00', member: { id: 4, admin: false, user: { id: 4, name: 'Diana',   name_gana: 'だいあな'  } } },
      { id: 5, answer: '1', correct: true,  point: 3, time: '2.88', member: { id: 5, admin: false, user: { id: 5, name: 'Eve',     name_gana: 'いぶ'     } } },
    ],
  },
  periodResult: {
    results: [
      { rank: 1, point: 9,  time: '10.64', money: '0.0', member: { id: 5, admin: false, user: { id: 5, name: 'Eve',     name_gana: 'いぶ'     } } },
      { rank: 2, point: 6,  time: '7.76',  money: '0.0', member: { id: 1, admin: false, user: { id: 1, name: 'Alice',   name_gana: 'ありす'   } } },
      { rank: 3, point: 6,  time: '9.21',  money: '0.0', member: { id: 3, admin: false, user: { id: 3, name: 'Charlie', name_gana: 'ちゃーりー' } } },
      { rank: 4, point: 0,  time: '11.10', money: '0.0', member: { id: 2, admin: false, user: { id: 2, name: 'Bob',     name_gana: 'ぼぶ'     } } },
      { rank: 5, point: 0,  time: '6.00',  money: '0.0', member: { id: 4, admin: false, user: { id: 4, name: 'Diana',   name_gana: 'だいあな'  } } },
    ],
  },
  totalResult: {
    results: [
      { rank: 1, point: 18, time: '21.30', money: '0.0', member: { id: 5, admin: false, user: { id: 5, name: 'Eve',     name_gana: 'いぶ'     } } },
      { rank: 2, point: 15, time: '18.44', money: '0.0', member: { id: 1, admin: false, user: { id: 1, name: 'Alice',   name_gana: 'ありす'   } } },
      { rank: 3, point: 12, time: '22.10', money: '0.0', member: { id: 3, admin: false, user: { id: 3, name: 'Charlie', name_gana: 'ちゃーりー' } } },
      { rank: 4, point: 6,  time: '30.00', money: '0.0', member: { id: 2, admin: false, user: { id: 2, name: 'Bob',     name_gana: 'ぼぶ'     } } },
      { rank: 5, point: 3,  time: '25.50', money: '0.0', member: { id: 4, admin: false, user: { id: 4, name: 'Diana',   name_gana: 'だいあな'  } } },
    ],
  },
};

export class QuaggaApiClient {
  /**
   * @param {{ token: string, eventId: string, debugMode?: boolean, apiBase?: string }} config
   */
  constructor(config) {
    this.token       = config.token;
    this.eventId     = config.eventId;
    this.debug       = config.debugMode ?? false;
    this.base        = config.apiBase ?? API_BASE;
    this.mockBase    = config.mockApiBase ?? null;
  }

  /** 共通フェッチ */
  async _fetch(path) {
    if (this.debug) {
      // debugMode: モックサーバーに接続し、失敗したらサンプルデータにフォールバック
      const mockUrl = `${this.mockBase ?? this.base}${path}`;
      try {
        console.log(`[QuaggaAPI] debug fetch: ${mockUrl}`);
        const res = await fetch(mockUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (err) {
        console.warn(`[QuaggaAPI] モックサーバー接続失敗、サンプルデータを使用: ${err.message}`);
        return this._fallbackResponse(path);
      }
    }

    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!res.ok) {
      throw new Error(`Quagga API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /** サンプルデータ（モックサーバー接続失敗時のフォールバック） */
  _fallbackResponse(path) {
    if (path.includes('last_aggregate')) return Promise.resolve(MOCK.lastAggregate);
    if (path.includes('result/period'))  return Promise.resolve(MOCK.periodResult);
    if (path.includes('result/total'))   return Promise.resolve(MOCK.totalResult);
    return Promise.reject(new Error(`No fallback for: ${path}`));
  }

  /**
   * 直近集計された問題の回答一覧を取得
   * @returns {{ question: object, answers: object[] }}
   */
  async getLastAggregate() {
    return this._fetch(`/programs/${this.eventId}/questions/last_aggregate`);
  }

  /**
   * 選択肢ごとの回答数を集計して返す
   * @returns {{ [choiceKey: string]: number }} 例: { "1": 3, "2": 1, "3": 1 }
   */
  async getAnswerCounts() {
    const data = await this.getLastAggregate();
    const counts = {};
    const choiceNum = data.question?.choice_number ?? 0;

    // 選択肢キーを初期化
    for (let i = 1; i <= choiceNum; i++) {
      counts[String(i)] = 0;
    }

    for (const a of data.answers ?? []) {
      const key = String(a.answer);
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }

  /**
   * 特定ピリオドの成績を取得
   * @param {number|string} [period] 省略時は直近
   * @returns {{ results: object[] }}
   */
  async getPeriodResult(period) {
    const query = period != null ? `?period=${period}` : '';
    return this._fetch(`/programs/${this.eventId}/result/period${query}`);
  }

  /**
   * 暫定総合成績を取得
   * @returns {{ results: object[] }}
   */
  async getTotalResult() {
    return this._fetch(`/programs/${this.eventId}/result/total`);
  }

  /**
   * チャンピオン情報を取得
   * @param {number|string} period  数値 or "last_aggregate"
   * @returns {{ champion: object|null }}
   */
  async getChampion(period = 'last_aggregate') {
    return this._fetch(`/programs/${this.eventId}/periods/${period}/champion`);
  }
}
