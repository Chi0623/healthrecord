"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const MAIN_HEADERS = [
    "姓名", "日期", "時間", "SYS",
    "DIA", "Pulse", "IHB", "RecordID"
];

function createSheet(headers = []) {

    const rows = [headers.slice()];

    return {
        rows,
        getLastRow() {
            return rows.length;
        },
        getDataRange() {
            return { getValues: () => rows.map(row => row.slice()) };
        },
        getRange(row, column, rowCount, columnCount) {
            return {
                getValues() {
                    return Array.from({ length: rowCount }, (_, rowOffset) =>
                        Array.from({ length: columnCount }, (_, columnOffset) =>
                            (rows[row - 1 + rowOffset] || [])[column - 1 + columnOffset]
                        )
                    );
                },
                setValues(values) {
                    values.forEach((sourceRow, rowOffset) => {
                        const targetRow = row - 1 + rowOffset;
                        rows[targetRow] = rows[targetRow] || [];
                        sourceRow.forEach((value, columnOffset) => {
                            rows[targetRow][column - 1 + columnOffset] = value;
                        });
                    });
                }
            };
        },
        appendRow(row) {
            rows.push(row.slice());
        },
        deleteRows(start, count) {
            rows.splice(start - 1, count);
        }
    };

}

function loadAppsScript(options = {}) {

    const sheet = createSheet(MAIN_HEADERS);
    const sheets = new Map([["血壓紀錄", sheet]]);
    const logs = [];
    let uuid = 0;

    const context = {
        Session: { getScriptTimeZone: () => "Asia/Taipei" },
        SpreadsheetApp: {
            getActiveSpreadsheet: () => ({
                getSheetByName: name => sheets.get(name) || null,
                insertSheet: name => {
                    if (options.failDiagnosticSheet && name === "系統診斷") {
                        throw new Error("diagnostic sheet unavailable");
                    }
                    const created = createSheet();
                    sheets.set(name, created);
                    return created;
                }
            })
        },
        LockService: {
            getDocumentLock: () => ({
                waitLock() {},
                releaseLock() {}
            })
        },
        Utilities: {
            getUuid: () =>
                `00000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}`,
            formatDate: (date, timezone, format) =>
                format === "yyyy-MM-dd" ? "2026-09-23" : "12:00:00"
        },
        ContentService: {
            MimeType: { JSON: "json" },
            createTextOutput: value => ({
                value,
                setMimeType() { return this; }
            })
        },
        console: {
            log: value => logs.push(JSON.parse(value)),
            error: value => logs.push({ consoleError: value })
        }
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync("Code.gs", "utf8"), context);

    return { context, sheet, sheets, logs };

}

function createLocalStorage() {

    const values = new Map();

    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };

}

async function testAppsScriptIdempotency() {

    const { context, sheet, sheets, logs } = loadAppsScript();
    const record = {
        id: "11111111-1111-4111-8111-111111111111",
        requestId: "11111111-1111-4111-8111-111111111111",
        user: "測試者",
        sys: 120,
        dia: 80,
        pulse: 70,
        ihb: false
    };

    const first = context.saveRecord(record);
    const retry = context.saveRecord(record);

    assert.strictEqual(first.success, true);
    assert.strictEqual(first.data.duplicate, false);
    assert.strictEqual(retry.success, true);
    assert.strictEqual(retry.data.duplicate, true);
    assert.strictEqual(sheet.rows.length, 2);
    assert(logs.some(entry => entry.stage === "ROW_APPENDED"));
    assert(logs.some(entry => entry.stage === "DUPLICATE_FOUND"));

    assert.throws(
        () => context.saveRecord({ ...record, sys: 121 }),
        /紀錄識別碼重複/
    );

    context.doPost({
        parameter: {
            action: "saveRecord",
            ...record
        },
        postData: { contents: "action=saveRecord" }
    });

    assert(logs.some(entry =>
        entry.requestId === record.requestId &&
        entry.stage === "REQUEST_RECEIVED"
    ));
    assert(logs.some(entry =>
        entry.requestId === record.requestId &&
        entry.stage === "RESPONSE_CREATED"
    ));
    assert(sheets.get("系統診斷").rows.some(row =>
        row[3] === record.requestId && row[6] === "DUPLICATE_FOUND"
    ));

}

