# 發票掃描 (StimligInvoice)

iOS App，用相機掃描台灣發票，自動辨識**店家、金額、品項**並歸類到常用會計科目，可一鍵匯出 CSV 寄到 Email 或同步到雲端試算表。

## 主要功能

- **相機 / 相簿掃描**：拍照後使用 Apple Vision framework 進行離線 OCR（繁體中文支援）。
- **欄位自動抽取**：依台灣統一發票常見格式抽出
  - 發票號碼（如 `AB-12345678`）
  - 統一編號（賣方 / 買方）
  - 開立日期（民國年 / 西元年）
  - 總金額、稅額
  - 品項列表
- **自動歸類**：依店家與品項關鍵字，分到台灣中小企業常用 19 個會計科目（餐飲費、交通費、水電瓦斯、通訊費、進貨…）。可手動修改。
- **統計**：本週 / 本月 / 本年 / 全部支出，附科目圓餅圖與明細。
- **匯出**：
  - **Email**：用 iOS 內建 Mail，自動帶 CSV 附檔
  - **同步雲端**：透過 iOS 分享面板送到 iCloud Drive、Google Drive、Numbers、Google Sheets…
  - CSV 檔含 UTF-8 BOM，Excel / Numbers / Google Sheets 直接打開都不會亂碼

## 技術棧

| 用途 | 選擇 |
|---|---|
| UI | SwiftUI |
| 儲存 | SwiftData |
| OCR | Vision framework（離線、免費） |
| 圖表 | Swift Charts |
| 寄信 | MessageUI（MFMailComposeViewController） |
| 分享 | UIActivityViewController |
| 最低 iOS | 17.0 |

> 之後若要把 OCR 換成 Claude Vision API（更強的結構化抽取），只需要替換 `Services/InvoiceOCRService.swift` 的 `recognize(image:)` 實作。

## 開發環境設定

需要 macOS + Xcode 15 以上。專案使用 [XcodeGen](https://github.com/yonaskolb/XcodeGen) 從 `project.yml` 生成 `.xcodeproj`，避免把易衝突的 Xcode 專案檔提交進 git。

```bash
# 1. 安裝 XcodeGen（一次即可）
brew install xcodegen

# 2. 生成 Xcode 專案
xcodegen generate

# 3. 開啟
open StimligInvoice.xcodeproj
```

在 Xcode 中：
1. 在 `Signing & Capabilities` 選擇你的 Apple ID 個人開發團隊
2. 接上 iPhone 或選擇模擬器（注意：模擬器沒有相機，需要實機才能測拍照）
3. ⌘R 執行

## 專案結構

```
StimligInvoice/
├── StimligInvoiceApp.swift          # App 入口
├── Models/
│   ├── Invoice.swift                # SwiftData @Model
│   └── AccountingCategory.swift     # 19 個台灣常用會計科目
├── Services/
│   ├── InvoiceOCRService.swift      # Vision OCR
│   ├── TaiwanInvoiceParser.swift    # 解析台灣發票格式
│   ├── CategoryClassifier.swift     # 自動分類規則
│   ├── InvoiceProcessingService.swift # OCR + 解析 + 分類整合
│   └── CSVExporter.swift            # CSV 輸出
├── Persistence/
│   └── DataController.swift         # ModelContainer
├── Views/
│   ├── RootView.swift               # 三分頁 TabView
│   ├── InvoiceListView.swift        # 發票列表
│   ├── ScanFlowView.swift           # 掃描流程
│   ├── InvoiceEditorView.swift      # 欄位編輯
│   ├── StatsView.swift              # 統計 + 圖表
│   ├── ExportView.swift             # 匯出按鈕
│   ├── ImagePicker.swift            # UIImagePickerController 包裝
│   └── MailComposer.swift           # MFMailComposeVC + ShareSheet
└── Resources/
    └── Info.plist
```

## 使用流程

1. 開啟 App → 「發票」分頁右上角的 **+** → 開啟相機
2. 拍下發票（盡量正、清晰、避免反光）
3. 等 OCR 跑完（通常 1–2 秒），確認 / 修改自動填好的欄位 → 儲存
4. 「統計」分頁查看支出分佈
5. 「匯出」分頁：
   - **寄到 Email** → 系統 Mail 開啟並帶好 CSV 附檔
   - **同步到雲端 / 試算表** → 選 Google Sheets / iCloud Drive / Numbers / Files…

## 後續可擴充

- [ ] 接 Claude Vision API：辨識準確度更高、可直接吐結構化 JSON
- [ ] 接 Google Sheets API（OAuth）：直接寫入指定試算表，不用手動匯入
- [ ] 雲端發票條碼掃描（QR code）：直接從財政部 API 拉資料
- [ ] 分類規則使用者自定義 / 學習機制
- [ ] 多幣別、外幣支出
