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

### 自動同步到 Google Sheets（不用登入）

走 **Apps Script Web App** 路線：你建一個 Sheet + 一段 5 行的 Apps Script，PWA 用一條 URL 把每張發票 POST 過去，Apps Script 自動 append 到 Sheet。整個過程不用 OAuth、不用 API key。

**一次性設定**：

1. 新開一個 [Google Sheet](https://sheets.new)，取個名字（例如「發票紀錄」）
2. 上方選單 → **Extensions → Apps Script**
3. 把整段預設的 `function myFunction() { ... }` 刪掉，貼上：

   ```javascript
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const data = JSON.parse(e.postData.contents);

     if (data.ping) {
       return ContentService.createTextOutput(JSON.stringify({ok: true, ping: true}))
         .setMimeType(ContentService.MimeType.JSON);
     }

     if (sheet.getLastRow() === 0) {
       sheet.appendRow(['日期', '店家', '賣方統編', '發票號碼', '會計科目',
                        '金額', '稅額', '品項', '同步時間']);
     }

     sheet.appendRow([
       data.date, data.sellerName, data.sellerTaxID, data.invoiceNumber,
       data.category, data.totalAmount, data.taxAmount, data.items,
       new Date()
     ]);

     return ContentService.createTextOutput(JSON.stringify({ok: true}))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. 右上角 **Deploy → New deployment**
5. ⚙️ icon → **Web app**
6. 設定：
   - **Description**：隨意
   - **Execute as**：`Me`
   - **Who has access**：`Anyone` ← **重要**
7. **Deploy** → 第一次會跳授權，照流程點 `Advanced → Go to ... (unsafe) → Allow`（這個「unsafe」警告是因為你自己寫的腳本，給自己用沒問題）
8. 複製跳出來的 **Web app URL**，類似：
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

**接上 PWA**：

1. 在 App 裡切到「匯出」分頁
2. 把 URL 貼進「自動同步到 Google Sheets」欄位
3. 按 **儲存** → 再按 **測試連線**
4. 看到 ✅ 連線成功就 OK 了
5. 之後每張新發票存檔，會自動寫一列到你的 Sheet（每張卡片左下角綠點 = 已同步）

**眉角**：

- Apps Script Web App 的 URL 是「公開但不可猜」（網址裡的 `AKfycb...` 是唯一識別碼）。只要不外流，沒人寫得到你的 Sheet。要更安全的話可以在 Apps Script 加一個 `secret` 比對。
- 改 Apps Script 程式碼後要 **Manage deployments → Edit → Version: New version → Deploy**，否則 URL 還是跑舊版。
- 編輯舊發票後 **不會** 重新同步（會在 Sheet 變成新的一列重複）。所以建議：先在 PWA 確認資料 → 再存檔 → 才同步。
- 若 PWA 同步失敗（網路斷線、Apps Script 改版未部署等），那張卡片變紅點。到「匯出」分頁按「同步未同步的發票」即可重試。

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
