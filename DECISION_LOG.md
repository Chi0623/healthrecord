# DECISION_[LOG.md](http://LOG.md)

# 安心血壓（SafeBP）

Version：v1.0

Status：Official Architecture Decision Log

---

# 目的（Purpose）

本文件用來記錄專案的重要技術決策（Architecture Decision Record, ADR）。

所有重大設計、技術選型與產品方向，都應記錄於本文件。

目的：

- 保留決策原因

- 避免重複討論

- 提供 AI 開發依據

- 降低未來維護成本

- 新加入開發者快速理解專案

---

# 決策格式

每一項決策包含：

- 編號

- 日期

- 狀態

- 決策內容

- 原因

- 優點

- 缺點

- 替代方案

- 後續影響

---

# ADR-001

## 使用 Google Apps Script 作為 Backend

日期：

2026-07

狀態：

Accepted

---

### 決策

使用 Google Apps Script 作為唯一 Backend。

---

### 原因

- 免費

- 部署快速

- 不需要 Server

- 與 Google Sheet 整合容易

---

### 優點

- 維護成本低

- 適合小型專案

- HTTPS 已內建

---

### 缺點

- 執行時間有限制

- 不適合大量併發

---

### 不採用方案

- Node.js

- PHP

- [ASP.NET](http://ASP.NET)

- Firebase Functions

---

# ADR-002

## 使用 Google Sheet 作為 Database

日期：

2026-07

狀態：

Accepted

---

### 決策

Google Sheet 為唯一資料來源。

---

### 原因

- 家人容易查看

- 不需資料庫管理

- 成本為零

---

### 優點

- 可直接備份

- 可人工修正資料

- 容易匯出 Excel

---

### 缺點

- 不適合大量資料

- 查詢效率有限

---

### 不採用方案

- MySQL

- PostgreSQL

- SQLite

- Firestore

---

# ADR-003

## 不使用 React / Vue

日期：

2026-07

狀態：

Accepted

---

### 決策

Frontend 使用原生 HTML、CSS、JavaScript。

---

### 原因

- 專案規模小

- 容易維護

- AI 修改容易

- 不需 Build

---

### 優點

- 開發速度快

- 學習成本低

- 部署簡單

---

### 缺點

- 大型專案管理較困難

---

### 不採用方案

- React

- Vue

- Angular

- Svelte

---

# ADR-004

## 日期與時間由系統產生

日期：

2026-07

狀態：

Accepted

---

### 決策

首頁不允許手動輸入日期與時間。

---

### 原因

- 長輩容易輸入錯誤

- 降低操作步驟

- 保持資料一致性

---

### 影響

Google Apps Script 自動記錄時間。

---

# ADR-005

## 採用 Apple Human Interface

日期：

2026-07

狀態：

Accepted

---

### 決策

UI 全面遵循 Apple Human Interface Guidelines。

---

### 原因

- 簡潔

- 字體清楚

- 長輩容易閱讀

---

### 重點

- 大字

- 大按鈕

- 少步驟

- 高對比

- Dark Mode

---

# ADR-006

## API 統一由 api.js 管理

日期：

2026-07

狀態：

Accepted

---

### 決策

所有 API 呼叫只能經過 api.js。

---

### 原因

避免：

- 重複 fetch()

- API 分散

- 維護困難

---

### 規則

禁止：

history.js

↓

直接 fetch

禁止：

chart.js

↓

直接 fetch

---

# ADR-007

## app.js 作為唯一 Controller

日期：

2026-07

狀態：

Accepted

---

### 決策

app.js 為整個前端控制中心。

---

### 職責

- 首頁

- Today Card

- Save

- Navigation

- State

不得：

負責 Chart。

不得：

負責 History Render。

---

# ADR-008

## Google Sheet Schema 固定

日期：

2026-07

狀態：

Accepted

---

### 決策

Google Sheet Schema 一旦發布，不得修改。

---

### Schema

A id

B datetime

C user

D sys

E dia

F pulse

G ihb

---

### 原因

避免：

- API 壞掉

- 歷史資料錯誤

---

# ADR-009

## 優先重構，不重寫

日期：

2026-07

狀態：

Accepted

---

### 決策

AI 修改程式時：

優先：

Refactor

不是：

Rewrite

---

### 原因

保持：

RC 相容。

降低 Bug。

---

# ADR-010

## 專案以長輩為第一優先

日期：

2026-07

狀態：

Accepted

---

### 決策

所有功能設計都以 65 歲以上使用者為第一優先。

---

### UI 原則

- 字體 ≥ 18px

- Button ≥ 48px

- 操作步驟最少

- 不需閱讀說明即可使用

---

# 已拒絕決策（Rejected）

## R-001

Firebase Authentication

原因：

增加登入流程。

不符合長輩需求。

---

## R-002

React

原因：

增加維護成本。

---

## R-003

SQL Database

原因：

目前資料量不足。

---

## R-004

手動輸入日期

原因：

容易輸入錯誤。

---

## R-005

多頁式操作流程

原因：

增加操作複雜度。

---

# 未來待評估（Pending）

- PDF 匯出

- Apple Health

- Google Fit

- AI 健康分析

- 通知提醒

- 離線模式增強

---

# ADR-011

## 長者首頁操作與管理資訊採分層設計

日期：

2026-07-10

狀態：

Accepted

### 決策

- 首頁儲存操作同時使用圖示與文字。
- 底部功能列因手機空間有限維持純圖示，並保留無障礙名稱。
- 首頁操作回饋顯示 5 秒，並區分成功、失敗與一般提示。
- 醫師閱讀內容不全面放大，保留資料密度。
- Apps Script 與使用者設定定位為管理者操作，不改為長者簡化介面。

### 原因

首頁需優先降低長者操作錯誤；醫師資料與管理設定則由熟悉系統的人員使用，兩者不應套用完全相同的資訊密度。

### 後續影響

新增首頁主要操作時應提供清楚文字；底部導覽新增或更換圖示時，必須同步維護 `aria-label`。

---

# Decision Rules

所有重大決策：

必須：

1.

記錄於本文件。

2.

更新 [PROJECT.md](http://PROJECT.md)。

3.

必要時更新 [ROADMAP.md](http://ROADMAP.md)。

不得：

只修改程式，不更新文件。

---

# Final Principle

> 技術決策應以「長輩使用體驗」與「長期維護成本」為優先，而非追求最新技術。

當新需求與既有決策衝突時，應先更新 Decision Log，再修改程式。

---

Version：v1.0

Status：Official Architecture Decision Record

Maintainer：SafeBP Engineering Team
