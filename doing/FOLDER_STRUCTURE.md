# FOLDER_[STRUCTURE.md](http://STRUCTURE.md)

# 安心血壓（SafeBP）

Version：v1.0

Status：Official Project Folder Structure

---

# 目的（Purpose）

本文件定義「安心血壓」專案的資料夾結構與各檔案責任。

所有開發者與 AI 在新增檔案或修改程式前，都必須遵守本文件。

目的：

- 保持專案整潔

- 降低維護成本

- 讓 AI 快速找到正確檔案

- 避免功能放錯位置

---

# 專案結構

```

SafeBP/

│

├── index.html

├── manifest.json

├── sw.js

├── [Code.gs](http://Code.gs)

│

├── css/

│   └── style.css

│

├── js/

│   ├── app.js

│   ├── api.js

│   ├── history.js

│   ├── chart.js

│   └── utils.js（Future）

│

├── assets/

│   ├── logo.svg

│   ├── ihb.svg

│   ├── icons/

│   ├── images/

│   └── fonts/

│

├── docs/

│   ├── [README.md](http://README.md)

│   ├── [PROJECT.md](http://PROJECT.md)

│   ├── [ROADMAP.md](http://ROADMAP.md)

│   ├── [CHANGELOG.md](http://CHANGELOG.md)

│   ├── [TASK.md](http://TASK.md)

│   ├── [TODO.md](http://TODO.md)

│   ├── [API.md](http://API.md)

│   ├── [DATA.md](http://DATA.md)

│   ├── UI_[GUIDE.md](http://GUIDE.md)

│   ├── AI_[RULES.md](http://RULES.md)

│   ├── ENGINEERING_[WORKFLOW.md](http://WORKFLOW.md)

│   ├── REVIEW_[CHECKLIST.md](http://CHECKLIST.md)

│   ├── [ARCHITECTURE.md](http://ARCHITECTURE.md)

│   ├── CODING_[STYLE.md](http://STYLE.md)

│   ├── DECISION_[LOG.md](http://LOG.md)

│   ├── RELEASE_[PROCESS.md](http://PROCESS.md)

│   └── FOLDER_[STRUCTURE.md](http://STRUCTURE.md)

│

└── backup/（Future）

```

---

# Root（根目錄）

根目錄只放：

- index.html

- manifest.json

- sw.js

- [Code.gs](http://Code.gs)

禁止：

- app.js

- style.css

- image

- test

全部放根目錄。

---

# css/

用途：

放置所有樣式。

目前：

```

style.css

```

未來：

```

style.css

theme.css

print.css

```

不得：

放 JavaScript。

---

# js/

用途：

放置所有 JavaScript。

目前：

```

app.js

api.js

history.js

chart.js

```

未來：

```

utils.js

storage.js

notification.js

```

禁止：

HTML。

禁止：

CSS。

---

# assets/

用途：

所有靜態資源。

包含：

```

SVG

PNG

JPG

ICO

Font

```

例如：

```

logo.svg

ihb.svg

icon-192.png

icon-512.png

```

---

# docs/

用途：

所有 Markdown。

禁止：

README

放根目錄以外。

README

可保留：

GitHub 首頁。

其他：

全部：

docs。

---

# [Code.gs](http://Code.gs)

唯一：

Google Apps Script。

禁止：

放：

HTML。

CSS。

UI。

---

# index.html

唯一：

HTML Entry。

負責：

UI。

不得：

Business Logic。

---

# app.js

負責：

App Controller。

例如：

- Home

- Today Card

- Save

- Navigation

- State

不得：

直接：

fetch。

---

# api.js

唯一：

API Layer。

所有：

Google Apps Script

全部：

經過：

api.js

禁止：

其他 JS：

直接：

fetch。

---

# history.js

只負責：

History。

例如：

- Render

- Edit

- Delete

- Refresh

不得：

操作 Chart。

---

# chart.js

只負責：

Trend。

例如：

- Chart

- Average

- Statistics

不得：

修改 History。

---

# style.css

所有：

CSS。

不得：

inline style。

不得：

style

寫：

HTML。

---

# Assets Rule

圖片：

```

assets/images/

```

SVG：

```

assets/icons/

```

字型：

```

assets/fonts/

```

不得：

放：

根目錄。

---

# Documents Rule

所有文件：

```

docs/

```

新增文件：

必須：

更新：

README。

---

# Future Folder

若：

未來：

加入：

Notification：

```

js/

notification.js

```

若：

加入：

PDF：

```

js/

pdf.js

```

若：

加入：

AI：

```

js/

ai.js

```

不得：

全部：

寫：

app.js。

---

# Folder Responsibility

```

HTML

↓

UI

----------------

CSS

↓

Style

----------------

JavaScript

↓

Logic

----------------

API

↓

Communication

----------------

Google Apps Script

↓

Business

----------------

Google Sheet

↓

Data

```

不得：

跨層。

---

# Naming Rules

Folder：

全部：

```

lowercase

```

例如：

```

css

js

assets

docs

```

禁止：

```

CSS

JavaScript

Images

```

---

# New File Rules

新增檔案：

先確認：

是否已有：

相同功能。

例如：

不要：

```

history2.js

history_new.js

history_v2.js

```

應：

重構：

history.js。

---

# Maximum Files

建議：

一個資料夾：

不要：

超過：

20 個檔案。

超過：

應：

再分：

子資料夾。

---

# Never Do

禁止：

- 重複 JS

- 重複 CSS

- 備份檔放正式目錄

- test.js 放正式版

- old.js 放正式版

- final.js

- final2.js

- new.js

所有修改：

應：

直接：

Version Control。

---

# AI Rules

AI：

新增檔案前：

必須：

檢查：

是否已有：

相同功能。

若：

已有：

請：

重構。

不是：

新增：

重複檔案。

---

# Final Principle

> 一個資料夾只有一種責任，一個檔案只有一個主要目的。

不要讓專案因為功能增加而越來越混亂。

每新增一個功能，都應先思考：

「應該放在哪裡？」

而不是：

「放哪裡最快」。

---

Version：v1.0

Status：Official Folder Structure Standard

Maintainer：SafeBP Engineering Team