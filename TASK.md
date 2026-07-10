# 安心血壓 v1.1

## 目前版本

UAT-011 Planning

## 目前狀態

已完成：

- Today Card / 上次量測卡片
- 首頁 Greeting 與第一屏高度最佳化
- 歷史紀錄重新設計
- 歷史紀錄編輯 / 刪除 / 篩選 / 摘要調整
- 趨勢頁摘要 / 統計 / 7~365 天切換
- 趨勢頁時段篩選
- Google Apps Script API hardening
- Google Sheet 同步

## 本次任務

規劃程式符合 UAT-011 CSV 匯出。

## 本次重點

- 在紀錄頁提供 `匯出 CSV` 入口
- 匯出目前篩選後的紀錄
- 支援 iOS Share Sheet
- 不支援分享時改用瀏覽器下載
- CSV 欄位符合 UAT-011
- 不修改 Google Sheet Schema
- 不新增後端 API

## 驗收重點

- 紀錄頁點擊 `匯出 CSV` 可產生 CSV
- CSV 內容只包含目前篩選結果
- CSV 第一列為欄位名稱
- 欄位順序為：姓名、日期、時間、時段、SYS、DIA、Pulse、不規則心跳、血壓燈號、RecordID
- RecordID 放最後
- 中文在 Excel / Numbers 正常顯示
- iOS Safari 可開啟 Share Sheet
- 不支援 Share Sheet 的瀏覽器可下載檔案
- 無資料時不下載空檔案，並顯示友善提示
- 新增、編輯、刪除紀錄流程不受影響

## 不修改

- Google Sheet Schema
- API 名稱
- Google Apps Script 欄位定義
- `Code.gs`
- `js/api.js`

## 修改檔案

- `index.html`
- `css/style.css`
- `js/history.js`
- `TASK.md`
- `TODO.md`

## 程式規劃

### 1. UI 入口

在 `#page-history` 中新增匯出工具列：

- 位置：篩選區下方、紀錄列表上方
- 元件：
  - 範圍摘要：顯示目前可匯出的筆數與篩選狀態
  - 按鈕：`匯出 CSV`
- 狀態：
  - 有可匯出資料：按鈕啟用
  - 無資料：按鈕停用或點擊後顯示提示

### 2. History 狀態

沿用現有資料：

- `History.allRecords`：全部紀錄
- `History.records`：目前篩選後紀錄
- `History.filters`：目前篩選條件

新增 DOM 參照：

- `exportButton`
- `exportSummaryElement`

新增方法：

- `bindExportEvents()`
- `syncExportState()`
- `exportCsv()`
- `getExportRecords()`
- `getExportSummaryText()`

### 3. CSV 產生

新增方法：

- `buildCsv(records)`
- `buildCsvRow(values)`
- `escapeCsvValue(value)`
- `getCsvHeaders()`
- `mapRecordToCsvRow(record)`

CSV 規則：

- 第一列為欄位名稱
- 加入 UTF-8 BOM
- 日期格式：`YYYY-MM-DD`
- 時間格式：`HH:mm`
- 不規則心跳：`是` / `否`
- 血壓燈號移除 emoji，只保留文字
- 逗號、雙引號、換行需正確 escape

### 4. 分享與下載

新增方法：

- `getExportFileName(records)`
- `shareOrDownloadCsv(csv, fileName)`
- `shareCsvFile(file, fileName)`
- `downloadCsvFile(blob, fileName)`

平台規則：

- 若支援 `navigator.share`、`navigator.canShare`、`File`，優先分享 CSV 檔案
- 分享失敗或使用者取消時，不顯示錯誤
- 不支援分享時，建立 Blob URL 並下載
- 下載後釋放 Blob URL

### 5. 空資料處理

若 `History.allRecords.length === 0`：

- 顯示 `目前沒有可匯出的紀錄`
- 不產生 CSV

若 `History.allRecords.length > 0` 但 `History.records.length === 0`：

- 顯示 `目前篩選條件沒有可匯出的紀錄`
- 不產生 CSV

### 6. 樣式

新增樣式：

- `.history-export`
- `.history-export-summary`
- `.history-export-btn`
- `.history-export-btn:disabled`

設計原則：

- 按鈕高度適合長者點擊
- 與現有 filter chip / history card 視覺一致
- 手機寬度不造成文字溢出
- 不使用大面積紅色

### 7. 測試項目

手動測試：

- 全部紀錄匯出
- 近 7 天匯出
- 近 30 天匯出
- 時段複選匯出
- 血壓燈號篩選匯出
- 自訂日期範圍匯出
- 篩選後 0 筆不下載
- 全部 0 筆不下載
- 姓名含逗號、雙引號、換行時 CSV 正確
- iOS Safari Share Sheet
- 桌面 Chrome / Safari 下載
- 匯出後新增、編輯、刪除仍正常

## 完成條件

- UAT-011 規格全部可被手動驗收
- 前端可獨立完成 CSV 匯出
- 不需要 Google Apps Script 改版
- 不影響既有 UAT-001 ~ UAT-010 行為

## 下一步候選

- 實作 UAT-011 CSV 匯出
- 補充 CHANGELOG
- 做一次手機寬度視覺確認

**用途：** 目前開發任務（Current Sprint）

[TASK.md](http://TASK.md) 用來記錄目前正在進行的開發工作，是 AI 與開發者每天開始工作前第一份需要閱讀的文件。

### 建議內容

- 目前版本
- 本次目標
- 修改檔案
- 完成條件
- 驗收標準
- 測試項目
- 注意事項



### 範例



#### 版本

```

RC3.1

```



#### 任務

```

Today Card

```



#### 修改檔案

- index.html
- style.css
- app.js



#### 不修改

- api.js
- [Code.gs](http://Code.gs)



#### 完成條件

- 首頁顯示今天最後一次量測
- 無資料時顯示「今天尚未量測」
- 儲存後立即更新 Today Card
- 不影響既有功能
