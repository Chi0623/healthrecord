/* ==========================================================
   安心血壓 v1.0 RC4
   api.js
========================================================== */

"use strict";

/* ==========================================================
   Google Apps Script Web App
========================================================== */

const DEFAULT_API_URL =
    "";

const API_DIAGNOSTIC_LOG_KEY = "bp-api-diagnostic-log";

const API_DIAGNOSTIC_LOG_LIMIT = 50;

const API_DIAGNOSTIC_BATCH_LIMIT = 20;

const API_APP_VERSION = "v1.0 RC4";

let apiDiagnosticFlushPromise = null;

function createRequestId() {

    if (window.crypto && typeof window.crypto.randomUUID === "function") {

        return window.crypto.randomUUID();

    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        character => {

            const random = Math.floor(Math.random() * 16);
            const value = character === "x" ? random : (random & 0x3) | 0x8;

            return value.toString(16);

        }
    );

}

function getUrlHost(value) {

    try {

        return new URL(String(value || "")).host;

    } catch (err) {

        return "";

    }

}

function readApiDiagnosticLog() {

    try {

        const entries = JSON.parse(
            localStorage.getItem(API_DIAGNOSTIC_LOG_KEY) || "[]"
        );

        return Array.isArray(entries) ? entries : [];

    } catch (err) {

        return [];

    }

}

function writeApiDiagnosticLog(entry) {

    const entries = readApiDiagnosticLog();

    const normalizedEntry = {
        diagnosticId: entry.diagnosticId || createRequestId(),
        source: "client",
        appVersion: API_APP_VERSION,
        synced: Boolean(entry.synced),
        ...entry
    };

    entries.push(normalizedEntry);

    try {

        localStorage.setItem(
            API_DIAGNOSTIC_LOG_KEY,
            JSON.stringify(entries.slice(-API_DIAGNOSTIC_LOG_LIMIT))
        );

    } catch (err) {

        console.warn("[API Diagnostic] 無法寫入本機紀錄");

    }

    console.info("[API Diagnostic]", normalizedEntry);

}

function getApiDiagnostics() {

    return readApiDiagnosticLog();

}

function clearApiDiagnostics() {

    localStorage.removeItem(API_DIAGNOSTIC_LOG_KEY);

}

function getPendingApiDiagnostics() {

    return readApiDiagnosticLog()
        .filter(entry => !entry.synced && entry.diagnosticId)
        .slice(0, API_DIAGNOSTIC_BATCH_LIMIT);

}

function markApiDiagnosticsSynced(diagnosticIds) {

    const accepted = new Set(diagnosticIds || []);

    if (!accepted.size) return;

    const entries = readApiDiagnosticLog().map(entry => ({
        ...entry,
        synced: entry.synced || accepted.has(entry.diagnosticId)
    }));

    try {

        localStorage.setItem(
            API_DIAGNOSTIC_LOG_KEY,
            JSON.stringify(entries.slice(-API_DIAGNOSTIC_LOG_LIMIT))
        );

    } catch (err) {

        console.warn("[API Diagnostic] 無法更新同步狀態");

    }

}

function scheduleApiDiagnosticFlush(apiUrl) {

    if (typeof setTimeout !== "function") return;

    setTimeout(() => {

        flushApiDiagnostics(apiUrl);

    }, 0);

}

async function flushApiDiagnostics(apiUrl = getApiUrl()) {

    if (apiDiagnosticFlushPromise) return apiDiagnosticFlushPromise;

    const pending = getPendingApiDiagnostics();
    const url = String(apiUrl || "").trim();

    if (!url || !pending.length) {

        return {
            success: true,
            message: "沒有待上傳的診斷紀錄",
            data: { acceptedIds: [] }
        };

    }

    apiDiagnosticFlushPromise = (async () => {

        const result = await apiRequest(
            "writeDiagnostics",
            { entries: JSON.stringify(pending) },
            url,
            { log: false, flush: false }
        );

        if (result.success) {

            const acceptedIds = result.data && Array.isArray(result.data.acceptedIds)
                ? result.data.acceptedIds
                : pending.map(entry => entry.diagnosticId);

            markApiDiagnosticsSynced(acceptedIds);

            if (getPendingApiDiagnostics().length) {

                scheduleApiDiagnosticFlush(url);

            }

        }

        return result;

    })();

    try {

        return await apiDiagnosticFlushPromise;

    } finally {

        apiDiagnosticFlushPromise = null;

    }

}

function logResponseDiagnostic(
    response,
    requestId,
    action,
    startedAt,
    outcome,
    error = ""
) {

    const contentType = String(
        response.headers.get("content-type") || ""
    ).split(";")[0];

    writeApiDiagnosticLog({
        timestamp: new Date().toISOString(),
        requestId,
        action,
        outcome,
        status: response.status,
        redirected: response.redirected,
        responseHost: getUrlHost(response.url),
        responseFormat: contentType,
        error: String(error || "").slice(0, 160),
        durationMs: Date.now() - startedAt
    });

}

async function parseApiResponse(
    response,
    requestId,
    action,
    startedAt,
    shouldLog = true
) {

    if (!response.ok) {

        if (shouldLog) {

            logResponseDiagnostic(
                response,
                requestId,
                action,
                startedAt,
                "http-error",
                `HTTP ${response.status} ${response.statusText}`.trim()
            );

        }

        throw new Error(`HTTP ${response.status}`);

    }

    const responseText = await response.text();
    let result;

    try {

        result = JSON.parse(responseText);

    } catch (err) {

        if (shouldLog) {

            logResponseDiagnostic(
                response,
                requestId,
                action,
                startedAt,
                "json-error",
                "回應不是有效的 JSON"
            );

        }

        throw new Error("回應格式錯誤");

    }

    if (shouldLog) {

        logResponseDiagnostic(
            response,
            requestId,
            action,
            startedAt,
            result.success ? "success" : "api-error",
            result.success ? "" : result.message || "API 錯誤"
        );

    }

    return result;

}

