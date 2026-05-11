// 主控制器：tab 切換、掃描流程、列表 / 統計 / 匯出 各分頁的渲染。

import { CATEGORIES, getCategory } from './categories.js';
import { parseFull } from './parser.js';
import { classify } from './classifier.js';
import { recognize } from './ocr.js';
import { saveInvoice, getAllInvoices, deleteInvoice, updateSyncStatus } from './storage.js';
import {
  getSyncURL,
  setSyncURL,
  isSyncConfigured,
  syncInvoice,
  pingSync,
} from './sync.js';
import { formatAmount, formatDate, formatDateShort, toISODate } from './format.js';
import { drawDonut, colorFor } from './chart.js';
import { shareCSV, downloadCSV, mailInvoices } from './export.js';

const state = {
  invoices: [],
  range: 'month',
  editing: null, // 目前編輯中的 invoice
  cameraStream: null,
};

// 辨識前縮圖最大邊長。OCR 速度大致與像素數成正比，
// 4000×3000 的相片縮成 1600×1200 可省約 6 倍時間，準確度幾乎不變。
const MAX_OCR_DIMENSION = 1600;

// ---- 啟動 ----
init();

async function init() {
  registerServiceWorker();
  setupCategoryDropdown();
  setupTabBar();
  setupScanButton();
  setupModal();
  setupRangePicker();
  setupExportButtons();
  setupSyncSettings();
  await refresh();
  showTab('invoices');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(err => {
        console.warn('Service worker registration failed', err);
      });
    });
  }
}

