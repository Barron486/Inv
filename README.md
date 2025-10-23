# 發票辨識與彙整系統

功能：
- 上傳發票（相機/圖庫）、自動辨識金額（Google Cloud Vision）
- 電子發票開放資料查詢（依日期、買方統編，含月份與近 30 天快捷）
- 自動最佳化排版於 A4 橫式，頁面合計與頁碼
- 一鍵產生 PDF 與報告總覽
- （可選，預設關閉）一鍵匯出至 Google Sheets
- 佈署至 Google Cloud Run（Docker）

## 開發環境

1. 安裝相依套件

```bash
npm install
```

2. 設定環境變數

複製 `env.example` 為 `.env`，並填入：

- `SHEETS_SPREADSHEET_ID`: 目標 Google 試算表 ID
- `EINV_BASE_URL`: 開放資料 API 基底網址（預設已提供）
- 本機若需使用服務帳戶：設定 `GOOGLE_APPLICATION_CREDENTIALS` 指向 service account JSON 憑證

3. 啟動開發伺服器

```bash
npm run dev
```

## Google Cloud 部署（Cloud Run）

前置：
- 已安裝並初始化 `gcloud`
- 專案已啟用 Cloud Run、Artifact Registry、Cloud Build
- Vision API 與 Sheets API 已啟用

建置與部署：

```bash
gcloud builds submit --tag asia-docker.pkg.dev/PROJECT_ID/REPO/invoice-app

gcloud run deploy invoice-app \
  --image=asia-docker.pkg.dev/PROJECT_ID/REPO/invoice-app \
  --platform=managed \
  --region=asia-east1 \
  --allow-unauthenticated \
  --set-env-vars=EINV_BASE_URL=https://www.einvoice.nat.gov.tw/portal/ods/ODS318E/einvoice_open_data
```

- 服務帳戶需被授權存取該 Google 試算表（將表單分享給此服務帳戶信箱或改成使用者授權流程）。
- Cloud Run 環境下，Vision 與 Sheets 授權會使用預設服務帳戶（請授與對應 IAM 權限）。

## 重要檔案

- 前端頁面：`src/app/upload`, `src/app/search`, `src/app/report`
- 後端 API：`src/app/api/ocr`, `src/app/api/einvoices`, `src/app/api/pdf`, `src/app/api/sheets-export`
- 核心模組：`src/lib/ocr.ts`, `src/lib/amountParser.ts`, `src/lib/datePresets.ts`, `src/lib/layout.ts`, `src/lib/pdf.ts`, `src/lib/sheets.ts`
- 佈署：`Dockerfile`, `.gcloudignore`

## 待辦
- 依財政部開放資料實際欄位補齊 `einvoices` 端點的下載與解析（CSV/JSON）
- 更精準的金額抽取規則與欄位語境（如「總計」、「含稅金額」等）
- 加入基本儲存層（選用）：上傳暫存與報告重現
# 自動部署測試