function getApiUrl() {

    const saved = String(localStorage.getItem("bp-api-url") || "").trim();

    return saved || DEFAULT_API_URL;

}

function setApiUrl(url) {

    const value = String(url || "").trim();

    if (!value) {

        localStorage.removeItem("bp-api-url");

        return DEFAULT_API_URL;

    }

    localStorage.setItem("bp-api-url", value);

    return value;

}

function parseRecordDateTime(value) {

    if (value instanceof Date) {

        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());

    }

    if (typeof value === "number" && Number.isFinite(value)) {

        const date = new Date(value);

        return Number.isNaN(date.getTime()) ? null : date;

    }

    const text = String(value || "").trim();

    if (!text) {

        return null;

    }

    const localDateTimeMatch = text.match(
        /^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (localDateTimeMatch) {

        return new Date(
            Number(localDateTimeMatch[1]),
            Number(localDateTimeMatch[2]) - 1,
            Number(localDateTimeMatch[3]),
            Number(localDateTimeMatch[4]),
            Number(localDateTimeMatch[5]),
            Number(localDateTimeMatch[6] || 0)
        );

    }

    const localDateMatch = text.match(
        /^(\d{4})[-/](\d{2})[-/](\d{2})$/
    );

    if (localDateMatch) {

        return new Date(
            Number(localDateMatch[1]),
            Number(localDateMatch[2]) - 1,
            Number(localDateMatch[3])
        );

    }

    const date = new Date(text);

    return Number.isNaN(date.getTime()) ? null : date;

}

function normalizeRecord(record) {

    if (!record || typeof record !== "object") {

        return record;

    }

    return {
        ...record,
        datetime: parseRecordDateTime(record.datetime)
    };

}

function normalizeRecordList(records) {

    if (!Array.isArray(records)) {

        return [];

    }

    return records
        .map(normalizeRecord)
        .filter(Boolean);

}

/* ==========================================================
   共用 Request
========================================================== */

async function apiRequest(
    action,
    data = {},
    apiUrl = getApiUrl(),
    options = {}
) {

    const startedAt = Date.now();
    const requestId = String(data.requestId || createRequestId());
    const shouldLog = options.log !== false;
    const shouldFlush = options.flush !== false;
    let response = null;

    try {

        const payload = new URLSearchParams();

        payload.append("action", action);

        payload.append("requestId", requestId);

        Object.keys(data).forEach(key => {

            if (key === "requestId") {

                return;

            }

            const value = data[key];

            if (value === undefined || value === null) {

                return;

            }

            payload.append(key, String(value));

        });

        const url = String(apiUrl || "").trim();

        if (!url) {

            throw new Error("尚未設定 Apps Script 網址");

        }

        response = await fetch(url, {

            method: "POST",

            body: payload

        });

        const result = await parseApiResponse(
            response,
            requestId,
            action,
            startedAt,
            shouldLog
        );

        if (result.success && shouldFlush && action !== "writeDiagnostics") {

            scheduleApiDiagnosticFlush(url);

        }

        return result;

    }

    catch (err) {

        if (!response && shouldLog) {

            writeApiDiagnosticLog({
                timestamp: new Date().toISOString(),
                requestId,
                action,
                outcome: "network-error",
                status: 0,
                redirected: false,
                responseHost: "",
                responseFormat: "",
                error: String(err.message || "網路錯誤").slice(0, 160),
                durationMs: Date.now() - startedAt
            });

        }

        console.error(

            "[API]",

            err

        );

        return {

            success: false,

            message: err.message,

            data: null

        };

    }

}

/* ==========================================================
   新增紀錄
========================================================== */

async function saveRecord(record) {

    return await apiRequest(

        "saveRecord",

        {
            ...record,
            requestId: record.id
        }

    );

}

/* ==========================================================
   取得全部紀錄
========================================================== */

async function getRecords(user) {

    const result = await apiRequest(

        "getRecords",

        {

            user

        }

    );

    if (result.success) {

        result.data = normalizeRecordList(result.data);

    }

    return result;

}

/* ==========================================================
   更新紀錄
========================================================== */

async function updateRecord(record) {

    return await apiRequest(

        "updateRecord",

        record

    );

}

/* ==========================================================
   刪除紀錄
========================================================== */

async function deleteRecord(id, user) {

    return await apiRequest(

        "deleteRecord",

        {

            id,

            user

        }

    );

}

/* ==========================================================
   今日紀錄
========================================================== */

async function getTodayRecord(user) {

    const result = await apiRequest(

        "getTodayRecord",

        {

            user

        }

    );

    if (result.success && result.data) {

        result.data = normalizeRecord(result.data);

    }

    return result;

}

async function getUsers(apiUrl) {

    const result = await apiRequest("getUsers", {}, apiUrl || getApiUrl());

    if (!result.success || !Array.isArray(result.data)) {

        result.data = [];

    }

    return result;

}

async function renameUser(oldUser, newUser) {

    return await apiRequest("renameUser", {

        oldUser,

        newUser

    });

}

/* ==========================================================
   趨勢
========================================================== */

async function getTrend(user, days = 30) {

    return await apiRequest(

        "getTrend",

        {

            user,

            days

        }

    );

}
