// Tesseract.js OCR 包裝。使用繁體中文 + 英文模型。
// 模型檔約 12 MB，第一次會下載並快取在 IndexedDB（Tesseract.js 內部）。
// Tesseract 透過 <script> 從 CDN 載入，掛在 window.Tesseract 上。

let workerPromise = null;

function getWorker(onProgress) {
  if (!workerPromise) {
    workerPromise = window.Tesseract.createWorker(['chi_tra', 'eng'], 1, {
      logger: m => {
        if (onProgress) onProgress(m);
      },
    });
  }
  return workerPromise;
}

export async function recognize(imageSource, onProgress) {
  const worker = await getWorker(onProgress);
  const { data } = await worker.recognize(imageSource);
  return data.text;
}
