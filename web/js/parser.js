// 解析 Tesseract OCR 輸出的文字行，套用台灣統一發票規則抽出結構化欄位。
//
// 規則：
//   發票號碼  ：兩個英文字母 + 8 碼數字（可能有 - 或空白）
//   統一編號  ：8 碼數字（前後不接其他數字）
//   日期      ：民國年 (xxx/01/15) 或西元年 (2025/01/15)
//   金額      ：含「總計 / 合計 / 應付 / TOTAL」等關鍵字之列

const INVOICE_NUMBER_RE = /([A-Z]{2})[\s-]?(\d{8})/;
const TAX_ID_RE = /(?<![\d])(\d{8})(?![\d])/g;
const ROC_DATE_RE = /(\d{2,3})[/\-.年](\d{1,2})[/\-.月](\d{1,2})/;
const AD_DATE_RE = /(20\d{2})[/\-.年](\d{1,2})[/\-.月](\d{1,2})/;
const AMOUNT_RE = /([\d,]+(?:\.\d+)?)/g;

const TOTAL_KEYWORDS = ['總計', '合計', '應付', '應收', '總額', 'TOTAL', '金額'];
const TAX_KEYWORDS = ['稅額', '營業稅', 'TAX'];
const SELLER_KEYWORDS = ['賣方', '店家', '店名'];
const BUYER_KEYWORDS = ['買方', '客戶'];

export function parseInvoice(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  return {
    invoiceNumber: extractInvoiceNumber(lines),
    date: extractDate(lines),
    sellerTaxID: null,
    buyerTaxID: null,
    ...extractTaxIDs(lines),
    sellerName: '',
    totalAmount: extractAmount(lines, TOTAL_KEYWORDS) || 0,
    taxAmount: extractAmount(lines, TAX_KEYWORDS),
    items: extractItems(lines),
    rawText: lines.join('\n'),
  };
}

// 為了讓 sellerName 知道 taxID，包成兩階段。
export function parseFull(rawText) {
  const result = parseInvoice(rawText);
  const lines = result.rawText.split('\n');
  result.sellerName = extractSellerName(lines, result.sellerTaxID);
  return result;
}

function extractInvoiceNumber(lines) {
  for (const line of lines) {
    const m = line.match(INVOICE_NUMBER_RE);
    if (m) return `${m[1]}-${m[2]}`;
  }
  return null;
}

function extractDate(lines) {
  // 優先找西元年
  for (const line of lines) {
    const m = line.match(AD_DATE_RE);
    if (m) {
      const [, y, mo, d] = m;
      return new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
    }
  }
  // 再找民國年
  for (const line of lines) {
    const m = line.match(ROC_DATE_RE);
    if (m) {
      const rocYear = parseInt(m[1]);
      if (rocYear < 200) {
        return new Date(rocYear + 1911, parseInt(m[2]) - 1, parseInt(m[3]));
      }
    }
  }
  return null;
}

function extractTaxIDs(lines) {
  const found = []; // { line, id }
  for (const line of lines) {
    // 先把發票號碼那段（兩個字母 + 8 碼）從這行扣掉，避免它的 8 碼被誤當成統編。
    const stripped = line.replace(INVOICE_NUMBER_RE, '');
    const matches = [...stripped.matchAll(TAX_ID_RE)];
    for (const m of matches) {
      found.push({ line, id: m[1] });
    }
  }

  let seller = null;
  let buyer = null;
  for (const { line, id } of found) {
    const isTotalLine = TOTAL_KEYWORDS.some(k => line.includes(k));
    if (isTotalLine) continue;
    if (BUYER_KEYWORDS.some(k => line.includes(k))) buyer = id;
    else if (SELLER_KEYWORDS.some(k => line.includes(k))) seller = id;
  }

  // fallback：去重後第一個當賣方、第二個當買方
  const unique = [...new Set(found.map(f => f.id))];
  if (!seller) seller = unique[0] ?? null;
  if (!buyer && unique.length > 1) buyer = unique[1];

  return { sellerTaxID: seller, buyerTaxID: buyer };
}

function extractAmount(lines, keywords) {
  const candidates = [];
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (!keywords.some(k => upper.includes(k.toUpperCase()))) continue;
    const matches = [...line.matchAll(AMOUNT_RE)];
    for (const m of matches) {
      const cleaned = m[1].replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num)) candidates.push(num);
    }
  }
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

function extractSellerName(lines, sellerTaxID) {
  const noiseKeywords = [
    '電子發票', '發票證明聯', '統一發票', '統一編號', '統編',
    '電話', 'TEL', '地址', 'ADDRESS', '收銀', '機號', '日期',
  ];
  const isChinese = (s) => /[一-鿿]/.test(s);

  // 1. 有「賣方/店名」關鍵字的同一行（去掉冒號等標點還剩東西）
  for (const line of lines) {
    for (const kw of SELLER_KEYWORDS) {
      if (line.includes(kw)) {
        const cleaned = line
          .replace(kw, '')
          .replace(/[:：]/g, '')
          .trim();
        if (cleaned.length >= 2) return cleaned;
      }
    }
  }

  // 2. 第一行含中文且不是雜訊（通常店名抬頭就在最上方）
  for (const line of lines) {
    if (!isChinese(line)) continue;
    if (noiseKeywords.some(k => line.includes(k))) continue;
    if (AD_DATE_RE.test(line) || ROC_DATE_RE.test(line)) continue;
    if (INVOICE_NUMBER_RE.test(line)) continue;
    // 排除純數字/夾雜少量中文的行
    const chineseChars = (line.match(/[一-鿿]/g) || []).length;
    if (chineseChars < 2) continue;
    return line;
  }

  // 3. fallback：賣方統編所在行去掉統編與標籤
  if (sellerTaxID) {
    const line = lines.find(l => l.includes(sellerTaxID));
    if (line) {
      const cleaned = line
        .replace(sellerTaxID, '')
        .replace(/統一編號|統編/g, '')
        .replace(/[:：]/g, '')
        .trim();
      if (cleaned.length >= 2) return cleaned;
    }
  }

  return lines[0] || '';
}

function extractItems(lines) {
  const exclude = ['發票', '統一編號', '統編', '電話', 'TEL', '地址', 'ADDRESS'];
  return lines.filter(line => {
    // 跳過日期行
    if (AD_DATE_RE.test(line) || ROC_DATE_RE.test(line)) return false;
    // 跳過發票號碼行
    if (INVOICE_NUMBER_RE.test(line)) return false;
    // 必須含金額
    const hasAmount = /\d/.test(line) && /[\d,]+(?:\.\d+)?/.test(line);
    if (!hasAmount) return false;
    if (TOTAL_KEYWORDS.some(k => line.includes(k))) return false;
    if (TAX_KEYWORDS.some(k => line.includes(k))) return false;
    if (exclude.some(k => line.includes(k))) return false;
    // 排除單純就是 8 碼統編的行
    const digitsOnly = line.replace(/\D/g, '');
    const nonDigit = line.replace(/[\d\s]/g, '');
    if (digitsOnly.length === 8 && !nonDigit) return false;
    return true;
  });
}
