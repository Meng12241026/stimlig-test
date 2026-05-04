# 發票掃描

兩個版本共用同一個 repo：

- **`web/` — PWA 版**（推薦：手機瀏覽器直接用，免安裝、免上架、免 Mac）
- **`StimligInvoice/` — iOS 原生版**（之後若取得 Mac 可用）

兩版都是「拍照 → OCR → 自動抽出店家 / 金額 / 品項 → 自動歸類到台灣會計科目 → CSV 匯出」。

---

## 🌐 PWA 版（手機可直接用）

### 用法

1. 用手機瀏覽器（建議 Safari / Chrome）打開部署網址（部署完後填入這裡）
2. iOS 點 **分享 → 加入主畫面**，之後就像原生 App
3. 第一次掃描時會下載繁中 OCR 模型（約 12 MB），之後完全離線

### 功能

- 📷 拍照或相簿選圖
- 🔍 **Tesseract.js** 在瀏覽器內離線跑 OCR（免 API key、繁中支援）
- 📊 自動辨識
  - 發票號碼（`AB-12345678` 格式）
  - 統一編號（賣方 / 買方）
  - 民國年 / 西元年日期
  - 總金額、稅額
  - 品項列表
- 🏷 自動歸到 19 個台灣常用會計科目（餐飲、交通、水電、通訊、進貨…），可手動修改
- 💾 IndexedDB 儲存，資料留在你手機本地
- 📈 統計頁：本週 / 本月 / 本年 / 全部，附科目圓餅圖
- 📤 匯出 CSV：
  - **分享 / 同步**：Web Share API 叫出 iOS 分享面板，可送到 Mail、Google Drive、Google Sheets、iCloud Drive、Files…
  - **下載**：直接存到「檔案」App
  - **Email**：開啟 Mail App 並先下載 CSV 供拖入附檔
  - 含 UTF-8 BOM，Excel / Numbers / Sheets 開啟不亂碼

### 部署到 GitHub Pages

1. GitHub repo → **Settings → Pages → Source = GitHub Actions**
2. push 到 `main`，`.github/workflows/pages.yml` 會自動部署 `web/` 目錄
3. 部署完網址會在 Actions 結果裡顯示

### 本地開發

PWA 需要 HTTPS 或 `localhost`。任意靜態伺服器都行：

```bash
cd web
python3 -m http.server 8080
# 開 http://localhost:8080
```

要在手機上測：可用 [ngrok](https://ngrok.com)、[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) 或部署到 GitHub Pages。

### 結構

```
web/
├── index.html              # 三分頁 + modal 殼
├── manifest.json           # PWA manifest
├── service-worker.js       # Cache-first，可離線啟動
├── css/styles.css          # iOS-like 樣式 + dark mode
├── icons/                  # SVG icon
└── js/
    ├── app.js              # 主控制器
    ├── categories.js       # 19 個會計科目
    ├── parser.js           # 台灣發票解析
    ├── classifier.js       # 自動分類規則
    ├── ocr.js              # Tesseract.js 包裝
    ├── storage.js          # IndexedDB
    ├── format.js           # 日期 / 金額格式化
    ├── chart.js            # 純 Canvas 圓餅圖
    └── export.js           # CSV + 分享 / 下載 / mailto
```

### 限制

- **OCR 準確度**：Tesseract.js 對印刷清楚的發票還行，熱感應紙模糊或反光會明顯變差。之後若取得 Claude API key，把 `web/js/ocr.js` 換成呼叫 Claude Vision 即可大幅提升。
- **Web Share API 帶檔**：iOS Safari 16+ 才支援。舊版會 fallback 成下載。
- **mailto 不能附檔**：HTML 標準限制，只能先下載 CSV 再開信件 App。

---

## 📱 iOS 原生版（需要 Mac）

SwiftUI + SwiftData 應用，使用 Apple Vision framework（OCR 比 Tesseract 準確）。

### 環境需求

- macOS + Xcode 15+
- iOS 17+ 裝置
- [XcodeGen](https://github.com/yonaskolb/XcodeGen)：`brew install xcodegen`

### 啟動

```bash
xcodegen generate
open StimligInvoice.xcodeproj
# 在 Xcode：Signing 選你的 Apple ID，接 iPhone，⌘R
```

> ⚠️ 免費 Apple ID 簽名的 App 每 7 天過期，要重新從 Xcode 安裝。要永久解決需 Apple Developer Program（$99 USD/年）。

### 結構

```
StimligInvoice/
├── StimligInvoiceApp.swift
├── Models/                   # Invoice + AccountingCategory
├── Services/                 # OCR / Parser / Classifier / CSVExporter
├── Persistence/              # SwiftData
└── Views/                    # SwiftUI Views
```

---

## 後續可加

- 接 Claude Vision API 大幅提升辨識率（替換 `ocr.js` / `InvoiceOCRService.swift`）
- 接 Google Sheets API（OAuth）直接寫入指定試算表
- 財政部雲端發票 QR Code 掃描
- 分類規則自定義 / 學習機制
