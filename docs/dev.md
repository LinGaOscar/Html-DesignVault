# 開發文件（dev.md）
> 本檔由 /sync-docs 自動生成，請勿手動編輯——手改內容下次會被覆蓋。

## 環境需求

- 無 `package.json`、無 lock file，不需安裝任何套件
- 只需一個靜態檔案伺服器（Python 3 或 Node `npx serve` 擇一）

## 快速啟動

```bash
python3 -m http.server 8080
# 或
npx serve .
```

瀏覽 `http://localhost:8080` 看首頁，或直接進單一 Demo：

- `http://localhost:8080/pages/fashion-ecommerce/`
- `http://localhost:8080/pages/saas-dashboard/`
- `http://localhost:8080/pages/boutique-brand/`
- `http://localhost:8080/pages/space-scifi/`
- `http://localhost:8080/pages/quill-landing/`
- `http://localhost:8080/pages/glyphwave/`

建議用本地伺服器而非雙擊開檔：「下載模板」功能由 `js/main.js` 以 `fetch` 抓取各 Demo 檔案，`file://` 下會失敗。

## 測試

無自動化測試。修改後手動在瀏覽器檢查對應頁面（含手機寬度）。

## 部署

push 到 `main` 會觸發 `.github/workflows/deploy.yml`，以 `actions/deploy-pages` 自動部署到 GitHub Pages。

## 修改時的提醒

- 改 `css/style.css` 或 `js/main.js` 後，同步更新 `index.html` 內對應的 `?v=` 版本字串（cache busting）。
- 各 Demo 的品牌色彩／間距集中在該 Demo 的 `custom.css` `:root`，優先改變數。
- 更完整的架構與慣例見 `CLAUDE.md`。
