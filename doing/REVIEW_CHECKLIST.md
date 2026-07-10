# REVIEW_[CHECKLIST.md](http://CHECKLIST.md)

# 安心血壓（SafeBP）

Version：v1.0

Status：Official Quality Assurance Checklist

---

# 目的（Purpose）

本文件定義每一次程式修改後的驗收標準（Definition of Done）。

所有 AI（ChatGPT、Codex、Claude、Cursor、GitHub Copilot）完成開發後，都必須依照本文件逐項檢查。

**未完成所有必要檢查，不得交付。**

---

# 使用方式

每完成一個功能：

```

Coding

↓

Self Review

↓

REVIEW_CHECKLIST

↓

修正問題

↓

再次 Review

↓

交付

```

---

# 第一章 功能檢查（Functional Review）

## 基本功能

- [ ] 專案可以正常開啟

- [ ] 沒有白畫面

- [ ] 沒有 JavaScript Error

- [ ] 沒有 Console Error

- [ ] 沒有 Console Warning（可接受的第三方警告除外）

---

## 首頁

- [ ] Today Card 正常顯示

- [ ] 血壓輸入正常

- [ ] Enter 可跳下一欄

- [ ] 自動 Focus 正常

- [ ] 自動 Select 正常

- [ ] 不規則心跳(IHB)正常切換

- [ ] 儲存按鈕正常

---

## 新增血壓

- [ ] 可以新增

- [ ] Google Sheet 有新增

- [ ] Toast 正常

- [ ] Today Card 更新

- [ ] History 更新

- [ ] Chart 更新

---

## 修改血壓

- [ ] History 點擊可編輯

- [ ] 更新按鈕正常

- [ ] Google Sheet 更新

- [ ] Today Card 更新

- [ ] History 更新

- [ ] Chart 更新

---

## 刪除血壓

- [ ] 可刪除

- [ ] Google Sheet 已刪除

- [ ] History 更新

- [ ] Chart 更新

- [ ] Today Card 更新

---

## History

- [ ] 可正常載入

- [ ] 日期正常

- [ ] 時間正常

- [ ] 排序正確

- [ ] 空資料正常

- [ ] 點擊正常

---

## Trend

- [ ] Chart 正常

- [ ] 空資料正常

- [ ] 不會 Crash

- [ ] 平均值正確

- [ ] 日期排序正確

---

# 第二章 API Review

每一支 API 必須檢查：

---

## saveRecord()

- [ ] Request 正確

- [ ] Response 正確

- [ ] Success 正常

- [ ] Error 正常

---

## updateRecord()

- [ ] Request 正確

- [ ] Response 正確

- [ ] Success 正常

- [ ] Error 正常

---

## deleteRecord()

- [ ] Request 正確

- [ ] Response 正確

- [ ] Success 正常

- [ ] Error 正常

---

## getRecords()

- [ ] 回傳資料正確

- [ ] 排序正確

---

## getTodayRecord()

- [ ] 今天有資料

- [ ] 今天沒資料

- [ ] 空值正常

---

## getTrend()

- [ ] 日期正確

- [ ] 排序正確

- [ ] 空資料正常

---

# 第三章 Google Sheet Review

- [ ] Sheet 名稱正確

- [ ] Schema 未改變

- [ ] UUID 正常

- [ ] Date 正常

- [ ] User 正常

- [ ] SYS 正常

- [ ] DIA 正常

- [ ] Pulse 正常

- [ ] IHB 正常

---

# 第四章 UI Review

## Apple Human Interface

- [ ] Card Radius 一致

- [ ] Button 高度一致

- [ ] Input 高度一致

- [ ] Icon 大小一致

- [ ] 間距一致

---

## Typography

- [ ] 標題一致

- [ ] 字體大小一致

- [ ] 長輩容易閱讀

---

## Dark Mode

- [ ] 色彩一致

- [ ] 對比足夠

- [ ] 無白底殘留

---

## Responsive

- [ ] iPhone SE

- [ ] iPhone Plus

- [ ] Android

- [ ] iPad

- [ ] Desktop

---

# 第五章 JavaScript Review

- [ ] 無 Syntax Error

- [ ] 無 Null Error

- [ ] 無 Undefined

- [ ] Promise 正常

- [ ] async/await 正常

- [ ] 無重複 Function

- [ ] 無重複 Event

---

# 第六章 Performance Review

- [ ] 無重複 API 呼叫

- [ ] 無 Memory Leak

- [ ] DOM 查詢最少

- [ ] Event Binding 最少

- [ ] Chart 正常 Destroy

- [ ] Chart 正常重建

---

# 第七章 Architecture Review

- [ ] 保持 RC 相容

- [ ] 不破壞 API

- [ ] 不修改 Google Sheet Schema

- [ ] Function 命名一致

- [ ] Folder Structure 未破壞

---

# 第八章 Security Review

- [ ] Input 驗證

- [ ] Number 驗證

- [ ] Null 檢查

- [ ] API Error Handling

- [ ] try/catch 完整

- [ ] LockService 正常

---

# 第九章 UX Review

- [ ] Loading 顯示

- [ ] Toast 正常

- [ ] Error Message 清楚

- [ ] 空畫面友善

- [ ] 操作流程簡單

- [ ] 長輩容易理解

---

# 第十章 Regression Test

確認沒有破壞：

- [ ] RC1

- [ ] RC2

- [ ] History

- [ ] Chart

- [ ] Google Sheet

- [ ] Today Card

---

# 第十一章 Code Review

檢查：

- [ ] 是否可以簡化

- [ ] 是否可以重構

- [ ] 是否有 Dead Code

- [ ] 是否有 Duplicate Code

- [ ] 是否有 Magic Number

- [ ] 是否符合 AI_[RULES.md](http://RULES.md)

---

# 第十二章 Future Review

Coding 完成後：

請主動提出：

## 可改善

- [ ] UI

- [ ] UX

- [ ] Architecture

- [ ] API

- [ ] Performance

- [ ] Accessibility

---

## 下一版建議

請至少提出：

- 3 個 UX 改善

- 3 個程式改善

- 3 個效能改善

---

# 最終交付格式（Mandatory）

每一次交付請固定輸出：

## ① Current Status

目前版本

目前完成度

---

## ② Modified Files

列出所有修改檔案

---

## ③ Modified Functions

新增 Function

修改 Function

---

## ④ Review Result

✅ Functional Review

✅ API Review

✅ UI Review

✅ Performance Review

✅ Security Review

---

## ⑤ QA Result

列出所有測試項目

通過／未通過

---

## ⑥ Known Issues

目前已知問題

如果沒有：

請寫：

```

None

```

---

## ⑦ Future Improvements

提出下一版改善建議

---

# 最終原則

> **每一次交付，都應比上一版更穩定、更容易維護、更容易閱讀。**

AI 的工作不是「寫完程式」，而是交付一個**可測試、可維護、可擴充、可發布**的產品。

---

Version：v1.0

Status：Official Review Checklist

Maintainer：SafeBP Engineering Standard