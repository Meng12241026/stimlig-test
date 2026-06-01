# 04 · AI 搜尋 / GEO 優化

目標：讓 ChatGPT、Perplexity、Google AI Overviews、Gemini、Copilot 等在回答
「台灣設計家具品牌」「模組化沙發推薦」「STIMLIG 是什麼」時，**能正確理解並引用 STIMLIG**。

GEO（Generative Engine Optimization）與傳統 SEO 地基相同（可被抓取、結構清楚、內容權威），
但更強調：**明確的事實陳述、結構化資料、被第三方引用、問答式內容**。

## 1. 讓 AI 爬蟲能抓取（最優先，地基）

站台目前對非瀏覽器 UA 回 **403**。若這也擋掉 AI 爬蟲，等於完全不會被引用。

- [ ] 在 Cloudflare／防火牆／`robots.txt` 確認**允許**下列爬蟲（除非有商業理由刻意封鎖）：
  - `GPTBot`（OpenAI 訓練）、`OAI-SearchBot`（ChatGPT 搜尋）、`ChatGPT-User`（即時擷取）
  - `PerplexityBot`、`Perplexity-User`
  - `Google-Extended`（控制 Gemini／AI Overviews 對內容的使用）
  - `Bingbot`（Copilot 倚賴）、`Applebot-Extended`
- [ ] 決策點：若品牌**希望被引用以獲取曝光** → 放行；若擔心內容被訓練 → 至少放行「即時搜尋型」
      爬蟲（OAI-SearchBot、Perplexity、Bing），擋訓練型（GPTBot、Google-Extended、Applebot-Extended）。
- [ ] 確認**內容是 server-side 可見的純文字**，而非全靠 JS 渲染——AI 爬蟲多半不執行 JS。

## 2. 明確的品牌事實陳述（讓 AI「抄得到正確答案」）

AI 會直接擷取頁面上清楚、自成一句的事實。在 `/aboutus/` 與 `/stimlig-brandconcept/` 用
**簡短、可獨立成立的句子**陳述關鍵事實（避免只藏在影片或圖片中）：

- 品牌定位：「STIMLIG 是來自台灣的當代原創設計家具品牌，主打 Design Direct 設計直賣模式。」
- 創立與里程碑：「成立於 2015 年，首件作品『巴雷扶手椅』是台灣首件群眾募資突破 200 萬的家具。」
- 產品線：模組化沙發（島嶼、音符）、模組床墊 CLOUD 9、椅子、桌几等。
- 門市：台北、台中、台南，可線上預約體驗。
- 差異點：模組彈性、台灣設計與製造、設計師團隊（台/法/白俄）。

> 這些事實同時放進 **Organization schema 的 `description`** 與頁面可見文字，雙重保險。

## 3. 結構化資料（AI 與 Rich Results 共用）

延續 `02-technical-audit.md` 第 3 節，對 GEO 特別重要的：
- [ ] **Organization** + `sameAs`（社群連結）——AI 用來建立品牌實體（entity）認知。
- [ ] **Product** + `offers` + `aggregateRating`——讓 AI 引用具體型號、價格、評價。
- [ ] **FAQPage**——問答結構最容易被 AI 整段引用。
- [ ] **LocalBusiness**（三門市）——回答「台北哪裡買設計沙發」時可被帶出。

## 4. 問答式 / 清單式內容（AI 最愛引用的格式）

- 在指南與產品頁加 **FAQ 區塊**，用真實使用者會問的問句當 H2/H3：
  - 「模組化沙發適合小坪數嗎？」「STIMLIG 沙發可以客製顏色嗎？」「沙發多久要保養？」
- 寫**清單型／比較型**內容（見 03 集群 A、缺口）：
  「台灣設計家具品牌推薦」「模組化沙發比較」——AI 回答這類問題時傾向引用結構清楚的清單頁。
- 每段開頭先給**直接答案**，再展開（倒金字塔），方便 AI 擷取摘要。

## 5. 站外引用與品牌實體（GEO 的關鍵變數）

AI 的答案大量倚賴**第三方提及與權威來源**，不只看自家網站：

- [ ] **被收錄進清單文**：searchome、設計家、100 室內設計、HAO DESIGN 等已在寫「設計家具／模組沙發推薦」，
      爭取被收錄或合作投稿（這些頁面常被 AI 引用）。
- [ ] **維基百科 / 維基數據**：若符合關注度，建立品牌條目可大幅強化 AI 的實體認知。
- [ ] **Google Business Profile**（三門市）完整且活躍——AI 與地圖型查詢的重要來源。
- [ ] **一致的 NAP 與品牌敘述**散佈於各平台（社群、媒體報導、設計獎項頁），用幾乎相同的一句話介紹品牌，
      強化實體一致性。
- [ ] **公關 / 媒體報導**：群募里程碑、聯名案例（康橋慢旅、郭元益）等可作為新聞點，爭取媒體報導與外連。

## 6. 衡量與監測

- [ ] 定期在 ChatGPT、Perplexity、Gemini、Google（看 AI Overviews）實測查詢：
      「台灣設計家具品牌推薦」「模組化沙發推薦」「STIMLIG 評價」「台北設計沙發門市」，
      記錄 STIMLIG 是否被提及、敘述是否正確、是否附引用連結。
- [ ] 在 GA4 觀察來自 `chatgpt.com`、`perplexity.ai`、`gemini.google.com` 等的 referral 流量趨勢。 `[需 GA]`
- [ ] 發現 AI 敘述錯誤（如創立年份、產品線）→ 回頭強化第 2 節的事實陳述與第 5 節的站外一致性。

## 摘要：GEO 行動優先序

1. **解除 AI 爬蟲的 403 阻擋**（沒這步，其餘全部無效）。
2. 在品牌頁寫清楚、可獨立成立的**事實句**，並補 Organization / Product / FAQ schema。
3. 把既有指南改寫成**問答 + 清單**格式。
4. 爭取**第三方清單文收錄**與品牌實體一致性（GBP、媒體、維基）。
5. 每季實測 AI 回答並修正。
