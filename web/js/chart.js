// 簡易 Canvas 圓餅圖（甜甜圈樣式）。
// 不依賴第三方圖表庫，輸入為 [{label, value, color}] 陣列。

const PALETTE = [
  '#0a84ff', '#ff9500', '#ff3b30', '#34c759', '#af52de',
  '#5ac8fa', '#ffcc00', '#ff2d55', '#5856d6', '#64d2ff',
  '#a2845e', '#bf5af2', '#30b0c7', '#ff6482', '#9656c8',
  '#3f9eff', '#ff8c40', '#7d8a99', '#a3a3a3',
];

export function drawDonut(canvas, items) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 300;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  if (items.length === 0) return;

  const total = items.reduce((s, it) => s + it.value, 0);
  if (total <= 0) return;

  const cx = cssW / 2;
  const cy = cssH / 2;
  const outerR = Math.min(cssW, cssH) / 2 - 8;
  const innerR = outerR * 0.55;

  let start = -Math.PI / 2;
  items.forEach((item, i) => {
    const angle = (item.value / total) * Math.PI * 2;
    const end = start + angle;
    ctx.fillStyle = item.color || PALETTE[i % PALETTE.length];
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(start) * innerR, cy + Math.sin(start) * innerR);
    ctx.arc(cx, cy, outerR, start, end);
    ctx.arc(cx, cy, innerR, end, start, true);
    ctx.closePath();
    ctx.fill();
    start = end;
  });
}

export function colorFor(index) {
  return PALETTE[index % PALETTE.length];
}
