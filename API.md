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
- `getUsers()`
- `renameUser()`
- `writeDiagnostics()`

## getUsers()

測試 Apps Script 與工作表連線，並取得目前所有使用者姓名。

Request:

```json
{
  "action": "getUsers"
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": ["爸爸", "媽媽"]
}
```

## renameUser()

重新命名使用者，並同步更新該姓名在工作表中的所有紀錄。

Request:

```json
{
  "action": "renameUser",
  "oldUser": "爸爸",
  "newUser": "父親"
}
```

Response:

```json
{
  "success": true,
  "message": "使用者姓名已更新",
  "data": {
    "updated": 12
  }
}
```

## saveRecord()

新增血壓紀錄。

Request:

```json
{
  "action": "saveRecord",
  "id": "UUID",
  "requestId": "UUID",
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
    "id": "UUID",
    "duplicate": false
  }
}
```

注意事項：

- 新版前端在第一次送出前產生 `id`，並以同一值作為 `requestId`。
- 相同資料因網路或 HTTP 回應失敗而重送時，沿用相同的 `id`。
- Apps Script 若找到相同 `id` 且內容一致，回傳成功與 `duplicate: true`，不再新增資料列。
- 舊版前端未傳 `id` 時，Apps Script 仍會產生 UUID，以維持向下相容。
- `requestId` 僅用於診斷與跨前後端紀錄對照，不應包含姓名或量測值。

## API 診斷紀錄

前端在瀏覽器本機保存最近 50 次 API 結果，欄位包含時間、`diagnosticId`、`requestId`、動作、結果類型、HTTP 狀態、是否轉址、最終回應網域、回應格式與耗時。紀錄不包含姓名、量測值或完整 Apps Script 網址。

未同步的紀錄會在下一次 API 成功後，以最多 20 筆為一批呼叫 `writeDiagnostics()`，寫入 Google Sheet 的「系統診斷」分頁。上傳本身不再產生診斷紀錄，以免遞迴；上傳失敗也不影響原本的讀取或血壓存檔。

可在瀏覽器開發工具使用：

```js
getApiDiagnostics()
clearApiDiagnostics()
```

Apps Script 使用相同 `requestId` 輸出結構化執行紀錄，包括 `REQUEST_RECEIVED`、`VALIDATED`、`DUPLICATE_FOUND`、`ROW_APPENDED`、`RESPONSE_CREATED` 與 `FAILED`。

## writeDiagnostics()

批次保存瀏覽器端的非敏感診斷紀錄。`entries` 是 JSON 字串，單次最多 20 筆；Apps Script 以 `diagnosticId` 去重。

Google Sheet 最多保留 1000 筆診斷資料，超過時刪除最舊資料。診斷資料不得包含姓名、血壓、脈搏、完整 Apps Script 網址或部署 ID。

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
