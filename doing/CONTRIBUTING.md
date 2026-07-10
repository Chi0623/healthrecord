# [CONTRIBUTING.md](http://CONTRIBUTING.md)

# AI Collaboration Guide

本專案採用 AI Assisted Development。

所有 AI Assistant（ChatGPT、Claude、Codex、Gemini）以及未來參與本專案的開發者，皆必須遵守本文件。

---

# Development Philosophy

本專案遵循以下原則：

1. Correctness

2. Security

3. Maintainability

4. Performance

5. UX

6. New Features

不得為了新增功能而犧牲程式品質。

---

# Development Workflow

每個 Sprint 必須依照以下流程。

## Step 1 — Product Manager

確認：

- 本 Sprint 目標

- Scope 是否明確

- 是否有需求衝突

- 是否超出版本規劃

禁止：

- 私自新增功能

- Scope Creep

---

## Step 2 — Software Architect

修改程式前必須評估：

- 是否影響架構

- 是否需要 Refactor

- 是否增加技術債

- 是否符合 [PROJECT.md](http://PROJECT.md)

若有重大架構變更：

必須先提出方案。

不得直接修改。

---

## Step 3 — Senior Developer

開始實作。

要求：

- 保持 Coding Style

- 優先重用既有程式

- 避免重複程式

- Function 單一職責

不得：

- Copy & Paste Programming

- Magic Number

- Hard Code

---

## Step 4 — Security Reviewer

完成後必須檢查：

- Input Validation

- XSS

- Injection

- Authorization

- Authentication

- LockService

- Error Handling

若發現 Critical Issue：

不得進入下一步。

---

## Step 5 — QA Engineer

確認：

- 功能正常

- Regression Test

- API 相容

- UI 未破壞

- Google Sheet Schema 未改變

---

## Step 6 — Performance Reviewer

確認：

- API 呼叫數

- DOM Render

- GAS IO

- Event Binding

- Memory Usage

不得：

- 無意義重新 Render

- 重複 API

---

## Step 7 — Release Manager

輸出 Release Note。

格式固定。

---

# Sprint Output Format

每次 Sprint 必須提供：

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

# Coding Standards

## JavaScript

- 使用 ES6+

- const 優先

- let 次之

- 避免 var

- Function 不超過 80 行

- 避免巢狀超過 3 層

---

## Google Apps Script

必須：

- Validation

- try/catch

- 統一 Response

- LockService（需要時）

---

## API

Response 統一：

```json

{

  "success": true,

  "message": "",

  "data": {}

}

```

Error：

```json

{

  "success": false,

  "message": "...",

  "data": null

}

```

---

# UI Rules

不得：

- 任意修改 UI

- 任意修改 CSS

- 任意新增動畫

除非需求明確要求。

---

# Google Sheet Rules

不得：

- 修改 Sheet Name

- 修改欄位順序

- 修改 Schema

若需修改：

必須：

1. 提出 Migration Plan

2. 更新 [API.md](http://API.md)

3. 更新 [CHANGELOG.md](http://CHANGELOG.md)

---

# Dependency Rules

不得：

- 任意新增 CDN

- 任意新增 Library

- 任意新增 Framework

除非：

需求明確要求。

---

# Security Rules

必須：

- Validation

- Error Handling

- Authorization

- Input Sanitization

- Output Encoding

---

# Review Rules

每次完成程式後：

至少完成：

- Functional Review

- Security Review

- Code Review

- Performance Review

---

# AI Rules

AI Assistant 必須：

先閱讀：

- [README.md](http://README.md)

- [PROJECT.md](http://PROJECT.md)

- [API.md](http://API.md)

- UI_[GUIDE.md](http://GUIDE.md)

- [CHANGELOG.md](http://CHANGELOG.md)

- [CONTRIBUTING.md](http://CONTRIBUTING.md)

不得：

- 臆測需求

- 任意重構

- 任意新增功能

- 任意修改架構

若需求不明：

必須先詢問。

---

# Git Rules

Commit 應遵循：

feat:

fix:

refactor:

docs:

style:

test:

chore:

例如：

feat(history): add delete button

fix(api): validate user id

refactor(gas): extract validation

---

# Version Rules

RC

↓

Beta

↓

Release

Patch：

RC3.0.1

RC3.0.2

RC3.1

V1.0

---

# Definition of Done

本 Sprint 必須符合：

☑ 功能完成

☑ 無 Syntax Error

☑ Security Review 完成

☑ QA 完成

☑ Release Note 完成

☑ 無 Blocking Issue

否則不得標示為完成。

---

# Project Principle

本專案重視：

品質 > 功能

安全 > 速度

可維護性 > 快速完成

每次修改都應讓專案變得更容易維護，而不是更複雜。