function setupCategoryDropdown() {
  const select = document.getElementById('category-select');
  for (const cat of CATEGORIES) {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icon} ${cat.name}`;
    select.appendChild(opt);
  }
}

// ---- Tab bar ----
function setupTabBar() {
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
}

function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.hidden = p.dataset.tab !== name;
  });
  document.querySelectorAll('.tab-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  if (name === 'stats') renderStats();
  if (name === 'export') renderExport();
}

// ---- 掃描入口 ----
function setupScanButton() {
  document.getElementById('btn-scan').addEventListener('click', openScanModal);
  document.querySelectorAll('[data-action="scan"]').forEach(btn => {
    btn.addEventListener('click', openScanModal);
  });
}

function openScanModal() {
  state.editing = null;
  document.getElementById('modal-title').textContent = '掃描發票';
  showScanStart();
  document.getElementById('btn-delete').hidden = true;
  document.getElementById('modal-save').hidden = true;
  document.getElementById('scan-modal').hidden = false;
}

function setupModal() {
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', closeModal);
  });

  document.getElementById('btn-open-camera').addEventListener('click', startCamera);
  document.getElementById('btn-camera-cancel').addEventListener('click', () => {
    stopCamera();
    showScanStart();
  });
  document.getElementById('btn-camera-shutter').addEventListener('click', captureFrame);

  document.getElementById('gallery-input').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  });

  document.getElementById('modal-save').addEventListener('click', handleSave);
  document.getElementById('btn-delete').addEventListener('click', handleDelete);
}

function closeModal() {
  stopCamera();
  document.getElementById('scan-modal').hidden = true;
}

function hideAllScanPanels() {
  document.getElementById('scan-start').hidden = true;
  document.getElementById('scan-camera').hidden = true;
  document.getElementById('scan-processing').hidden = true;
  document.getElementById('invoice-form').hidden = true;
}

function showScanStart() {
  hideAllScanPanels();
  document.getElementById('scan-start').hidden = false;
}

function showCameraView() {
  hideAllScanPanels();
  document.getElementById('scan-camera').hidden = false;
}

function showProcessing() {
  hideAllScanPanels();
  document.getElementById('scan-processing').hidden = false;
  document.getElementById('ocr-status').textContent = '辨識中…';
  document.getElementById('ocr-progress').textContent = '';
}

function showForm() {
  hideAllScanPanels();
  document.getElementById('invoice-form').hidden = false;
  document.getElementById('modal-save').hidden = false;
}

// ---- 即時相機 ----
async function startCamera() {
  showCameraView();
  const video = document.getElementById('camera-video');
  const shutter = document.getElementById('btn-camera-shutter');
  shutter.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    await video.play();
    shutter.disabled = false;
  } catch (err) {
    console.error(err);
    stopCamera();
    showScanStart();
    alert('無法開啟相機：' + (err?.message || err) + '\n\n請改用「從相簿選取」。');
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
  const video = document.getElementById('camera-video');
  video.srcObject = null;
}

async function captureFrame() {
  const video = document.getElementById('camera-video');
  if (!video.videoWidth) return;
  const canvas = document.getElementById('camera-canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  );
  stopCamera();
  if (blob) handleImageFile(blob);
}

// 把圖片縮到最長邊 MAX_OCR_DIMENSION 以加快 OCR。
async function resizeForOCR(source) {
  const url = source instanceof Blob
    ? URL.createObjectURL(source)
    : source;
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= MAX_OCR_DIMENSION) return source;
    const scale = MAX_OCR_DIMENSION / longest;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
  } finally {
    if (source instanceof Blob && typeof url === 'string') {
      URL.revokeObjectURL(url);
    }
  }
}

// ---- 處理拍照 ----
async function handleImageFile(file) {
  showProcessing();
  const previewURL = URL.createObjectURL(file);
  const previewImg = document.getElementById('preview-image');
  previewImg.src = previewURL;
  previewImg.hidden = false;

  try {
    // 先縮小再丟給 OCR，速度大幅提升
    document.getElementById('ocr-status').textContent = '處理圖片中…';
    const resized = await resizeForOCR(file);

    const text = await recognize(resized, m => {
      const status = document.getElementById('ocr-status');
      const prog = document.getElementById('ocr-progress');
      if (m.status === 'recognizing text') {
        status.textContent = '辨識中…';
        prog.textContent = `${Math.round(m.progress * 100)}%`;
      } else if (m.status === 'loading language traineddata') {
        status.textContent = '首次使用，下載繁中模型…';
        prog.textContent = `${Math.round(m.progress * 100)}%`;
      } else if (m.status === 'initializing api' || m.status === 'initializing tesseract') {
        status.textContent = '初始化…';
      }
    });

    const parsed = parseFull(text);
    const category = classify(parsed.sellerName, parsed.items);

    const draft = {
      id: null,
      sellerName: parsed.sellerName,
      sellerTaxID: parsed.sellerTaxID,
      buyerTaxID: parsed.buyerTaxID,
      invoiceNumber: parsed.invoiceNumber,
      date: parsed.date || new Date(),
      totalAmount: parsed.totalAmount || 0,
      taxAmount: parsed.taxAmount,
      itemsDescription: parsed.items.join('\n'),
      category,
      rawText: parsed.rawText,
    };

    fillForm(draft);
    showForm();
  } catch (err) {
    console.error(err);
    alert('辨識失敗：' + (err?.message || err));
    showScanStart();
  }
}

// ---- 表單 ----
function fillForm(invoice) {
  state.editing = invoice;
  const form = document.getElementById('invoice-form');
  form.sellerName.value = invoice.sellerName || '';
  form.date.value = toISODate(invoice.date);
  form.totalAmount.value = invoice.totalAmount || 0;
  form.taxAmount.value = invoice.taxAmount ?? '';
  form.invoiceNumber.value = invoice.invoiceNumber || '';
  form.sellerTaxID.value = invoice.sellerTaxID || '';
  form.buyerTaxID.value = invoice.buyerTaxID || '';
  form.category.value = invoice.category || 'other';
  form.itemsDescription.value = invoice.itemsDescription || '';
  form.rawText.value = invoice.rawText || '';
  form.id.value = invoice.id || '';
}

function readForm() {
  const form = document.getElementById('invoice-form');
  return {
    id: form.id.value || null,
    sellerName: form.sellerName.value.trim(),
    date: new Date(form.date.value),
    totalAmount: parseFloat(form.totalAmount.value) || 0,
    taxAmount: form.taxAmount.value ? parseFloat(form.taxAmount.value) : null,
    invoiceNumber: form.invoiceNumber.value.trim() || null,
    sellerTaxID: form.sellerTaxID.value.trim() || null,
    buyerTaxID: form.buyerTaxID.value.trim() || null,
    category: form.category.value,
    itemsDescription: form.itemsDescription.value,
    rawText: form.rawText.value,
  };
}

async function handleSave() {
  const data = readForm();
  if (!data.sellerName) {
    alert('請填寫店家名稱');
    return;
  }
  const isNew = !data.id;
  const saved = await saveInvoice(data);
  closeModal();
  await refresh();
  toast('已儲存');
  // 新發票且使用者已設定同步 URL → 背景同步
  if (isNew && isSyncConfigured()) {
    syncOne(saved.id);
  }
}

async function syncOne(id) {
  const invoice = state.invoices.find(i => i.id === id);
  if (!invoice) return;
  try {
    await syncInvoice(invoice);
    await updateSyncStatus(id, 'synced');
  } catch (err) {
    console.warn('sync failed', err);
    await updateSyncStatus(id, 'failed', { error: String(err?.message || err) });
  }
  await refresh();
}

async function handleDelete() {
  if (!state.editing?.id) return;
  if (!confirm('確定要刪除這張發票？')) return;
  await deleteInvoice(state.editing.id);
  closeModal();
  await refresh();
  toast('已刪除');
}

function openEdit(invoice) {
  state.editing = invoice;
  document.getElementById('modal-title').textContent = '編輯發票';
  document.getElementById('preview-image').hidden = true;
  fillForm(invoice);
  showForm();
  document.getElementById('btn-delete').hidden = false;
  document.getElementById('scan-modal').hidden = false;
}

// ---- 重新載入並渲染 ----
async function refresh() {
  state.invoices = await getAllInvoices();
  renderList();
  // 統計與匯出分頁，下次切到時才渲染
  renderExport();
}

// ---- 發票列表 ----
function renderList() {
  const list = document.getElementById('invoice-list');
  const empty = document.getElementById('invoice-empty');
  list.innerHTML = '';

  if (state.invoices.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const showSync = isSyncConfigured();
  for (const inv of state.invoices) {
    const cat = getCategory(inv.category);
    const row = document.createElement('button');
    row.className = 'invoice-row';
    const dotHTML = showSync
      ? `<span class="sync-dot ${inv.syncStatus}" title="${syncStatusLabel(inv.syncStatus)}"></span>`
      : '';
    row.innerHTML = `
      <div class="invoice-icon">${cat.icon}</div>
      <div class="invoice-info">
        <div class="invoice-seller"></div>
        <div class="invoice-meta">${dotHTML}<span class="invoice-meta-text"></span></div>
      </div>
      <div class="invoice-amount"></div>
    `;
    row.querySelector('.invoice-seller').textContent =
      inv.sellerName || '（未命名店家）';
    row.querySelector('.invoice-meta-text').textContent =
      `${cat.name} · ${formatDateShort(inv.date)}`;
    row.querySelector('.invoice-amount').textContent =
      formatAmount(inv.totalAmount);
    row.addEventListener('click', () => openEdit(inv));
    list.appendChild(row);
  }
}

function syncStatusLabel(status) {
  switch (status) {
    case 'synced':   return '已同步';
    case 'failed':   return '同步失敗';
    case 'pending':  return '同步中';
    default:         return '未同步';
  }
}

// ---- 統計 ----
function setupRangePicker() {
  document.querySelectorAll('.range-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.range = btn.dataset.range;
      document.querySelectorAll('.range-option').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      renderStats();
    });
  });
}

function filteredInvoices() {
  const now = new Date();
  let cutoff = null;
  switch (state.range) {
    case 'week':  cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7); break;
    case 'month': cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 1); break;
    case 'year':  cutoff = new Date(now); cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    default: cutoff = null;
  }
  if (!cutoff) return state.invoices;
  return state.invoices.filter(inv => inv.date >= cutoff);
}

function renderStats() {
  const list = filteredInvoices();
  const total = list.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  document.getElementById('stats-total').textContent = formatAmount(total);
  document.getElementById('stats-count').textContent = `${list.length} 張發票`;

  // 按科目彙總
  const byCat = {};
  for (const inv of list) {
    byCat[inv.category] = (byCat[inv.category] || 0) + Number(inv.totalAmount || 0);
  }
  const sorted = Object.entries(byCat)
    .map(([id, value]) => ({ id, value, ...getCategory(id) }))
    .sort((a, b) => b.value - a.value);

  // 圓餅圖
  const canvas = document.getElementById('stats-chart');
  drawDonut(
    canvas,
    sorted.map((it, i) => ({
      label: it.name,
      value: it.value,
      color: colorFor(i),
    }))
  );

  // 明細
  const breakdown = document.getElementById('stats-breakdown');
  breakdown.innerHTML = '';
  if (sorted.length === 0) {
    const p = document.createElement('p');
    p.textContent = '尚無資料';
    p.style.textAlign = 'center';
    p.style.color = 'var(--text-secondary)';
    p.style.padding = '16px 0';
    breakdown.appendChild(p);
    return;
  }
  sorted.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <div class="breakdown-icon">${it.icon}</div>
      <div class="breakdown-label"></div>
      <div class="breakdown-amount"></div>
    `;
    row.querySelector('.breakdown-label').textContent = it.name;
    row.querySelector('.breakdown-amount').textContent = formatAmount(it.value);
    row.style.borderLeft = `3px solid ${colorFor(i)}`;
    row.style.paddingLeft = '8px';
    breakdown.appendChild(row);
  });
}

