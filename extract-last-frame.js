#!/usr/bin/env node

/**
 * 動画ファイルの最終フレームを画像として抽出するスクリプト
 * 使い方: node extract-last-frame.js [動画ファイルのパス...]
 * 例: node extract-last-frame.js images/sample.mp4 images/sample2.mp4
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// コマンドライン引数から動画ファイルのパスを取得
const videoFiles = process.argv.slice(2);

if (videoFiles.length === 0) {
    console.log('使い方: node extract-last-frame.js [動画ファイルのパス...]');
    console.log('例: node extract-last-frame.js images/sample.mp4 images/sample2.mp4');
    console.log('');
    console.log('imagesフォルダ内の全mp4ファイルを処理する場合:');
    console.log('node extract-last-frame.js images/*.mp4');
    process.exit(1);
}

// ffmpegがインストールされているか確認
try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (error) {
    console.error('エラー: ffmpegがインストールされていません。');
    console.error('インストール方法:');
    console.error('  macOS: brew install ffmpeg');
    console.error('  Ubuntu/Debian: sudo apt-get install ffmpeg');
    console.error('  Windows: https://ffmpeg.org/download.html');
    process.exit(1);
}

console.log(`${videoFiles.length}個の動画ファイルを処理します...\n`);

let successCount = 0;
let errorCount = 0;

videoFiles.forEach((videoPath) => {
    // ファイルが存在するか確認
    if (!fs.existsSync(videoPath)) {
        console.error(`✗ エラー: ファイルが見つかりません: ${videoPath}`);
        errorCount++;
        return;
    }

    // 出力ファイル名を生成（拡張子を.pngに変更）
    const parsedPath = path.parse(videoPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.png`);

    try {
        console.log(`処理中: ${videoPath}`);
        
        // ffmpegで最終フレームを抽出
        // -sseof -1: 終了の1秒前から開始
        // -frames:v 1: 1フレームのみ抽出
        execSync(
            `ffmpeg -sseof -0.2 -i "${videoPath}" -update 1 -frames:v 1 "${outputPath}" -y`,
            { stdio: 'ignore' }
        );
        
        console.log(`✓ 完了: ${outputPath}\n`);
        successCount++;
    } catch (error) {
        console.error(`✗ エラー: ${videoPath} の処理に失敗しました`);
        console.error(`  ${error.message}\n`);
        errorCount++;
    }
});

console.log('='.repeat(50));
console.log(`処理完了: 成功 ${successCount}件, 失敗 ${errorCount}件`);
