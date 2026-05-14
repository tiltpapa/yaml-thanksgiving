#!/usr/bin/env node
/**
 * ローカルプロキシサーバー
 *
 * quagga.studio はブラウザからの直接アクセスを CORS でブロックするため、
 * このプロキシ経由でリクエストを転送する。
 *
 * 起動: node proxy.js
 * デフォルトポート: 3001
 *
 * ブラウザからは http://localhost:3001/api/v1/... にアクセスすると
 * https://quagga.studio/api/v1/... に転送される。
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const PROXY_PORT   = process.env.PROXY_PORT   ?? 3001;
const TARGET_ORIGIN = process.env.TARGET_ORIGIN ?? 'https://quagga.studio';

const server = http.createServer((req, res) => {
  // CORS ヘッダー（ローカル開発用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const targetUrl = new URL(req.url, TARGET_ORIGIN);
  const isHttps   = targetUrl.protocol === 'https:';
  const transport = isHttps ? https : http;

  const options = {
    hostname: targetUrl.hostname,
    port:     targetUrl.port || (isHttps ? 443 : 80),
    path:     targetUrl.pathname + targetUrl.search,
    method:   req.method,
    headers: {
      ...req.headers,
      host: targetUrl.hostname, // ホストヘッダーを転送先に書き換え
    },
  };

  console.log(`[proxy] ${req.method} ${req.url} → ${targetUrl.href}`);

  const proxyReq = transport.request(options, (proxyRes) => {
    // レスポンスヘッダーをそのまま転送（CORS ヘッダーは上書き済み）
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[proxy] エラー: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`✅ プロキシサーバー起動: http://localhost:${PROXY_PORT}`);
  console.log(`   転送先: ${TARGET_ORIGIN}`);
  console.log(`   停止: Ctrl+C`);
});
