// 台灣中小企業常用 19 個會計科目。
export const CATEGORIES = [
  { id: 'meals',          name: '餐飲費',     icon: '🍱' },
  { id: 'transportation', name: '交通費',     icon: '🚆' },
  { id: 'officeSupplies', name: '文具用品',   icon: '✏️' },
  { id: 'utilities',      name: '水電瓦斯',   icon: '⚡' },
  { id: 'communication',  name: '通訊費',     icon: '📞' },
  { id: 'purchases',      name: '進貨',       icon: '📦' },
  { id: 'rent',           name: '租金支出',   icon: '🏠' },
  { id: 'repairs',        name: '修繕費',     icon: '🔧' },
  { id: 'advertising',    name: '廣告費',     icon: '📣' },
  { id: 'medical',        name: '醫療保健',   icon: '🏥' },
  { id: 'clothing',       name: '服飾',       icon: '👕' },
  { id: 'entertainment',  name: '交際應酬',   icon: '🍷' },
  { id: 'education',      name: '教育訓練',   icon: '🎓' },
  { id: 'travel',         name: '旅運費',     icon: '✈️' },
  { id: 'fuel',           name: '油料費',     icon: '⛽' },
  { id: 'insurance',      name: '保險費',     icon: '🛡️' },
  { id: 'software',       name: '軟體訂閱',   icon: '📱' },
  { id: 'books',          name: '書報雜誌',   icon: '📚' },
  { id: 'other',          name: '其他',       icon: '📥' },
];

const BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export function getCategory(id) {
  return BY_ID[id] || BY_ID.other;
}
