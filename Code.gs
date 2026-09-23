/* ==========================================================
   安心血壓 v1.0 RC4
   Google Apps Script
========================================================== */

const CONFIG = {

    SHEET_NAME: "血壓紀錄",

    DIAGNOSTIC_SHEET_NAME: "系統診斷",

    DIAGNOSTIC_MAX_ROWS: 1000,

    DIAGNOSTIC_BATCH_LIMIT: 20,
  
    TIMEZONE: Session.getScriptTimeZone()
  
  };

const SHEET_HEADERS = [

  "姓名",

  "日期",

  "時間",

  "SYS",

  "DIA",

  "Pulse",

  "IHB",

  "RecordID"

];

const DIAGNOSTIC_HEADERS = [

  "接收時間",

  "事件時間",

  "DiagnosticID",

  "RequestID",

  "來源",

  "動作",

  "階段或結果",

  "HTTP狀態",

  "經過轉址",

  "回應網域",

  "回應格式",

  "耗時ms",

  "錯誤摘要",

  "App版本"

];
  
  /* ==========================================================
     POST
  ========================================================== */
  
  function doPost(e) {

    const startedAt = Date.now();
    let data = {};
    let requestId = getRequestIdFromEvent(e);
    let action = "unknown";

    logApiEvent("REQUEST_RECEIVED", requestId, action, {
      durationMs: 0
    });
  
    try {
  
      if (!e) {
  
        return json(errorResponse("沒有收到資料"));
  
      }
  
      data = parseRequestData(e);

      requestId = normalizeRequestId(data.requestId || requestId);
      action = String(data.action || "unknown");
  
      let result;
  
      switch (data.action) {
  
        case "saveRecord":
          result = saveRecord(data);
          break;
  
        case "getRecords":
          result = getRecords(data);
          break;
  
        case "updateRecord":
          result = updateRecord(data);
          break;
  
        case "deleteRecord":
          result = deleteRecord(data);
          break;
  
        case "getTodayRecord":
          result = getTodayRecord(data);
          break;
  
        case "getTrend":
          result = getTrend(data);
          break;

        case "getUsers":
          result = getUsers();
          break;

        case "renameUser":
          result = renameUser(data);
          break;

        case "writeDiagnostics":
          result = writeDiagnostics(data);
          break;
  
        default:
          result = errorResponse("未知的 API 動作");
  
      }

      logApiEvent("RESPONSE_CREATED", requestId, action, {
        success: Boolean(result && result.success),
        durationMs: Date.now() - startedAt
      });

      if (action !== "writeDiagnostics") {

        const diagnosticStage = action === "saveRecord" && result && result.success
          ? (result.data && result.data.duplicate
            ? "DUPLICATE_FOUND"
            : "ROW_APPENDED")
          : "RESPONSE_CREATED";

        persistServerDiagnosticSafe({
          requestId: requestId,
          action: action,
          stage: diagnosticStage,
          durationMs: Date.now() - startedAt,
          error: result && result.success
            ? ""
            : String(result && result.message || "API 錯誤")
        });

      }
  
      return json(result);
  
    } catch (err) {

      logApiEvent("FAILED", requestId, action, {
        error: String(err.message || err.toString()).slice(0, 200),
        durationMs: Date.now() - startedAt
      });

      if (action !== "writeDiagnostics") {

        persistServerDiagnosticSafe({
          requestId: requestId,
          action: action,
          stage: "FAILED",
          durationMs: Date.now() - startedAt,
          error: String(err.message || err.toString())
        });

      }
  
      return json(errorResponse(err.message || err.toString()));
  
    }
  
  }

  function getRequestIdFromEvent(e) {

    const parameterValue = e && e.parameter
      ? e.parameter.requestId
      : "";

    if (parameterValue) {

      return normalizeRequestId(parameterValue);

    }

    const raw = e && e.postData
      ? String(e.postData.contents || "").trim()
      : "";

    if (raw.charAt(0) === "{") {

      try {

        return normalizeRequestId(JSON.parse(raw).requestId);

      } catch (err) {

        // Malformed JSON is handled by parseRequestData().

      }

    }

    return normalizeRequestId("");

  }

  function normalizeRequestId(value) {

    const requestId = String(value || "").trim();

    return requestId || "server-" + Utilities.getUuid();

  }

  function logApiEvent(stage, requestId, action, details) {

    const entry = Object.assign({
      timestamp: new Date().toISOString(),
      requestId: normalizeRequestId(requestId),
      action: String(action || "unknown"),
      stage: String(stage || "UNKNOWN")
    }, details || {});

    console.log(JSON.stringify(entry));

  }

  function parseRequestData(e) {

    const raw = e && e.postData
      ? String(e.postData.contents || "").trim()
      : "";

    if (raw) {

      const firstChar = raw.charAt(0);

      if (firstChar === "{" || firstChar === "[") {

        return JSON.parse(raw);

      }

    }

    const params = e && e.parameter ? e.parameter : {};

    if (Object.keys(params).length) {

      return normalizeRequestData(params);

    }

    throw new Error("沒有收到資料");

  }

  function normalizeRequestData(data) {

    const result = {};

    Object.keys(data || {}).forEach(function(key) {

      result[key] = normalizeRequestValue(data[key]);

    });

    return result;

  }

  function normalizeRequestValue(value) {

    if (Array.isArray(value)) {

      return value.map(normalizeRequestValue);

    }

    if (value === "true") {

      return true;

    }

    if (value === "false") {

      return false;

    }

    return value;

  }
  
  /* ==========================================================
     JSON
  ========================================================== */
  
  function json(obj) {
  
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  
  }

  /* ==========================================================
     API Response
  ========================================================== */

  function successResponse(message, data) {

    return {

      success: true,

      message: message || "",

      data: data === undefined ? {} : data

    };

  }

  function errorResponse(message) {

    return {

      success: false,

      message: message || "發生錯誤",

      data: null

    };

  }
  
  /* ==========================================================
     Sheet
  ========================================================== */
  
  function sheet() {
  
    const ws = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_NAME);
  
    if (!ws) {
  
      throw new Error("找不到工作表：血壓紀錄");
  
    }
  
    return ws;
  
  }

  function ensureSheetHeader(ws) {

    const headerRange = ws.getRange(1, 1, 1, SHEET_HEADERS.length);

    const values = headerRange.getValues()[0];

    const matched = SHEET_HEADERS.every(function(header, index) {

      return String(values[index] || "").trim() === header;

    });

    if (!matched) {

      headerRange.setValues([SHEET_HEADERS]);

    }

  }

  /* ==========================================================
     Diagnostics Sheet
  ========================================================== */

  function diagnosticSheet() {

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let ws = spreadsheet.getSheetByName(CONFIG.DIAGNOSTIC_SHEET_NAME);

    if (!ws) {

      ws = spreadsheet.insertSheet(CONFIG.DIAGNOSTIC_SHEET_NAME);

    }

    const headerRange = ws.getRange(1, 1, 1, DIAGNOSTIC_HEADERS.length);
    const values = headerRange.getValues()[0];
    const matched = DIAGNOSTIC_HEADERS.every(function(header, index) {

      return String(values[index] || "").trim() === header;

    });

    if (!matched) {

      headerRange.setValues([DIAGNOSTIC_HEADERS]);

    }

    return ws;

  }

  function sanitizeDiagnosticText(value, maxLength) {

    let text = String(value === undefined || value === null ? "" : value)
      .replace(/[\r\n\t]+/g, " ")
      .trim()
      .slice(0, maxLength);

    if (/^[=+\-@]/.test(text)) {

      text = "'" + text;

    }

    return text;

  }

  function normalizeDiagnosticNumber(value, minimum, maximum) {

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return Math.min(maximum, Math.max(minimum, Math.round(number)));

  }

  function normalizeClientDiagnostic(entry) {

    if (!entry || typeof entry !== "object") {

      throw new Error("診斷紀錄格式錯誤");

    }

    const diagnosticId = sanitizeDiagnosticText(entry.diagnosticId, 80);

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(diagnosticId)) {

      throw new Error("DiagnosticID 格式錯誤");

    }

    const timestamp = sanitizeDiagnosticText(entry.timestamp, 40);

    return {
      diagnosticId: diagnosticId,
      row: [
        new Date(),
        timestamp,
        diagnosticId,
        sanitizeDiagnosticText(entry.requestId, 80),
        "client",
        sanitizeDiagnosticText(entry.action, 40),
        sanitizeDiagnosticText(entry.outcome, 40),
        normalizeDiagnosticNumber(entry.status, 0, 599),
        entry.redirected === true ? true : false,
        sanitizeDiagnosticText(entry.responseHost, 120),
        sanitizeDiagnosticText(entry.responseFormat, 80),
        normalizeDiagnosticNumber(entry.durationMs, 0, 300000),
        sanitizeDiagnosticText(entry.error, 200),
        sanitizeDiagnosticText(entry.appVersion, 40)
      ]
    };

  }

  function appendDiagnosticRows(items) {

    const ws = diagnosticSheet();
    const lastRow = ws.getLastRow();
    const existingIds = new Set();

    if (lastRow > 1) {

      ws.getRange(2, 3, lastRow - 1, 1)
        .getValues()
        .forEach(function(row) {

          existingIds.add(String(row[0] || ""));

        });

    }

    const rows = [];
    const acceptedIds = [];

    items.forEach(function(item) {

      acceptedIds.push(item.diagnosticId);

      if (existingIds.has(item.diagnosticId)) return;

      existingIds.add(item.diagnosticId);
      rows.push(item.row);

    });

    if (rows.length) {

      ws.getRange(
        ws.getLastRow() + 1,
        1,
        rows.length,
        DIAGNOSTIC_HEADERS.length
      ).setValues(rows);

    }

    const dataRowCount = Math.max(0, ws.getLastRow() - 1);
    const overflow = dataRowCount - CONFIG.DIAGNOSTIC_MAX_ROWS;

    if (overflow > 0) {

      ws.deleteRows(2, overflow);

    }

    return {
      acceptedIds: acceptedIds,
      insertedCount: rows.length
    };

  }

  function writeDiagnostics(data) {

    let entries;

    try {

      entries = typeof data.entries === "string"
        ? JSON.parse(data.entries)
        : data.entries;

    } catch (err) {

      throw new Error("診斷紀錄不是有效的 JSON");

    }

    if (!Array.isArray(entries) || !entries.length) {

      throw new Error("沒有診斷紀錄");

    }

    if (entries.length > CONFIG.DIAGNOSTIC_BATCH_LIMIT) {

      throw new Error("單次診斷紀錄不可超過 20 筆");

    }

    const items = entries.map(normalizeClientDiagnostic);
    const lock = LockService.getDocumentLock();

    lock.waitLock(3000);

    try {

      const result = appendDiagnosticRows(items);

      return successResponse("診斷紀錄已同步", result);

    } finally {

      lock.releaseLock();

    }

  }

  function persistServerDiagnosticSafe(details) {

    try {

      const timestamp = new Date();
      const requestId = sanitizeDiagnosticText(details.requestId, 80);
      const stage = sanitizeDiagnosticText(details.stage, 40);
      const diagnosticId = sanitizeDiagnosticText(
        requestId + "-server-" + stage,
        180
      );
      const lock = LockService.getDocumentLock();

      lock.waitLock(3000);

      try {

        appendDiagnosticRows([{
          diagnosticId: diagnosticId,
          row: [
            timestamp,
            timestamp.toISOString(),
            diagnosticId,
            requestId,
            "server",
            sanitizeDiagnosticText(details.action, 40),
            stage,
            "",
            "",
            "",
            "application/json",
            normalizeDiagnosticNumber(details.durationMs, 0, 300000),
            sanitizeDiagnosticText(details.error, 200),
            "v1.0 RC4"
          ]
        }]);

      } finally {

        lock.releaseLock();

      }

    } catch (err) {

      console.error("[Diagnostic Sheet] " + String(err.message || err));

    }

  }

  function isLegacyRow(row) {

    return row.length <= 7 && typeof row[6] === "boolean";

  }

  function isCurrentRow(row) {

    return row.length >= 8;

  }

  function buildDateTime(dateValue, timeValue) {

    if (!dateValue && !timeValue) {

      return null;

    }

    let date;

    const dateText = String(dateValue || "").trim();

    const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateMatch) {

      date = new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3])
      );

    } else {

      date = new Date(dateValue);

    }

    if (Number.isNaN(date.getTime())) {

      return null;

    }

    const merged = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const timeParts = extractTimeParts(timeValue);

    if (!timeParts) {

      return merged;

    }

    merged.setHours(
      timeParts.hours,
      timeParts.minutes,
      timeParts.seconds,
      0
    );

    return merged;

  }

  function extractTimeParts(timeValue) {

    if (timeValue instanceof Date && !Number.isNaN(timeValue.getTime())) {

      const timeText = Utilities.formatDate(
        timeValue,
        CONFIG.TIMEZONE,
        "HH:mm:ss"
      );

      return extractTimeParts(timeText);

    }

    if (typeof timeValue === "number" && Number.isFinite(timeValue)) {

      const dayFraction = ((timeValue % 1) + 1) % 1;

      const totalSeconds = Math.round(dayFraction * 86400) % 86400;

      const hours = Math.floor(totalSeconds / 3600);

      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const seconds = totalSeconds % 60;

      return {
        hours: hours,
        minutes: minutes,
        seconds: seconds
      };

    }

    const text = String(timeValue || "").trim();

    if (!text) {

      return null;

    }

    const match = text.match(
      /(\d{1,2}):(\d{2})(?::(\d{2}))?/
    );

    if (!match) {

      return null;

    }

    return {
      hours: Number(match[1]),
      minutes: Number(match[2]),
      seconds: Number(match[3] || 0)
    };

  }

  function readRowRecord(row) {

    if (!row || !row.length) {

      return null;

    }

    if (isLegacyRow(row)) {

      return {

        id: row[0],

        datetime: row[1],

        user: row[2],

        sys: row[3],

        dia: row[4],

        pulse: row[5],

        ihb: Boolean(row[6])

      };

    }

    if (isCurrentRow(row)) {

      return {

        id: row[7],

        datetime: buildDateTime(row[1], row[2]),

        user: row[0],

        sys: row[3],

        dia: row[4],

        pulse: row[5],

        ihb: Boolean(row[6])

      };

    }

    return {

      id: row[6],

      datetime: buildDateTime(row[1], row[2]),

      user: row[0],

      sys: row[3],

      dia: row[4],

      pulse: row[5],

      ihb: null

    };

  }

  function createSheetRow(record, datetime) {

    const measuredAt = datetime || new Date();

    return [

      record.user,

      Utilities.formatDate(measuredAt, CONFIG.TIMEZONE, "yyyy-MM-dd"),

      Utilities.formatDate(measuredAt, CONFIG.TIMEZONE, "HH:mm:ss"),

      record.sys,

      record.dia,

      record.pulse,

      Boolean(record.ihb),

      record.id

    ];

  }

  function findRecordRow(values, record) {

    for (let i = 1; i < values.length; i++) {

      const current = readRowRecord(values[i]);

      if (!current) continue;

      if (
        String(current.id) === record.id &&
        String(current.user) === record.user
      ) {

        return {
          index: i,
          data: current
        };

      }

    }

    return null;

  }

  function isSameRecordContent(existing, record) {

    return (
      String(existing.user) === String(record.user) &&
      Number(existing.sys) === Number(record.sys) &&
      Number(existing.dia) === Number(record.dia) &&
      Number(existing.pulse) === Number(record.pulse) &&
      Boolean(existing.ihb) === Boolean(record.ihb)
    );

  }

  function normalizeRecordId(value) {

    const id = String(value || "").trim();

    if (!id) {

      return "";

    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(id)) {

      throw new Error("紀錄 ID 格式錯誤");

    }

    return id;

  }

  function findRecordById(ws, id) {

    const lastRow = ws.getLastRow();

    if (lastRow <= 1) {

      return null;

    }

    const ids = ws
      .getRange(2, SHEET_HEADERS.length, lastRow - 1, 1)
      .getValues();

    for (let i = 0; i < ids.length; i++) {

      if (String(ids[i][0]) !== String(id)) continue;

      const row = ws
        .getRange(i + 2, 1, 1, SHEET_HEADERS.length)
        .getValues()[0];

      return readRowRecord(row);

    }

    return null;

  }

  /* ==========================================================
     Validation
  ========================================================== */

  function validateRecordInput(data, options) {

    options = options || {};

    const requireId = Boolean(options.requireId);

    const requireValues = options.requireValues !== false;

    if (!data) {

      throw new Error("缺少資料");

    }

    const user = String(data.user || "").trim();

    if (!user) {

      throw new Error("缺少使用者");

    }

    if (requireId && !String(data.id || "").trim()) {

      throw new Error("缺少紀錄 ID");

    }

    if (!requireValues) {

      return {

        id: String(data.id || "").trim(),

        user

      };

    }

    const sys = Number(data.sys);

    const dia = Number(data.dia);

    const pulse = Number(data.pulse);

    if (!Number.isFinite(sys) || sys < 50 || sys > 280) {

      throw new Error("收縮壓錯誤");

    }

    if (!Number.isFinite(dia) || dia < 30 || dia > 180) {

      throw new Error("舒張壓錯誤");

    }

    if (!Number.isFinite(pulse) || pulse < 30 || pulse > 220) {

      throw new Error("脈搏錯誤");

    }

    if (dia >= sys) {

      throw new Error("舒張壓不能大於收縮壓");

    }

    return {

      id: String(data.id || "").trim(),

      user,

      sys,

      dia,

      pulse,

      ihb: Boolean(data.ihb)

    };

  }
  
  /* ==========================================================
     Save
  ========================================================== */
  
  function saveRecord(data) {
  
    const lock = LockService.getDocumentLock();
  
    lock.waitLock(3000);
  
    try {
  
      const ws = sheet();

      ensureSheetHeader(ws);

      const record = validateRecordInput(data);
  
      const id = normalizeRecordId(data.id || data.requestId) ||
        Utilities.getUuid();

      record.id = id;

      logApiEvent("VALIDATED", data.requestId || id, "saveRecord");

      const existing = findRecordById(ws, id);

      if (existing) {

        if (!isSameRecordContent(existing, record)) {

          throw new Error("紀錄識別碼重複，內容不一致");

        }

        logApiEvent("DUPLICATE_FOUND", data.requestId || id, "saveRecord");

        return successResponse("紀錄已儲存", {
          id: id,
          duplicate: true
        });

      }
  
      const now = new Date();

      ws.appendRow(
        createSheetRow(
          {
            id: id,
            user: record.user,
            sys: record.sys,
            dia: record.dia,
            pulse: record.pulse,
            ihb: record.ihb
          },
          now
        )
      );

      logApiEvent("ROW_APPENDED", data.requestId || id, "saveRecord");
  
      return successResponse("儲存成功", {

        id: id,
        duplicate: false

      });
  
    }
  
    finally {
  
      lock.releaseLock();
  
    }
  }
  
  
  
  /* ==========================================================
     Get Records
  ========================================================== */
  
  function getRecords(data) {
  
    const user = validateRecordInput(data, {

      requireValues: false

    }).user;

    const ws = sheet();

    ensureSheetHeader(ws);
  
    const values = ws.getDataRange().getValues();
  
    const result = [];
  
    for (let i = 1; i < values.length; i++) {
  
      const record = readRowRecord(values[i]);

      if (!record) continue;

      if (record.user != user) continue;

      result.push(record);
  
    }
  
    result.sort(function(a, b){
  
      return new Date(b.datetime) - new Date(a.datetime);
  
    });
  
    return successResponse("", result);
  
  }

  function getUsers() {

    const ws = sheet();

    ensureSheetHeader(ws);

    const lastRow = ws.getLastRow();

    if (lastRow <= 1) {

      return successResponse("", []);

    }

    const values = ws.getRange(2, 1, lastRow - 1, 1).getValues();

    const names = values
      .map(function(row) {
        return String(row[0] || "").trim();
      })
      .filter(function(name) {
        return Boolean(name);
      })
      .filter(function(name, index, list) {
        return list.indexOf(name) === index;
      })
      .sort();

    return successResponse("", names);

  }

  function renameUser(data) {

    const oldUser = String(data && data.oldUser || "").trim();
    const newUser = String(data && data.newUser || "").trim();

    if (!oldUser || !newUser) {

      throw new Error("新舊使用者姓名不可空白");

    }

    if (oldUser === newUser) {

      return successResponse("姓名未變更", { updated: 0 });

    }

    const lock = LockService.getDocumentLock();

    lock.waitLock(3000);

    try {

      const ws = sheet();

      ensureSheetHeader(ws);

      const lastRow = ws.getLastRow();

      if (lastRow <= 1) {

        return successResponse("使用者姓名已更新", { updated: 0 });

      }

      const range = ws.getRange(2, 1, lastRow - 1, 1);
      const values = range.getValues();
      let updated = 0;

      values.forEach(function(row) {

        if (String(row[0] || "").trim() === oldUser) {

          row[0] = newUser;
          updated += 1;

        }

      });

      if (updated) {

        range.setValues(values);

      }

      return successResponse("使用者姓名已更新", { updated: updated });

    }

    finally {

      lock.releaseLock();

    }

  }
  
  /* ==========================================================
     Update
  ========================================================== */
  
  /* ==========================================================
     Update Record
  ========================================================== */
  
  function updateRecord(data) {
  
    const lock = LockService.getDocumentLock();
  
    lock.waitLock(3000);
  
    try {
  
      const ws = sheet();

      ensureSheetHeader(ws);

      const record = validateRecordInput(data, {

        requireId: true

      });
  
      const values = ws.getDataRange().getValues();

      const found = findRecordRow(values, record);

      if (found) {

        ws
          .getRange(found.index + 1, 1, 1, SHEET_HEADERS.length)
          .setValues([
            createSheetRow(record, found.data.datetime)
          ]);

        return successResponse("更新成功", {

          id: record.id

        });

      }
  
      return errorResponse("找不到要更新的紀錄");
  
    }
  
    finally {
  
      lock.releaseLock();
  
    }
  
  }
  
  /* ==========================================================
     Delete
  ========================================================== */
  
  function deleteRecord(data) {

    const lock = LockService.getDocumentLock();

    lock.waitLock(3000);

    try {

      const record = validateRecordInput(data, {

        requireId: true,

        requireValues: false

      });
  
      const ws = sheet();

      ensureSheetHeader(ws);
  
      const values = ws.getDataRange().getValues();

      const found = findRecordRow(values, record);

      if (found) {

        ws.deleteRow(found.index + 1);

        return successResponse("刪除成功", {

          id: record.id

        });

      }
  
      return errorResponse("找不到資料");

    }

    finally {

      lock.releaseLock();

    }
  
  }
  
  /* ==========================================================
     Latest Record
  ========================================================== */
  
  function getTodayRecord(data) {
  
    const user = validateRecordInput(data, {

      requireValues: false

    }).user;

    const ws = sheet();

    ensureSheetHeader(ws);
  
    const values = ws.getDataRange().getValues();
  
    let result = null;
  
    for (let i = values.length - 1; i >= 1; i--) {
  
      const record = readRowRecord(values[i]);

      if (!record) continue;

      if (record.user != user) continue;

      result = {

        id: record.id,

        datetime: record.datetime,

        sys: record.sys,

        dia: record.dia,

        pulse: record.pulse,

        ihb: record.ihb

      };

      break;
  
    }
  
    return successResponse("", result);
  
  }
  
  /* ==========================================================
     Trend
  ========================================================== */
  
  function getTrend(data) {
  
    const user = validateRecordInput(data, {

      requireValues: false

    }).user;

    const ws = sheet();

    ensureSheetHeader(ws);
  
    const values = ws.getDataRange().getValues();
  
    const result = [];
  
    const days = Number(data.days || 30);

    if (!Number.isFinite(days) || days <= 0) {

      throw new Error("天數錯誤");

    }
  
    const now = new Date();
  
    for (let i = 1; i < values.length; i++) {
  
      const record = readRowRecord(values[i]);

      if (!record) continue;

      if (record.user != user) continue;

      const d = new Date(record.datetime);

      if (Number.isNaN(d.getTime())) continue;
  
      const diff = (now - d) / 86400000;
  
      if (diff > days) continue;
  
      result.push({
  
        date: record.datetime,
  
        sys: record.sys,
  
        dia: record.dia,
  
        pulse: record.pulse
  
      });
  
    }
  
    result.sort(function(a, b){
  
      return new Date(a.date) - new Date(b.date);
  
    });
  
    return successResponse("", result);
  
  }
