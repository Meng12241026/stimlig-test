// 把發票輸出為 CSV，並提供分享 / 下載 / mailto 三種出口。

import { getCategory } from './categories.js';

function escape(field) {
  const s = String(field ?? '');
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function formatAmount(n) {
  if (n == null || n === '') return '';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function isoDate(d) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().split('T')[0];
}

export function makeCSV(invoices) {
  const header = ['日期', '店家', '賣方統編', '發票號碼', '會計科目', '金額', '稅額', '品項'];
  const rows = [header.map(escape).join(',')];
  const sorted = [...invoices].sort((a, b) => a.date - b.date);
  for (const inv of sorted) {
    const cat = getCategory(inv.category);
    const items = (inv.itemsDescription || '').replace(/\n/g, ' | ');
    rows.push([
      isoDate(inv.date),
      inv.sellerName,
      inv.sellerTaxID || '',
      inv.invoiceNumber || '',
      cat.name,
      formatAmount(inv.totalAmount),
      formatAmount(inv.taxAmount),
      items,
    ].map(escape).join(','));
  }
  return rows.join('\r\n');
}

// 加 UTF-8 BOM 讓 Excel / Numbers 開啟不亂碼。
export function csvBlob(invoices) {
  const csv = '﻿' + makeCSV(invoices);
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

export function csvFilename() {
  return `invoices-${isoDate(new Date())}.csv`;
}

// 用 Web Share API 帶檔案分享。iOS Safari 16+ 支援。
export async function shareCSV(invoices) {
  const blob = csvBlob(invoices);
  const filename = csvFilename();
  const file = new File([blob], filename, { type: 'text/csv' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: '發票 CSV',
      text: `${invoices.length} 張發票`,
    });
    return true;
  }
  return false;
}

// 觸發瀏覽器下載。
export function downloadCSV(invoices) {
  const blob = csvBlob(invoices);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = csvFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// 用 mailto: 開啟系統信件 App。注意：mailto 不能附檔，
// 因此會先觸發下載再開信件，使用者再手動拖入附件。
export function mailInvoices(invoices) {
  const total = invoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const subject = encodeURIComponent(`發票 CSV ${isoDate(new Date())}`);
  const body = encodeURIComponent(
    `共 ${invoices.length} 張發票，總金額 $${total.toLocaleString()}\n\n` +
    `（CSV 檔已下載至本機，請手動拖入此封信件作為附件。）`
  );
  downloadCSV(invoices);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
