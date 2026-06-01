# 02 · 技術 SEO 稽核清單

針對 WordPress + WooCommerce 的具體稽核項目。標註 `[需後台]` 或 `[需 GSC]` 者請用你的存取權確認，
其餘可用公開工具（PageSpeed Insights、Rich Results Test、Schema Markup Validator、Screaming Frog）檢測。

## 1. 索引與可被抓取

- [ ] **`robots.txt`** 未誤擋重要路徑；確認 `/wp-admin/` 擋、`/shop/`、`/product-category/` 不擋。
- [ ] **XML Sitemap** 存在且提交至 GSC（Yoast/Rank Math 自動產生）；含產品、分類、文章、頁面。`[需 GSC]`
- [ ] **索引涵蓋範圍**：檢查「已檢索但未編入索引 / 重複內容 / 已排除」頁面數與原因。`[需 GSC]`
- [ ] **403 / bot 阻擋**：站台對非瀏覽器 UA 回 403。**務必確認 Cloudflare／防火牆未誤擋
      Googlebot、Bingbot**（用 GSC「網址檢查 → 即時測試」驗證 Google 能抓取）。`[需 GSC]`
- [ ] **noindex 誤用**：確認沒有重要頁面被掛 `noindex`（標籤頁、作者頁、搜尋結果頁則應 noindex）。
- [ ] **WooCommerce 雜訊頁**：購物車 / 結帳 / 我的帳戶 應 `noindex`；篩選與排序參數頁用 canonical 收斂。

## 2. 重複內容與 Canonical

- [ ] 每頁有自我參照 canonical。
- [ ] 商品變體（顏色 / 材質）、分頁（`?page=2`）、篩選參數頁的 canonical 指向主頁。
- [ ] `www` vs 非 `www`、`http` vs `https` 已 301 統一到單一版本。
- [ ] 沒有同內容多 URL（trailing slash、大小寫）。

## 3. 結構化資料（Schema）— 重點

用 Google Rich Results Test 逐頁驗證。建議補齊：

- [ ] **Organization**（首頁）：品牌名、logo、`sameAs`（IG/FB/YouTube/LINE）、創立年份、品牌描述。
- [ ] **LocalBusiness / FurnitureStore**（每間門市一個）：台北、台中、台南的地址、電話、營業時間、地圖。
      → 同時對應 Google Business Profile（見第 7 節）。
- [ ] **Product**（每個商品）：名稱、圖片、描述、品牌、`offers`（價格、幣別、庫存）、`aggregateRating`（若有評價）。
- [ ] **BreadcrumbList**：分類與商品頁的麵包屑。
- [ ] **Article / BlogPosting**（指南與品牌觀點文）：標題、作者、發布/更新日期、圖片。
- [ ] **FAQPage**：產品頁與指南的常見問題區塊（同時利於 AI 搜尋，見 04）。

## 4. Core Web Vitals 與速度 `[需 GSC]`

- [ ] PageSpeed Insights 跑首頁、分類頁、熱門商品頁、指南頁，記錄 LCP / INP / CLS。
- [ ] **圖片**（家具站最大瓶頸）：轉 WebP/AVIF、加 `loading="lazy"`、設正確尺寸、用響應式 `srcset`。
- [ ] 啟用快取外掛（WP Rocket / LiteSpeed Cache）+ CDN（站台已疑似在 Cloudflare 後）。
- [ ] 移除未用的 plugin/CSS/JS；延遲非關鍵 JS。
- [ ] 字型用 `font-display: swap`，自架或預載關鍵字型。
- [ ] 確認 LCP 元素（通常是首屏主視覺）已預載且未被 lazy-load。

## 5. 行動裝置與可用性

- [ ] 行動版無破版、字級可讀、點擊目標夠大。
- [ ] 產品圖在手機可放大檢視。
- [ ] 預約體驗 / 加入購物車 等 CTA 在行動版明顯易按。

## 6. 國際化 / 語言 `[需後台]`

- [ ] 確認目標市場：若僅台灣 → `<html lang="zh-Hant">`，無需 hreflang。
- [ ] 若有英文版或外銷規劃 → 正確 `hreflang`（`zh-Hant-TW` / `en`）且雙向對應。

## 7. 在地 SEO（門市）

- [ ] 三間門市各自的 **Google Business Profile** 已認領、資訊一致（NAP：名稱/地址/電話）。
- [ ] 網站門市頁與 GBP 的 NAP 完全一致，並嵌入地圖。
- [ ] 鼓勵到店客戶留 Google 評論。

## 8. 安全與健康

- [ ] HTTPS 全站、無 mixed content。
- [ ] 404 頁友善並提供導流；舊網址若下架以 301 導到相近頁面。
- [ ] 定期用 GSC「移除」與「手動處分 / 安全性問題」確認無異常。`[需 GSC]`

## 稽核產出建議

跑完後在本檔末或新檔（`02-audit-findings.md`）記錄：問題、影響頁面、嚴重度（高/中/低）、負責人、狀態。
高優先 = 阻擋索引或拖慢全站者，先修。
