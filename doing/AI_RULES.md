**用途：** AI 開發規範



AI_[RULES.md](http://RULES.md) 是整個專案最重要的規範文件之一，所有 AI 在開始修改程式前都應先閱讀本文件。



### 內容包含



#### 專案開發原則



- 不破壞既有功能

- 不修改 Google Sheet 資料結構

- 不任意修改 API 格式

- 保持向下相容

- 每次修改都需考慮長輩使用體驗



#### JavaScript 規範



- 使用 ES6+

- 優先使用 async / await

- 不建立重複函式

- 保持函式單一職責

- 所有函式需具備可讀性



#### HTML 規範



- 採用語意化 HTML

- 保持結構簡潔

- 使用一致的 class 命名

- 支援無障礙設計（Accessibility）



#### CSS 規範



- 採 Apple Human Interface Guidelines

- 支援 Dark Mode

- 大字體、大按鈕

- 使用 CSS Variables 管理色彩

- 避免過度巢狀選擇器



#### Google Apps Script 規範



- API 回傳格式一致

- 使用 LockService 保護寫入

- 所有錯誤皆需回傳 success 與 message

- 不直接修改 Sheet 結構



#### Code Review 規範



AI 完成程式後需自行檢查：



- Console Error

- JavaScript Error

- Null Reference

- 重複事件綁定

- API 相容性

- 程式可讀性

- 效能問題

- 是否破壞既有功能