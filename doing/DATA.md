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

| H | recordId | UUID | 紀錄唯一識別碼 |



### 資料限制



- sys：50～280

- dia：30～180

- pulse：30～220

- ihb：true / false

- recordId：UUID
