# [ARCHITECTURE.md](http://ARCHITECTURE.md)

# 安心血壓（SafeBP）

Version：v1.0

Status：Official System Architecture

---

# 1. 系統目標（System Goal）

安心血壓是一套專為長輩設計的血壓紀錄 Progressive Web App（PWA）。

設計原則：

- 簡單

- 快速

- 穩定

- 易維護

- 易擴充

本系統採用：

Frontend + Google Apps Script + Google Sheet

避免建立複雜 Server。

---

# 2. 系統架構（Overall Architecture）

```

          User

            │

            ▼

      index.html

            │

            ▼

        app.js

            │

            ▼

        api.js

            │

            ▼

Google Apps Script

            │

            ▼

Google Sheet

```

---

# 3. Frontend Architecture

```

HTML

│

├── Home

├── History

├── Trend

└── Settings（Future）

        │

        ▼

App Controller

(app.js)

        │

        ├──────────────┐

        ▼              ▼

history.js        chart.js

        │              │

        └──────┬───────┘

               ▼

            api.js

               ▼

         Google Apps Script

```

---

# 4. JavaScript 模組

## app.js

負責：

- 首頁

- Today Card

- 輸入流程

- Validation

- Save

- Edit

- Toast

- Loading

- Navigation

不可：

- 操作 Google Sheet

不可：

- 放 Chart Logic

---

## api.js

唯一：

API Layer。

所有：

HTTP Request

全部：

經過：

api.js

不得：

在其他 JS：

直接 fetch。

---

## history.js

只負責：

History。

例如：

- Load History

- Edit

- Delete

- Render History

不得：

修改 Today Card。

---

## chart.js

只負責：

Chart。

例如：

- Render Chart

- Average

- Trend

不得：

修改 History。

---

# 5. Google Apps Script

Google Apps Script

只負責：

Business Logic。

例如：

saveRecord()

updateRecord()

deleteRecord()

getRecords()

getTodayRecord()

getTrend()

不得：

處理 UI。

---

# 6. Google Sheet

Google Sheet

只負責：

Database。

Schema：

固定。

```

A id

B datetime

C user

D sys

E dia

F pulse

G ihb

```

不得：

任意新增。

不得：

修改欄位。

---

# 7. Data Flow

新增：

```

User

↓

app.js

↓

validate()

↓

api.js

↓

saveRecord()

↓

Google Apps Script

↓

Google Sheet

↓

Success

↓

Toast

↓

Today Card

↓

History

↓

Chart

```

---

修改：

```

History

↓

Edit

↓

app.js

↓

updateRecord()

↓

Google Apps Script

↓

Google Sheet

↓

Success

↓

Refresh

```

---

# 8. Page Architecture

目前：

```

Home

History

Trend

```

未來：

```

Home

History

Trend

Settings

About

```

所有：

Page

共用：

App State。

---

# 9. State Management

App State：

```

App.state

```

例如：

```

editingId

ihb

currentPage

saving

```

所有：

UI

依據：

State

Render。

不得：

直接修改 DOM 狀態。

---

# 10. Event Flow

```

Click

↓

Event

↓

App

↓

Business Logic

↓

API

↓

Response

↓

Render

```

不得：

Button

直接：

操作 DOM。

---

# 11. UI Layer

```

UI

↓

View

↓

App

↓

API

↓

Data

```

View

不得：

直接呼叫：

Google Apps Script。

---

# 12. API Layer

所有：

API

統一：

```

api.js

```

例如：

```

saveRecord()

updateRecord()

deleteRecord()

getRecords()

getTrend()

getTodayRecord()

```

不得：

在：

history.js

chart.js

直接：

fetch。

---

# 13. Business Rule

Business Logic：

放：

Google Apps Script。

例如：

資料驗證。

日期。

排序。

不得：

重複：

寫：

Frontend。

---

# 14. Error Handling

全部：

try / catch。

API

全部：

回傳：

```

{

success,

message,

data

}

```

不得：

直接：

throw

到 UI。

---

# 15. Performance

避免：

- 重複 Query Selector

- 重複 Event

- 重複 Render

- 重複 API

Chart

必須：

Destroy。

重新建立。

---

# 16. Dependency Rule

依賴方向：

```

UI

↓

App

↓

API

↓

Google Apps Script

↓

Google Sheet

```

不得：

反向依賴。

例如：

Google Apps Script

不得：

知道：

UI。

---

# 17. Future Architecture

未來：

加入：

```

Notification

↓

PDF

↓

CSV

↓

AI Analysis

↓

Apple Health

↓

Google Fit

```

全部：

新增 Module。

不要：

修改：

核心架構。

---

# 18. Architecture Principles

遵守：

Single Responsibility

Open / Closed

Keep It Simple

Don't Repeat Yourself

Separation of Concerns

Maintainability First

Long-term Scalability

---

# 19. Never Do

禁止：

- UI 呼叫 Google Sheet

- JS 直接修改 Sheet

- Chart 控制 History

- History 控制 Today Card

- API 寫 UI

- Google Apps Script 控制畫面

全部：

依照：

Architecture。

---

# 20. Final Principle

> 每一個 Module 只做一件事。

每一層只知道下一層。

不得跨層。

如此才能：

容易維護

容易測試

容易擴充

容易交給 AI 持續開發。

---

Version：v1.0

Status：Official Architecture Document

Maintainer：SafeBP Engineering Team