// ---- 雲端同步設定 ----
function setupSyncSettings() {
  const input = document.getElementById('sync-url-input');
  const status = document.getElementById('sync-status');
  input.value = getSyncURL();
  updateSyncStatusText();

  document.getElementById('btn-sync-save').addEventListener('click', () => {
    const url = input.value.trim();
    if (url && !/^https:\/\/script\.google\.com\/macros\//.test(url)) {
      setSyncStatus('看起來不像 Apps Script Web App URL，請確認', 'err');
      return;
    }
    setSyncURL(url);
    setSyncStatus(url ? '已儲存' : '已清除', 'ok');
    renderList();
    renderExport();
  });

  document.getElementById('btn-sync-test').addEventListener('click', async () => {
    setSyncURL(input.value.trim());
    if (!isSyncConfigured()) {
      setSyncStatus('請先填入網址', 'err');
      return;
    }
    setSyncStatus('測試中…', 'info');
    try {
      await pingSync();
      setSyncStatus('✅ 連線成功（Apps Script 收到了測試訊息）', 'ok');
    } catch (err) {
      setSyncStatus('❌ ' + (err?.message || err), 'err');
    }
  });

  document.getElementById('btn-sync-clear').addEventListener('click', () => {
    input.value = '';
    setSyncURL('');
    setSyncStatus('已清除', 'ok');
    renderList();
    renderExport();
  });

  document.getElementById('btn-sync-pending').addEventListener('click', syncAllPending);
}

