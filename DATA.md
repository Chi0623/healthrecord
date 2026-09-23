**用途：** 資料結構文件



[DATA.md](http://DATA.md) 用來定義 Google Sheet、資料格式與各欄位用途，是整個專案唯一的資料來源（Single Source of Truth）。



### Google Sheet



工作表名稱：



```

血壓紀錄

```



### 資料表結構



| 欄位 | 名稱 | 型別 | 說明 |

|------|------|------|------|

| A | user | Text | 使用者名稱 |

| B | date | Date | 量測日期 |

| C | time | Time | 量測時間 |

| D | sys | Number | 收縮壓 |

| E | dia | Number | 舒張壓 |

| F | pulse | Number | 脈搏 |

| G | ihb | Boolean | 不規則心跳 |

| H | recordId | UUID | 紀錄唯一識別碼；新增重送時作為防重鍵 |



### 資料限制



- sys：50～280

- dia：30～180

- pulse：30～220

- ihb：true / false

- recordId：UUID

同一次新增操作即使因 HTTP 回應失敗而重送，也必須沿用相同的 `recordId`。後端在寫入鎖內以此欄位判斷是否已完成新增，不增加其他工作表欄位。

### 系統診斷工作表

Apps Script 會自動建立 `系統診斷` 分頁，最多保留最近 1000 筆。

| 欄位 | 說明 |
|------|------|
| 接收時間 | Apps Script 收到診斷紀錄的時間 |
| 事件時間 | 瀏覽器或伺服器記錄事件的時間 |
| DiagnosticID | 診斷事件防重識別碼 |
| RequestID | 對照同一次前後端請求 |
| 來源 | `client` 或 `server` |
| 動作 | 例如 `saveRecord`、`getRecords` |
| 階段或結果 | 例如 `http-error`、`RESPONSE_CREATED`、`FAILED` |
| HTTP狀態 | 瀏覽器實際收到的狀態碼 |
| 經過轉址 | 是否經過轉址 |
| 回應網域 | 只保存網域，不保存完整網址 |
| 回應格式 | HTTP Content-Type |
| 耗時ms | 執行時間 |
| 錯誤摘要 | 最長 200 字的錯誤摘要 |
| App版本 | 前端或 Apps Script 版本 |

本分頁不得保存姓名、血壓值、脈搏、IP、完整 User-Agent、完整 Apps Script 網址或部署 ID。
