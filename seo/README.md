# STIMLIG SEO & AI 搜尋規劃

stimlig.com（當代原創設計家具品牌）的 SEO、技術稽核、內容行銷與 AI 搜尋（GEO）整體規劃。
這個資料夾只包含**規劃與執行文件**，與本 repo 內的發票掃描程式無關。

## 文件結構

| 檔案 | 內容 |
| --- | --- |
| [`01-seo-strategy.md`](01-seo-strategy.md) | 傳統 SEO 策略：目標、關鍵字研究框架、競品、網站架構、On-page、內部連結 |
| [`02-technical-audit.md`](02-technical-audit.md) | 技術 SEO 稽核清單（WordPress/WooCommerce 具體項目、結構化資料、CWV、索引） |
| [`03-content-plan.md`](03-content-plan.md) | 內容行銷規劃：主題集群、購買漏斗、現有文章優化、內容行事曆 |
| [`04-ai-search-geo.md`](04-ai-search-geo.md) | AI 搜尋／GEO 優化：讓 ChatGPT、Perplexity、Google AI Overviews 正確理解並引用品牌 |

## 網站現況快照（2026-05，依公開搜尋結果整理）

- **平台**：WordPress + WooCommerce（`/shop/`、`/product-category/.../`、`/product-list/`）。
- **品牌**：2015 年創立，首件作品「巴雷扶手椅 Ballerina Armchair」為台灣首件群募破 200 萬的家具；
  主打「Design Direct（設計直賣）」模式；設計師來自台灣、法國、白俄羅斯。
- **主要產品線**：模組化沙發（島嶼沙發 Island Sofa、音符沙發 Note Sofa）、椅子（Boon Chair 小人物椅）、
  桌几（AMIS 茶几）、模組床墊（CLOUD 9）、長凳高腳椅等。
- **門市**：台北（德惠街 165 號）、台中、台南，提供 `/visiting/` 線上預約體驗。
- **既有內容資產**：`/story/` 為內容中心；已有「沙發挑選全指南」「實木桌挑選指南」「泡棉特性與維護」
  「居家佈置搭配技巧」等指南，及多篇品牌觀點／聯名故事（康橋慢旅、郭元益…）。

### 已觀察到的主要問題（需用後台 / GSC 驗證）

1. **內容 URL 扁平、缺主題集群**：文章用根目錄 slug（`/house-decoration-tip/`、`/amisdesign/`…），
   彼此與產品頁缺乏結構化內部連結，主題權重分散。
2. **結構化資料可能不足**：需確認 Product、Organization、LocalBusiness（3 間門市）、Article、
   BreadcrumbList、FAQ 等 schema 是否完整。
3. **bot 存取受限**：站台對非瀏覽器 UA 回 403（Cloudflare/防爬蟲），需確認未誤擋
   Googlebot / Bingbot / GPTBot / PerplexityBot（見 `04-ai-search-geo.md`）。

## 待補資料（你有 GSC / GA 與後台權限）

要把規劃從「方向」推進到「精準執行」，請提供或在文件中填入：

- **Google Search Console**：近 6–12 個月的「成效」匯出（查詢、頁面、點擊、曝光、CTR、排名）、
  「索引涵蓋範圍」報告、「Sitemap」狀態、「Core Web Vitals」報告。
- **GA4**：自然搜尋流量、到達頁、轉換（加入購物車／預約體驗／結帳）路徑。
- **後台**：目前使用的 SEO 外掛（Yoast / Rank Math / SEOPress？）、佈景主題、是否有快取／CDN。

## 建議推進順序

1. 先讀 `02-technical-audit.md`，跑完技術稽核並修正阻擋索引／速度的高優先項目（地基）。
2. 依 `01-seo-strategy.md` 確立關鍵字地圖與網站架構，盤點現有頁面對應。
3. 依 `03-content-plan.md` 優化既有指南並補主題集群，建立內部連結。
4. 依 `04-ai-search-geo.md` 強化品牌事實、結構化資料與第三方引用，提升 AI 搜尋可見度。
