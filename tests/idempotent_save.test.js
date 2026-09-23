"use strict";

const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function createSheet() {

    const rows = [[
        "姓名", "日期", "時間", "SYS",
        "DIA", "Pulse", "IHB", "RecordID"
    ]];

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
        }
    };

}

function loadAppsScript() {

    const sheet = createSheet();
    const logs = [];
    let uuid = 0;

    const context = {
        Session: { getScriptTimeZone: () => "Asia/Taipei" },
        SpreadsheetApp: {
            getActiveSpreadsheet: () => ({
                getSheetByName: () => sheet
            })
        },
        LockService: {
            getDocumentLock: () => ({
                waitLock() {},
                releaseLock() {}
            })
        },
        Utilities: {
            getUuid: () => `server-id-${++uuid}`,
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
            log: value => logs.push(JSON.parse(value))
        }
    };

    vm.createContext(context);
    vm.runInContext(fs.readFileSync("Code.gs", "utf8"), context);

    return { context, sheet, logs };

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

    const { context, sheet, logs } = loadAppsScript();
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

}

async function testBrowserDiagnostics() {

    const localStorage = createLocalStorage();
    localStorage.setItem(
        "bp-api-url",
        "https://script.google.com/macros/s/example/exec"
    );
    let uuid = 0;
    const requests = [];
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

    for (let index = 0; index < 55; index += 1) {
        context.writeApiDiagnosticLog({ index });
    }

    assert.strictEqual(context.getApiDiagnostics().length, 50);

}

Promise.resolve()
    .then(testAppsScriptIdempotency)
    .then(testBrowserDiagnostics)
    .then(() => console.log("idempotent save tests passed"))
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
