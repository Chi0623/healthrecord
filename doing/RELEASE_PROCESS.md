# RELEASE_[PROCESS.md](http://PROCESS.md)

# 安心血壓（SafeBP）

Version：v1.0

Status：Official Release Management Process

---

# 目的（Purpose）

本文件定義「安心血壓」專案從開發、測試到正式發布（Release）的完整流程。

所有版本（Prototype、RC、正式版）皆須遵守本流程。

目的：

- 提高版本品質

- 降低發布風險

- 保持版本可追蹤

- 確保長輩實際可使用

- 建立長期維護流程

---

# Release Flow

```

需求

↓

[TASK.md](http://TASK.md)

↓

Architecture Design

↓

Coding

↓

Self Review

↓

REVIEW_CHECKLIST

↓

Bug Fix

↓

Code Review

↓

RC Release

↓

Family Test

↓

Bug Fix

↓

Release Candidate

↓

Regression Test

↓

Documentation Update

↓

正式發布（Release）

```

---

# Version Rules

專案版本統一使用：

```

Prototype

↓

Alpha

↓

Beta

↓

RC（Release Candidate）

↓

Release（正式版）

↓

Patch

↓

Minor

↓

Major

```

---

## Version Naming

例如：

```

v0.1 Prototype

v0.2 Prototype

Alpha 1

Beta 1

RC1

RC2

RC3

v1.0 Release

v1.0.1

v1.1

v2.0

```

---

# Development Stage

## Prototype

目的：

快速驗證功能。

允許：

- UI 不完整

- 程式重構

- API 調整

不要求：

完整測試。

---

## Alpha

目的：

功能開發。

要求：

主要功能可使用。

允許：

Bug。

---

## Beta

目的：

功能完成。

開始：

UI 優化。

開始：

測試。

---

## RC（Release Candidate）

目的：

接近正式版。

要求：

不得：

新增大型功能。

只允許：

- Bug Fix

- UX 改善

- 效能改善

- 文件更新

---

## Release

正式版本。

要求：

所有功能完成。

所有文件完成。

所有測試完成。

---

# RC Release Checklist

每一個 RC：

必須完成：

```

□

Coding

□

Self Review

□

REVIEW_CHECKLIST

□

Console Review

□

Architecture Review

□

Performance Review

□

UI Review

□

Family Test

□

Bug Fix

□

Regression Test

```

---

# Family Test（家庭測試）

安心血壓的主要使用者：

家庭成員。

因此：

正式發布前，

至少：

進行：

家庭測試。

---

## 測試對象

例如：

- 父親

- 母親

- 長輩

---

## 測試內容

```

開啟 App

↓

輸入血壓

↓

儲存

↓

查看 History

↓

查看 Trend

↓

修改

↓

再次查看

```

---

## 記錄

記錄：

- 操作困難

- 字體太小

- 按鈕不好按

- 看不懂文字

- Bug

全部：

寫入：

CHANGELOG。

---

# Bug Priority

Bug

分級：

---

## Critical

無法使用。

例如：

- 無法儲存

- API 壞掉

- 白畫面

- Crash

必須：

立即修正。

不得：

Release。

---

## Major

主要功能異常。

例如：

- History 錯誤

- Chart 錯誤

- Today Card 錯誤

應：

Release 前修正。

---

## Minor

例如：

- Icon

- 字距

- 顏色

- 動畫

可：

下一版。

---

## Enhancement

例如：

UX。

動畫。

新的功能。

不列為 Bug。

---

# Regression Test

每次：

Release

必須：

重新測試：

```

首頁

History

Trend

Google Sheet

Today Card

Edit

Delete

Chart

API

```

確保：

沒有：

舊功能壞掉。

---

# Documentation Update

發布前：

必須：

同步更新：

```

[README.md](http://README.md)

[PROJECT.md](http://PROJECT.md)

[ROADMAP.md](http://ROADMAP.md)

[CHANGELOG.md](http://CHANGELOG.md)

[TASK.md](http://TASK.md)

[TODO.md](http://TODO.md)

[API.md](http://API.md)

```

不得：

只修改程式。

---

# Release Candidate Approval

RC

可以：

發布。

必須：

全部：

通過：

```

Review

QA

Console

Family Test

Regression Test

```

---

# Release Approval

正式版：

需要：

全部：

完成：

```

✓

功能

✓

文件

✓

測試

✓

Review

✓

沒有 Critical Bug

✓

沒有 Major Bug

```

---

# Release Package

正式版：

包含：

```

index.html

css/

js/

assets/

[Code.gs](http://Code.gs)

manifest.json

sw.js

docs/

```

不得：

包含：

```

test

draft

temp

backup

old

debug

```

---

# Post Release

發布後：

24 小時內：

觀察：

```

Console Error

API Error

Google Sheet

Family Feedback

```

---

72 小時內：

整理：

```

Bug

Suggestion

Next Version

```

更新：

```

[TODO.md](http://TODO.md)

[ROADMAP.md](http://ROADMAP.md)

```

---

# Hotfix Process

若：

正式版：

發現：

Critical Bug。

流程：

```

Bug Report

↓

Hotfix Branch

↓

Review

↓

Regression Test

↓

Release

↓

CHANGELOG

↓

Tag

```

版本：

例如：

```

v1.0.1

v1.0.2

```

---

# AI Release Rules

AI

不得：

直接：

宣布：

Release。

必須：

完成：

```

Coding

↓

Review

↓

QA

↓

REVIEW_CHECKLIST

↓

Regression

↓

Documentation

↓

Delivery

```

AI：

交付的是：

Release Candidate。

不是：

正式版。

---

# Release Definition

符合：

以下：

全部：

才算：

Release。

```

✓

沒有 Critical Bug

✓

沒有 Major Bug

✓

Google Sheet 正常

✓

API 正常

✓

History 正常

✓

Trend 正常

✓

Today Card 正常

✓

文件完整

✓

Code Review 完成

✓

REVIEW_CHECKLIST 完成

✓

Family Test 通過

```

---

# Final Principle

> 每一次 Release，不只是發布新功能，而是交付一個穩定、可靠、可長期維護的產品。

功能可以慢一點完成，但正式版不應犧牲穩定性與使用者體驗。

---

Version：v1.0

Status：Official Release Management Process

Maintainer：SafeBP Engineering Team