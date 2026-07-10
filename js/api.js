/* ==========================================================
   安心血壓 v1.0 RC1
   api.js
========================================================== */

"use strict";

/* ==========================================================
   Google Apps Script Web App
========================================================== */

const DEFAULT_API_URL =
    "";

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

async function apiRequest(action, data = {}) {

    try {

        const payload = new URLSearchParams();

        payload.append("action", action);

        Object.keys(data).forEach(key => {

            const value = data[key];

            if (value === undefined || value === null) {

                return;

            }

            payload.append(key, String(value));

        });

        const response = await fetch(getApiUrl(), {

            method: "POST",

            body: payload

        });

        if (!response.ok) {

            throw new Error(

                `HTTP ${response.status}`

            );

        }

        return await response.json();

    }

    catch (err) {

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

        record

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

async function getUsers() {

    const result = await apiRequest("getUsers");

    if (!result.success || !Array.isArray(result.data)) {

        result.data = [];

    }

    return result;

}

async function getOcrTemplate(user) {

    return await apiRequest(
        "getOcrTemplate",
        {
            user
        }
    );

}

async function saveOcrTemplate(user, template) {

    const fields = template.fields || template;

    return await apiRequest(
        "saveOcrTemplate",
        {
            user,
            version: template.version || 1,
            lcd: template.lcd ? JSON.stringify(template.lcd) : "",
            sys: JSON.stringify(fields.sys),
            dia: JSON.stringify(fields.dia),
            pulse: JSON.stringify(fields.pulse)
        }
    );

}

async function deleteOcrTemplate(user) {

    return await apiRequest(
        "deleteOcrTemplate",
        {
            user
        }
    );

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
