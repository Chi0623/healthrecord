/* ==========================================================
   安心血壓 v1.0 RC1
   Google Apps Script
========================================================== */

const CONFIG = {

    SHEET_NAME: "血壓紀錄",
  
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
  
  /* ==========================================================
     POST
  ========================================================== */
  
  function doPost(e) {
  
    try {
  
      if (!e) {
  
        return json(errorResponse("沒有收到資料"));
  
      }
  
      const data = parseRequestData(e);
  
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
  
        default:
          result = errorResponse("未知的 API 動作");
  
      }
  
      return json(result);
  
    } catch (err) {
  
      return json(errorResponse(err.message || err.toString()));
  
    }
  
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
  
      const id = Utilities.getUuid();
  
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
  
      return successResponse("儲存成功", {

        id

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
            createSheetRow(record, new Date())
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
