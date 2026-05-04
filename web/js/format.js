// 共用格式化工具。

const numberFmt = new Intl.NumberFormat('zh-TW', {
  maximumFractionDigits: 0,
});

const numberFmtFraction = new Intl.NumberFormat('zh-TW', {
  maximumFractionDigits: 2,
});

const dateFmtLong = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateFmtShort = new Intl.DateTimeFormat('zh-TW', {
  month: '2-digit',
  day: '2-digit',
});

export function formatAmount(value) {
  return '$' + numberFmt.format(value || 0);
}

export function formatAmountPrecise(value) {
  return numberFmtFraction.format(value || 0);
}

export function formatDate(date) {
  return dateFmtLong.format(date);
}

export function formatDateShort(date) {
  return dateFmtShort.format(date);
}

export function toISODate(date) {
  // YYYY-MM-DD（給 <input type="date">）
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date - tz).toISOString().split('T')[0];
}
