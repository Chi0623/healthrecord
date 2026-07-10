# API.md

## 目的

本文件定義 SafeBP 前端與 Google Apps Script 之間的 API 規格。

所有 API 皆透過 `js/api.js` 呼叫，不得在其他前端模組直接 `fetch()`。

目前前端為了提升 Google Apps Script Web App 相容性，`apiRequest()` 採用 `POST + URLSearchParams` 送出；後端 `Code.gs` 同時相容表單資料與 JSON body。

## 共用 Response 格式

Success:

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "...",
  "data": null
}
```

## 目前 API

- `saveRecord()`
- `updateRecord()`
- `deleteRecord()`
- `getRecords()`
- `getTodayRecord()`
- `getTrend()`

## saveRecord()

新增血壓紀錄。

Request:

```json
{
  "action": "saveRecord",
  "user": "爸爸",
  "sys": 120,
  "dia": 78,
  "pulse": 72,
  "ihb": false
}
```

Response:

```json
{
  "success": true,
  "message": "儲存成功",
  "data": {
    "id": "UUID"
  }
}
```

## updateRecord()

更新指定使用者的血壓紀錄。

Request:

```json
{
  "action": "updateRecord",
  "id": "UUID",
  "user": "爸爸",
  "sys": 121,
  "dia": 79,
  "pulse": 73,
  "ihb": false
}
```

Response:

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": "UUID"
  }
}
```

## deleteRecord()

刪除指定使用者的血壓紀錄。

Request:

```json
{
  "action": "deleteRecord",
  "id": "UUID",
  "user": "爸爸"
}
```

Response:

```json
{
  "success": true,
  "message": "刪除成功",
  "data": {
    "id": "UUID"
  }
}
```

注意事項：

- `id` 與 `user` 必須同時符合才會刪除。
- 不修改 Google Sheet 欄位。

## getRecords()

取得指定使用者全部血壓紀錄。

Request:

```json
{
  "action": "getRecords",
  "user": "爸爸"
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "UUID",
      "datetime": "2026-07-01T10:15:00.000Z",
      "user": "爸爸",
      "sys": 120,
      "dia": 78,
      "pulse": 72,
      "ihb": false
    }
  ]
}
```

## getTodayRecord()

取得指定使用者最新一次血壓紀錄。

Request:

```json
{
  "action": "getTodayRecord",
  "user": "爸爸"
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "UUID",
    "datetime": "2026-07-01T10:15:00.000Z",
    "sys": 120,
    "dia": 78,
    "pulse": 72,
    "ihb": false
  }
}
```

說明：

- 此 API 會回傳該使用者最新一筆資料，不限制必須是今天。
- 實作方式為從資料尾端往前尋找，找到該使用者第一筆即回傳。
- 若無任何資料，`data` 為 `null`。

## getTrend()

取得指定使用者趨勢資料。

Request:

```json
{
  "action": "getTrend",
  "user": "爸爸",
  "days": 30
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "date": "2026-07-01T10:15:00.000Z",
      "sys": 120,
      "dia": 78,
      "pulse": 72
    }
  ]
}
```

說明：

- 趨勢頁目前以前端 `getRecords()` 為主要資料來源，再依區間與時段進行篩選與統計。
- `getTrend()` API 仍保留，作為後端趨勢資料接口，未移除。
- 回傳欄位中的時間鍵目前為 `date`。

## Validation

後端會驗證：

- `user` 不可空白
- `sys` 必須為有限數字，範圍 50-280
- `dia` 必須為有限數字，範圍 30-180
- `pulse` 必須為有限數字，範圍 30-220
- `dia` 必須小於 `sys`
- `updateRecord()` 與 `deleteRecord()` 必須提供 `id`
- `updateRecord()` 與 `deleteRecord()` 必須同時符合 `id` 與 `user`
