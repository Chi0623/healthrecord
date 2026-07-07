# 安心血壓 v1.0

## 目前版本

RC3

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

文件同步與 RC3 收尾驗收。

## 本次重點

- 更新 API 文件與實作一致
- 更新 CHANGELOG / TASK / TODO
- 確認趨勢頁、紀錄頁、首頁三條主流程皆可使用

## 驗收重點

- 首頁：上次量測 / Greeting / Today Card 正常
- 紀錄頁：編輯 / 刪除 / 篩選正常
- 趨勢頁：時段篩選、區間篩選、摘要、統計、圖表正常

## 不修改

- Google Sheet Schema
- API 名稱
- Google Apps Script 欄位定義

## 下一步候選

- RC3 完整 Review
- 文件補齊
- v1.0 Release Readiness 檢查

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
