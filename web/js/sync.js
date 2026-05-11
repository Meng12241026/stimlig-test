// 透過 Google Apps Script Web App 把發票同步到 Google Sheets。
//
// 為什麼選 Apps Script？因為使用者要求「不用登入」。
// 直接呼叫 Google Sheets API 需要 OAuth；Apps Script Web App 可以
// 部署成「Anyone」存取，PWA 端只需一條 URL 即可 POST 進 Sheet。
//
// 跨域眉角：Apps Script 不處理 OPTIONS 預檢，因此 POST 必須是
// "simple request"。把 body 當 string 丟，瀏覽器會帶
// Content-Type: text/plain（不會觸發預檢）。Apps Script 端再
// JSON.parse(e.postData.contents)。

import { getCategory } from './categories.js';

const URL_KEY = 'stimlig:sync-url';

export function getSyncURL() {
  return localStorage.getItem(URL_KEY) || '';
}

export function setSyncURL(url) {
  const trimmed = (url || '').trim();
  if (trimmed) localStorage.setItem(URL_KEY, trimmed);
  else localStorage.removeItem(URL_KEY);
}

export function isSyncConfigured() {
  return !!getSyncURL();
}

function isoDate(d) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().split('T')[0];
}

function buildPayload(invoice) {
  return {
    localId: invoice.id,
    date: isoDate(invoice.date),
    sellerName: invoice.sellerName || '',
    sellerTaxID: invoice.sellerTaxID || '',
    invoiceNumber: invoice.invoiceNumber || '',
    category: getCategory(invoice.category).name,
    totalAmount: Number(invoice.totalAmount) || 0,
    taxAmount: invoice.taxAmount != null ? Number(invoice.taxAmount) : '',
    items: (invoice.itemsDescription || '').replace(/\n/g, ' | '),
  };
}

/**
 * 把單張發票送到 Apps Script。回傳遠端 JSON 回應。
 * 注意：不設 Content-Type header，讓瀏覽器用 text/plain 避免預檢。
 */
export async function syncInvoice(invoice) {
  const url = getSyncURL();
  if (!url) throw new Error('尚未設定同步 URL');

  const body = JSON.stringify(buildPayload(invoice));
  const res = await fetch(url, {
    method: 'POST',
    body,
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`同步失敗 HTTP ${res.status}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, raw: text };
  }
}

/** 測試連線：送一筆假資料，由 Apps Script 自己決定要不要寫入。 */
export async function pingSync() {
  const url = getSyncURL();
  if (!url) throw new Error('尚未設定同步 URL');
  const body = JSON.stringify({
    ping: true,
    timestamp: new Date().toISOString(),
  });
  const res = await fetch(url, { method: 'POST', body, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
