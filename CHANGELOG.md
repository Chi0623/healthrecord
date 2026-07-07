**用途：** 版本更新紀錄



[CHANGELOG.md](http://CHANGELOG.md) 用來記錄每個版本新增、修改、修正的內容，方便回顧專案演進歷程。



建議採用 Keep a Changelog 格式。



### 範例



## RC3（開發中）



### Added



- Today Card 與首頁 Greeting

- 血壓狀態判讀與燈號規則頁

- 歷史紀錄編輯 / 刪除 / 篩選 / 展開卡片

- 趨勢摘要、統計資訊與長區間篩選

- IHB 前端顯示與記錄



### Changed



- 首頁第一屏高度最佳化與 Today Card 版面調整

- 歷史卡片重新設計，支援圖例、時段、燈號與大數字資訊

- 趨勢圖優化，新增 7 / 30 / 90 / 180 / 365 天切換

- 趨勢頁新增時段篩選與全部快速清除



### Fixed



- 修正 History 更新問題

- 修正 Chart 載入與 `window.ChartPage` 掛載問題

- 修正 Google Sheet 同步與 Google Apps Script 請求相容性

- 修正 `file://` 測試情境下的趨勢頁偵錯與本機 HTTP 測試流程



---



## RC2



### Added



- 修改血壓紀錄

- updateRecord API

- editingId 機制



### Changed



- History 點擊可編輯

- 儲存按鈕切換為更新模式



### Fixed



- 修正重複新增紀錄

- 修正資料驗證

- 修正 LockService



---



## RC1



### Added



- Google Apps Script API

- Google Sheet 串接

- History 頁面

- 趨勢圖

- Toast 提示

- Loading 動畫



---



## v0.2



### Added



- Google Sheet 資料儲存

- API 初版



---



## v0.1



### Added



- HTML Prototype

- 首頁 UI

- 基本輸入功能



---



# 文件維護原則



每次完成一個功能時，請同步更新：



- [CHANGELOG.md](http://CHANGELOG.md)（記錄版本變更）

- [ROADMAP.md](http://ROADMAP.md)（更新版本進度）

- [TASK.md](http://TASK.md)（切換至下一項任務）

- [TODO.md](http://TODO.md)（移除已完成項目）



確保所有專案文件保持一致，作為整個專案的正式紀錄。
