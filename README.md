<!-- 本檔由 /sync-docs 自動生成，請勿手動編輯——手改內容下次會被覆蓋。 -->
# DesignVault

精選網頁設計作品展示 — 純靜態前端作品集，六個情境、27 個頁面，以原生 HTML、CSS 與 JavaScript 手工打造，無框架、無建置流程。

**線上瀏覽：** https://lingaoscar.github.io/Html-DesignVault/

![首頁畫面](docs/screenshot.png)

## 作品列表

| # | 品牌 | 類型 | 頁數 | 特色 |
|---|---|---|---|---|
| 01 | [MAISON NOIR](pages/fashion-ecommerce/) | 時尚電商 | 5 | 暖色調、黑白攝影調性、Nav Pills 分類篩選 |
| 02 | [NexusFlow Enterprise](pages/saas-dashboard/) | SaaS 管理儀表板 | 5 | 深色主題、固定側欄、純 CSS 圖表 |
| 03 | [AURÈLE](pages/boutique-brand/) | 精品品牌形象 | 5 | 極簡雜誌風、透明導覽列隨捲動變化 |
| 04 | [ORBITAL](pages/space-scifi/) | 太空主題飯店 | 5 | 等寬字體、SVG 房型插圖、訂房表單 |
| 05 | [Quill](pages/quill-landing/) | AI 寫作工具行銷頁 | 4 | 編輯器模擬畫面、定價方案、Accordion FAQ |
| 06 | [GLYPHWAVE](pages/glyphwave/) | 生成藝術工作室 | 3 | Three.js 場景即時轉譯為字元矩陣、即時參數實驗場 |

## 設計原則

- **品牌先行**：每件作品有獨立的色彩、字體與語氣，集中在各自 `custom.css` 的 CSS 變數。
- **輕量可維護**：Bootstrap 處理格線，自訂樣式只補足品牌所需；原始碼不壓縮、不打包。
- **完整可瀏覽**：每件作品含子頁、表單與互動狀態，手機到桌機皆完整響應。
- **一致的細節**：圖示一律為內嵌 SVG（`.ui-icon`），每頁左下角有返回首頁的 `.dv-back` 連結。

## 技術棧

- HTML5 / CSS3 / Vanilla JavaScript（無框架、無套件管理器）
- Bootstrap 5.3.3（CDN）
- Three.js 0.161（CDN，僅 GLYPHWAVE 使用）
- Google Fonts（各作品各自載入）
- 部署：GitHub Pages（`.github/workflows/deploy.yml`，推送到 `main` 自動部署）

## 快速開始

```bash
python3 -m http.server 8080
```

瀏覽 `http://localhost:8080` 即可看到首頁。完整開發說明見 [docs/dev.md](docs/dev.md)。

## 目錄結構

| 路徑 | 用途 |
|---|---|
| `index.html` | 作品集首頁（Hero、作品列表、設計理念、技術） |
| `css/style.css` | 首頁專用樣式 |
| `pages/<demo>/` | 各作品（`custom.css`、`index.html`、子頁與 `images/`） |
| `docs/` | 開發文件、設計 spec 與計畫 |
| `.github/workflows/` | GitHub Pages 部署 |
