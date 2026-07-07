# CODING_[STYLE.md](http://STYLE.md)

# 安心血壓（SafeBP）

Version：v1.0

Status：Official Coding Standard

---

# 目的（Purpose）

本文件定義「安心血壓」專案的程式撰寫標準。

所有開發者（Human Developer）與 AI（ChatGPT、Codex、Claude、Cursor、GitHub Copilot）都必須遵守本文件。

目的：

- 保持程式一致性

- 提高可讀性

- 降低維護成本

- 避免 AI 產生不同風格程式

- 提高 Code Review 品質

---

# Coding Philosophy

本專案遵守：

- Keep It Simple (KISS)

- Don't Repeat Yourself (DRY)

- Single Responsibility Principle (SRP)

- Readability First

- Maintainability First

- Performance Without Premature Optimization

程式不是寫給電腦看的。

程式是寫給下一位維護者看的。

---

# File Naming

全部：

小寫。

例如：

```

index.html

style.css

app.js

history.js

chart.js

api.js

```

禁止：

```

App.js

History.js

MyFile.js

```

禁止：

中文檔名。

---

# Folder Structure

```

/

index.html

css/

style.css

js/

app.js

api.js

history.js

chart.js

assets/

docs/

[Code.gs](http://Code.gs)

```

不得：

亂新增資料夾。

---

# HTML Style

使用：

Semantic HTML

例如：

```

header

main

section

article

footer

```

避免：

大量：

div。

---

HTML

縮排：

2 Spaces

例如：

```html

<section class="today-card">

  <h2>今天最後一次量測</h2>

</section>

```

---

Class Naming

使用：

kebab-case

例如：

```

today-card

bp-card

history-item

chart-container

```

禁止：

```

TodayCard

Today_Card

todayCard

```

---

ID Naming

使用：

camelCase

例如：

```

saveBtn

ihbBtn

currentTime

```

---

Data Attribute

例如：

```

data-page

data-input

data-user

```

不要：

自創格式。

---

# CSS Style

全部：

CSS Variables。

例如：

```css

:root{

--primary:#0A84FF;

--danger:#FF453A;

}

```

不要：

Magic Color。

例如：

```

color:#0A84FF;

```

直接寫。

---

Selector

最多：

3 層。

例如：

```

.card .title

```

不要：

```

.page .card .content .left h2 span

```

---

Class

全部：

kebab-case

例如：

```

today-card

history-card

status-text

```

---

CSS 順序

固定：

```

Position

Display

Box

Margin

Padding

Typography

Background

Border

Animation

```

例如：

```css

.card{

position:relative;

display:flex;

width:100%;

margin:16px;

padding:20px;

font-size:18px;

background:var(--card);

border-radius:24px;

transition:.3s;

}

```

---

Animation

全部：

300ms

例如：

```

transition:.3s ease;

```

---

Border Radius

統一：

```

24px

```

Button

```

28px

```

---

# JavaScript Style

ES6+

全部：

```

const

let

```

禁止：

```

var

```

---

Naming

Function

camelCase

例如：

```

loadToday()

saveRecord()

refreshHistory()

```

Variable

camelCase

例如：

```

currentUser

todayRecord

averageSys

```

Constant

UPPER_SNAKE_CASE

例如：

```

MAX_SYS

MIN_DIA

API_URL

```

---

Function

一個 Function：

最好：

60 行內。

超過：

100 行：

應拆分。

---

Single Responsibility

一個 Function：

只做：

一件事。

例如：

```

loadToday()

↓

API

↓

Render

```

不要：

```

loadToday()

↓

API

↓

Toast

↓

History

↓

Chart

↓

Animation

```

---

Early Return

優先：

```javascript

if(!data){

return;

}

```

不要：

```javascript

if(data){

...

}

else{

...

}

```

---

Async

全部：

```

async

await

```

不要：

Promise Chain。

---

Error Handling

全部：

```javascript

try{

}

catch(err){

console.error(err);

}

```

不要：

空 Catch。

---

Console

正式版：

禁止：

```

console.log()

```

允許：

```

console.error()

console.warn()

```

---

# Google Apps Script Style

Function

全部：

camelCase

例如：

```

saveRecord()

getTrend()

```

API

固定：

```

success

message

data

```

例如：

```json

{

"success":true,

"message":"",

"data":[]

}

```

不要：

不同格式。

---

Lock

所有：

寫入：

```

LockService

```

---

Validation

前端。

後端。

都要驗證。

不要：

只驗證一邊。

---

# Comments

Header

固定：

```javascript

/* ==========================================

   Save Record

========================================== */

```

不要：

大量：

行內註解。

程式應該：

自己會說話。

---

# Code Review Rules

每次：

Coding

完成：

請檢查：

- 重複程式

- Magic Number

- Dead Code

- Long Function

- Nested If

- Console Log

- Memory Leak

---

# Performance Rules

避免：

```

document.querySelector()

```

重複：

100 次。

Cache：

DOM。

例如：

```

this.elements

```

---

不要：

重複：

API。

例如：

```

save()

↓

getHistory()

↓

getHistory()

```

---

Chart

重新 Render：

先：

Destroy。

---

# Accessibility

Button

至少：

48px

Input

至少：

56px

Font

至少：

18px

Color

符合：

WCAG AA。

---

# Git Commit Style

格式：

```

type: description

```

例如：

```

feat: add today card

fix: update history refresh

refactor: split app.js

docs: update API

style: improve button spacing

test: review chart

```

---

# Never Do

禁止：

- var

- inline style

- inline onclick

- duplicate function

- duplicate css

- duplicate api

- magic number

- magic color

- callback hell

- nested if > 3 層

- 超長 function

- 修改 API 格式

- 修改 Google Sheet Schema

---

# AI Coding Rules

AI 不可以：

直接重寫整個專案。

優先：

- 重構

- 修正

- 擴充

不要：

Breaking Change。

---

# Definition of Good Code

好的程式應具備：

- 容易閱讀

- 容易測試

- 容易維護

- 容易重構

- 容易交接

- 不依賴作者本人

---

# Final Principle

> 每一行程式碼都應讓專案比昨天更好。

不要追求最短的程式。

請追求最容易維護的程式。

---

Version：v1.0

Status：Official Coding Standard

Maintainer：SafeBP Engineering Team