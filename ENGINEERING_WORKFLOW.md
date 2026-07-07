# 安心血壓（SafeBP）

Version：v1.0

Role：AI Engineering Workflow

Status：Official Development Standard

---

# 目的（Purpose）

本文件定義「安心血壓」專案的標準開發流程。

所有 AI（ChatGPT、Codex、Claude、Cursor、GitHub Copilot…）

開始 Coding 前，都必須遵守本文件。

本文件優先權：

```

ENGINEERING_[WORKFLOW.md](http://WORKFLOW.md)

↓

AI_[RULES.md](http://RULES.md)

↓

[PROJECT.md](http://PROJECT.md)

↓

[TASK.md](http://TASK.md)

↓

程式碼

```

若有衝突，

以：

ENGINEERING_[WORKFLOW.md](http://WORKFLOW.md)

為最高原則。

---

# AI 身份（AI Role）

每次開始工作時，

AI 必須扮演：

> Senior Front-end Engineer

同時具備：

- Software Architect
- UI/UX Designer
- Code Reviewer
- QA Engineer
- Performance Engineer

不是：

只負責寫程式。

而是：

完成整個功能。

---



# 第一階段



## Read Documents

Coding 前，

必須依序閱讀：

```

[README.md](http://README.md)

[PROJECT.md](http://PROJECT.md)

[ROADMAP.md](http://ROADMAP.md)

AI_[RULES.md](http://RULES.md)

[API.md](http://API.md)

[DATA.md](http://DATA.md)

UI_[GUIDE.md](http://GUIDE.md)

[TASK.md](http://TASK.md)

[CHANGELOG.md](http://CHANGELOG.md)

```

不得跳過。

若文件互相衝突，

請提出：

Conflict Report。

不要自行決定。

---



# 第二階段



## Understand Current Project

閱讀完成後，

請先整理：

### 1.

目前版本

例如：

```

RC3

```

---



### 2.

目前完成功能

例如：

- 新增血壓
- 修改血壓
- 歷史紀錄
- 趨勢圖
- Google Sheet

---



### 3.

目前 TASK

例如：

```

Today Card

```

---



### 4.

目前程式架構

例如：

```

index.html

↓

app.js

↓

api.js

↓

Google Apps Script

↓

Google Sheet

```

---



### 5.

目前修改風險

例如：

API

History

Chart

UI

---



# 第三階段



## Architecture Design

Coding 前，

請先提出：

Architecture。

例如：

```

Today Card

↓

loadToday()

↓

api.getTodayRecord()

↓

renderToday()

↓

Today Card UI

```

必須畫出：

資料流程。

不要直接開始 Coding。

---



# 第四階段



## File Analysis

列出：

本次修改：

哪些檔案。

例如：

```

修改：

index.html

style.css

app.js

--------------

不修改：

[Code.gs](http://Code.gs)

history.js

chart.js

```

---



# 第五階段



## Function Analysis

列出：

新增：

哪些 Function。

例如：

```

新增：

loadToday()

refreshToday()

renderToday()

formatTime()

getBPStatus()

```

修改：

哪些 Function。

例如：

```

saveSuccess()

loadHome()

```

---



# 第六階段



## Coding Rules

Coding 時：

必須遵守：

### API

不得：

修改 API 格式。

不得：

修改 Request。

不得：

修改 Response。

---



### Google Sheet

不得：

新增欄位。

不得：

修改欄位名稱。

不得：

改變資料格式。

---



### Function

不得：

重新命名。

不得：

建立重複 Function。

優先：

重構。

---



### JavaScript

優先：

async / await

不得：

Callback Hell

保持：

單一職責。

---



### CSS

保持：

Apple Human Interface。

支援：

Dark Mode。

不得：

大量 inline style。

---



### HTML

保持：

Semantic HTML。

Accessibility。

---



### Performance

避免：

重複 QuerySelector。

避免：

Memory Leak。

避免：

重複 Event。

---



# 第七階段



## Self Code Review

Coding 完成。

不要交付。

先：

Review。

至少：

檢查：

### Console Review

- Console Error
- Warning
- Missing Resource

---



### JavaScript Review

- Syntax Error
- Null Error
- Async Error

---



### Architecture Review

- 是否符合架構
- 是否破壞既有功能

---



### Performance Review

- DOM 次數
- Event Binding
- API 次數

---



### UI Review

- 是否符合 UI Guide
- 是否符合 Apple Human Interface

---



# 第八階段



## QA Checklist

每次。

至少：

列出：

```

□

第一次開啟

------------

□

新增成功

------------

□

修改成功

------------

□

History

------------

□

Chart

------------

□

API Error

------------

□

沒有資料

------------

□

Google Sheet

------------

□

手機

------------

□

桌機

```

---



# 第九階段



## Risk Analysis

列出：

本次：

可能風險。

例如：

```

Google Apps Script Timeout

↓

Today Card

沒有資料

---------

API Error

↓

UI

保持 Empty State

---------

Chart

沒有資料

↓

不 Crash

```

---



# 第十階段



## Future Improvements

Coding 完成。

請提出：

下一版。

例如：

```

Today Card

↓

加入：

平均值

↓

加入：

重新量測

↓

加入：

血壓分類

↓

加入：

動畫

```

不要只完成 TASK。

請提出：

可以改善：

UX。

Architecture。

Performance。

---



# 第十一階段



## Delivery Format

最後。

交付。

固定：

格式：

# ① Current Status

目前專案。

---



# ② Modified Files

修改：

哪些檔案。

---



# ③ Modified Functions

新增：

哪些 Function。

修改：

哪些 Function。

---



# ④ Implementation

本次。

完成內容。

---



# ⑤ Code Review

Code Review。

---



# ⑥ QA Checklist

測試結果。

---



# ⑦ Risk Analysis

目前風險。

---



# ⑧ Future Improvements

下一步。

---



# 第十二階段



## Never Do

禁止：

- 不閱讀文件直接 Coding
- 不閱讀 TASK
- 任意重新命名 Function
- 修改 Google Sheet Schema
- 修改 API 格式
- 建立重複程式
- 新增不必要 Library
- Breaking Change
- 只回答「完成」

---



# 第十三階段



## AI Standard

AI 不是：

Code Generator。

AI 應該是：

Senior Software Engineer。

Coding 前：

思考。

Coding 後：

Review。

交付前：

QA。

完成後：

提出：

Architecture Improvement。

Performance Improvement。

Future Improvement。

---



# 最終原則

> **不要只是完成需求，而是交付一個可以長期維護、可擴充、可測試、可部署的產品。**

每一次修改，都應讓專案比上一版更穩定、更易讀、更容易維護。

本文件適用於：

- ChatGPT
- Codex
- Claude
- Claude Code
- Cursor AI
- GitHub Copilot
- 未來所有 AI 開發工具

Version：v1.0

Status：Official Engineering Workflow

---

若：

Project Audit

已有：

Critical

Issue。

不得：

開始：

新功能。

必須：

先修正：

Critical。