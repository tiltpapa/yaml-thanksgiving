/**
 * YAMLファイルを読み込んでパースする
 */
export async function loadQuizYaml(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    const text = await response.text();
    return parseQuizYaml(text);
}

/**
 * YAML文字列をパースしてクイズデータに変換
 */
export function parseQuizYaml(yamlText) {
    // ---で区切られたセクションを分割
    const sections = yamlText.split(/^---$/m).filter(s => s.trim());
    
    const result = {
        period: null,
        questions: [],
        settings: {}
    };

    for (const section of sections) {
        const parsed = jsyaml.load(section);
        if (!parsed) continue;

        if (parsed.period) {
            result.period = parsed.period;
        } else if (parsed.questions) {
            result.questions = normalizeQuestions(parsed.questions);
        } else if (parsed.settings !== undefined) {
            result.settings = parsed.settings || {};
        }
    }

    return result;
}

/**
 * 質問データを正規化
 */
function normalizeQuestions(questions) {
    return questions.map(q => {
        // Q: の下に配列で定義されている場合を処理
        const qData = q.Q || q;
        
        // 配列形式の場合はオブジェクトに変換
        if (Array.isArray(qData)) {
            const normalized = {};
            for (const item of qData) {
                if (typeof item === 'object') {
                    Object.assign(normalized, item);
                }
            }
            return normalized;
        }
        
        return qData;
    });
}