function setSyncStatus(text, kind) {
  const el = document.getElementById('sync-status');
  el.textContent = text;
  el.className = 'sync-status ' + (kind || '');
}

function updateSyncStatusText() {
  if (!isSyncConfigured()) {
    setSyncStatus('尚未設定，新發票不會自動上傳', 'info');
  } else {
    setSyncStatus('已啟用：新發票會自動上傳到你的試算表', 'ok');
  }
}

async function syncAllPending() {
  const pending = state.invoices.filter(i => i.syncStatus !== 'synced');
  if (pending.length === 0) {
    toast('沒有待同步的發票');
    return;
  }
  setSyncStatus(`同步中… 0/${pending.length}`, 'info');
  let done = 0, failed = 0;
  for (const inv of pending) {
    try {
      await syncInvoice(inv);
      await updateSyncStatus(inv.id, 'synced');
    } catch (err) {
      failed++;
      await updateSyncStatus(inv.id, 'failed', { error: String(err?.message || err) });
    }
    done++;
    setSyncStatus(`同步中… ${done}/${pending.length}`, 'info');
  }
  await refresh();
  if (failed === 0) {
    setSyncStatus(`✅ 已全部同步（${done} 張）`, 'ok');
  } else {
    setSyncStatus(`完成 ${done - failed} 張，失敗 ${failed} 張`, 'err');
  }
}

// ---- 匯出 ----
function setupExportButtons() {
  document.getElementById('btn-share').addEventListener('click', async () => {
    if (state.invoices.length === 0) return;
    try {
      const ok = await shareCSV(state.invoices);
      if (!ok) {
        downloadCSV(state.invoices);
        toast('已下載 CSV（此瀏覽器不支援檔案分享）');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error(err);
        toast('分享失敗：' + (err?.message || err));
      }
    }
  });

  document.getElementById('btn-download').addEventListener('click', () => {
    if (state.invoices.length === 0) return;
    downloadCSV(state.invoices);
    toast('CSV 已下載');
  });

  document.getElementById('btn-mail').addEventListener('click', () => {
    if (state.invoices.length === 0) return;
    mailInvoices(state.invoices);
  });
}

function renderExport() {
  const total = state.invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  document.getElementById('export-count').textContent = state.invoices.length;
  document.getElementById('export-total').textContent = formatAmount(total);
  const disabled = state.invoices.length === 0;
  ['btn-share', 'btn-download', 'btn-mail'].forEach(id => {
    document.getElementById(id).disabled = disabled;
  });

  // 顯示待同步發票卡片
  const card = document.getElementById('btn-sync-pending');
  const pending = state.invoices.filter(i => i.syncStatus !== 'synced').length;
  if (isSyncConfigured() && pending > 0) {
    card.hidden = false;
    document.getElementById('sync-pending-count').textContent = `${pending} 張等待同步`;
  } else {
    card.hidden = true;
  }
}

// ---- Toast ----
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}