async function testAppsScriptDiagnostics() {

    const { context, sheets } = loadAppsScript();
    const diagnostic = {
        diagnosticId: "33333333-3333-4333-8333-333333333333",
        timestamp: "2026-09-23T14:02:26.379Z",
        requestId: "44444444-4444-4444-8444-444444444444",
        action: "saveRecord",
        outcome: "http-error",
        status: 404,
        redirected: true,
        responseHost: "script.googleusercontent.com",
        responseFormat: "text/html",
        durationMs: 1234,
        error: "HTTP 404",
        appVersion: "v1.0 RC4",
        user: "不得寫入的人名",
        sys: 120
    };

    const first = context.writeDiagnostics({
        entries: JSON.stringify([diagnostic])
    });
    const retry = context.writeDiagnostics({
        entries: JSON.stringify([diagnostic])
    });
    const diagnosticSheet = sheets.get("系統診斷");

    assert.strictEqual(first.success, true);
    assert.strictEqual(first.data.insertedCount, 1);
    assert.strictEqual(retry.data.insertedCount, 0);
    assert.strictEqual(diagnosticSheet.rows.length, 2);
    assert(!diagnosticSheet.rows[1].includes("不得寫入的人名"));
    assert(!diagnosticSheet.rows[1].includes(120));

    for (let index = 0; index < 1000; index += 1) {
        diagnosticSheet.rows.push([
            new Date(), "", `old-${index}`, "", "client", "", "", "",
            "", "", "", "", "", ""
        ]);
    }

    const next = {
        ...diagnostic,
        diagnosticId: "55555555-5555-4555-8555-555555555555"
    };

    context.writeDiagnostics({ entries: JSON.stringify([next]) });

    assert.strictEqual(diagnosticSheet.rows.length, 1001);
    assert.strictEqual(
        diagnosticSheet.rows[1000][2],
        "55555555-5555-4555-8555-555555555555"
    );

    const isolated = loadAppsScript({ failDiagnosticSheet: true });
    const response = isolated.context.doPost({
        parameter: {
            action: "saveRecord",
            id: "66666666-6666-4666-8666-666666666666",
            requestId: "66666666-6666-4666-8666-666666666666",
            user: "測試者",
            sys: "120",
            dia: "80",
            pulse: "70",
            ihb: "false"
        },
        postData: { contents: "action=saveRecord" }
    });

    assert.strictEqual(JSON.parse(response.value).success, true);
    assert.strictEqual(isolated.sheet.rows.length, 2);

}

async function testBrowserDiagnostics() {

    const localStorage = createLocalStorage();
    localStorage.setItem(
        "bp-api-url",
        "https://script.google.com/macros/s/example/exec"
    );
    let uuid = 0;
    const requests = [];
    const scheduledFlushes = [];
    const responses = [
        {
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: true,
            url: "https://script.googleusercontent.com/macros/echo",
            headers: { get: () => "application/json; charset=utf-8" },
            text: async () => JSON.stringify({
                success: true,
                message: "儲存成功",
                data: {
                    id: "22222222-2222-4222-8222-222222222222"
                }
            })
        },
        {
            ok: false,
            status: 404,
            statusText: "Not Found",
            redirected: true,
            url: "https://script.googleusercontent.com/macros/echo",
            headers: { get: () => "text/html" },
            text: async () => "not used"
        },
        {
            ok: true,
            status: 200,
            statusText: "OK",
            redirected: true,
            url: "https://script.googleusercontent.com/macros/echo",
            headers: { get: () => "application/json; charset=utf-8" },
            text: async () => JSON.stringify({
                success: true,
                message: "診斷紀錄已同步",
                data: {
                    acceptedIds: context.getPendingApiDiagnostics()
                        .map(entry => entry.diagnosticId)
                }
            })
        }
    ];

    const context = {
        window: {
            crypto: {
                randomUUID: () =>
                    `00000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}`
            }
        },
        localStorage,
        URL,
        URLSearchParams,
        setTimeout: callback => scheduledFlushes.push(callback),
        console: {
            info() {},
            warn() {},
            error() {}
        },
        fetch: async (url, options) => {
            requests.push({ url, body: options.body.toString() });
            return responses.shift();
        }
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync("js/api.js", "utf8"), context);

    const saved = await context.saveRecord({
        id: "22222222-2222-4222-8222-222222222222",
        user: "測試者",
        sys: 120,
        dia: 80,
        pulse: 70,
        ihb: false
    });

    assert.strictEqual(saved.success, true);
    assert.strictEqual(
        new URLSearchParams(requests[0].body).get("requestId"),
        "22222222-2222-4222-8222-222222222222"
    );
    assert.strictEqual(scheduledFlushes.length, 1);

    const failed = await context.apiRequest(
        "getUsers",
        {},
        "https://script.google.com/macros/s/example/exec"
    );
    const diagnostics = context.getApiDiagnostics();
    const lastEntry = diagnostics[diagnostics.length - 1];

    assert.strictEqual(failed.success, false);
    assert.strictEqual(failed.message, "HTTP 404");
    assert.strictEqual(lastEntry.outcome, "http-error");
    assert.strictEqual(lastEntry.status, 404);
    assert.strictEqual(lastEntry.redirected, true);
    assert.strictEqual(
        lastEntry.responseHost,
        "script.googleusercontent.com"
    );
    assert.strictEqual(diagnostics.length, 2);

    const flushed = await context.flushApiDiagnostics();
    const diagnosticPayload = new URLSearchParams(requests[2].body);
    const uploadedEntries = JSON.parse(diagnosticPayload.get("entries"));

    assert.strictEqual(flushed.success, true);
    assert.strictEqual(diagnosticPayload.get("action"), "writeDiagnostics");
    assert.strictEqual(context.getPendingApiDiagnostics().length, 0);
    assert(uploadedEntries.every(entry => !Object.hasOwn(entry, "user")));
    assert(uploadedEntries.every(entry => !Object.hasOwn(entry, "sys")));
    assert(uploadedEntries.every(entry => !Object.hasOwn(entry, "dia")));

    for (let index = 0; index < 55; index += 1) {
        context.writeApiDiagnosticLog({ index });
    }

    assert.strictEqual(context.getApiDiagnostics().length, 50);

}

Promise.resolve()
    .then(testAppsScriptIdempotency)
    .then(testAppsScriptDiagnostics)
    .then(testBrowserDiagnostics)
    .then(() => console.log("idempotent save tests passed"))
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
