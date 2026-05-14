/**
 * Quagga連携設定（サンプル）
 * このファイルをconfig.jsにコピーして使用してください
 */

export const config = {
  // アクセストークン
  token: 'quaggaAccess...',
  
  // イベントID
  eventId: '9999',
  
  // デバッグモード（trueでモックサーバーに接続、接続失敗時はサンプルデータを使用）
  debugMode: true,
  
  // 本番APIベースURL
  apiBase: 'https://quagga.studio/api/v1',

  // モックサーバーURL（debugMode: true のときに使用）
  mockApiBase: 'https://ranking-quagga.tiltpapa.workers.dev/api/v1',
  
  // ランキングにて一画面に収める人数
  countOneScreen: 10
};
