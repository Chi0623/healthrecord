# [PROJECT.md](http://PROJECT.md)

# 安心血壓 (SafeBP)

## Project Overview

安心血壓是一套專為長者設計的血壓紀錄系統。

目標是提供：

- 快速紀錄血壓

- 今日紀錄

- 歷史紀錄

- 趨勢分析

- Google Sheet 雲端同步

- HTML SPA 離線可執行

- 後續可擴充 AI 健康分析

本專案採用 AI Assisted Development 開發模式。

---

# Product Vision

建立一套：

> 簡單、可靠、安全、容易維護

的長者健康紀錄工具。

未來可逐步發展成：

- 血糖

- 體重

- 用藥

- AI 健康分析

- 家庭共享

- 醫療匯出

---

# Target Users

## Primary

60~85 歲長者

需求：

- 字大

- 按鈕大

- 操作少

- 不容易誤觸

---

## Secondary

照顧者

需求：

- 查看紀錄

- 協助輸入

- 趨勢分析

---

# Product Goals

## v1

完成：

- 今日紀錄

- 歷史

- 趨勢

- CRUD

- Google Sheet

---

## v2

新增：

- 體重

- 血糖

- 用藥

---

## v3

新增：

- AI 健康分析

- PDF

- CSV

- 家庭成員

---

# Scope

## Included

- HTML SPA

- Google Apps Script

- Google Sheet

- Chart.js

---

## Excluded

- Login

- Multi User

- Database

- Backend Server

- Push Notification

---

# Technology Stack

Frontend

- HTML5

- CSS3

- Vanilla JavaScript

Backend

- Google Apps Script

Storage

- Google Sheet

Chart

- Chart.js

Deployment

- GAS Web App

---

# Project Structure

```

/

[README.md](http://README.md)

[PROJECT.md](http://PROJECT.md)

[API.md](http://API.md)

[CHANGELOG.md](http://CHANGELOG.md)

UI_[GUIDE.md](http://GUIDE.md)

[CONTRIBUTING.md](http://CONTRIBUTING.md)

index.html

css/

js/

[Code.gs](http://Code.gs)

```

---

# Functional Requirements

## Dashboard

- 今日血壓

- 今日平均

- 最近一次紀錄

---

## History

- 顯示所有紀錄

- 日期排序

- 編輯

- 刪除（RC3.0.2）

---

## Chart

- 收縮壓

- 舒張壓

- 脈搏

---

## CRUD

Create

Read

Update

Delete

---

# Non Functional Requirements

Security

- Validation

- XSS Protection

- LockService

Performance

- 最少 API 呼叫

- 最少 DOM Render

Maintainability

- 模組化

- API Layer

Scalability

- 易於新增功能

---

# UI Principles

Apple Human Interface Style

要求：

- 簡潔

- 大按鈕

- 大字體

- 高對比

- 少操作

---

# API Design

所有 API Response

```

{

"success": true,

"message": "",

"data": {}

}

```

Error

```

{

"success": false,

"message": "...",

"data": null

}

```

---

# Google Sheet Schema

不得任意修改。

若需修改：

必須：

1.

提出 Migration Plan

2.

更新 [API.md](http://API.md)

3.

更新 CHANGELOG

---

# Coding Rules

禁止：

- Global Variable

- 重複 Validation

- Magic Number

要求：

- Function 單一職責

- 共用 Utility

- Error Handling

---

# Version Strategy

Major

重大功能

Minor

新功能

Patch

Bug Fix

例如：

RC3.0.1

RC3.0.2

RC3.1

V1.0

---

# AI Development Rules

所有 AI Assistant

開始修改前：

必須先閱讀：

[README.md](http://README.md)

[PROJECT.md](http://PROJECT.md)

[API.md](http://API.md)

UI_[GUIDE.md](http://GUIDE.md)

[CONTRIBUTING.md](http://CONTRIBUTING.md)

不得：

- 任意修改架構

- 任意新增套件

- 任意修改 Google Sheet Schema

- 任意新增 UI

除非需求明確要求。

---

# Future Roadmap

RC3.0.2

- Delete UI

- History XSS

- [API.md](http://API.md)

---

RC3.1

- CSV

- PDF

- Print

---

RC4

- 體重

- 血糖

- 用藥

---

V1

正式版

---

V2

AI Health Analysis

---

# Release Rule

每次 Sprint 必須輸出：

① Current Status

② Modified Files

③ Modified Functions

④ Implementation

⑤ API Changes

⑥ Review Result

⑦ QA Checklist

⑧ Risk Analysis

⑨ Known Issues

⑩ Next Sprint

不得省略。

---

# Design Philosophy

本專案優先順序：

1.

Correctness

2.

Security

3.

Maintainability

4.

Performance

5.

UI

6.

New Features

不得為了新增功能而降低程式品質。

