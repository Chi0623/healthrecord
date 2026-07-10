/* ==========================================================
   安心血壓 v1.0 RC1
   history.js
========================================================== */

"use strict";

const DAY_PERIODS = [

    {
        maxHour: 6,
        icon: "night",
        label: "晚上"
    },

    {
        maxHour: 9,
        icon: "dawn",
        label: "清晨"
    },

    {
        maxHour: 12,
        icon: "morning",
        label: "上午"
    },

    {
        maxHour: 18,
        icon: "afternoon",
        label: "下午"
    },

    {
        maxHour: 24,
        icon: "night",
        label: "晚上"
    }

];

const History = {

    listElement: null,

    filterButtons: [],

    advancedToggleButton: null,

    advancedFiltersElement: null,

    startDateInput: null,

    endDateInput: null,

    exportButton: null,

    exportSummaryElement: null,

    allRecords: [],

    records: [],

    filters: {
        periods: [],
        range: "all",
        statuses: [],
        startDate: "",
        endDate: "",
        showAdvanced: false
    },

    init() {

        this.listElement = document.getElementById("historyList");

        this.filterButtons = Array.from(
            document.querySelectorAll(".history-filter-chip[data-filter-type]")
        );

        this.advancedToggleButton =
            document.getElementById("historyAdvancedToggle");

        this.advancedFiltersElement =
            document.getElementById("historyAdvancedFilters");

        this.startDateInput =
            document.getElementById("historyStartDate");

        this.endDateInput =
            document.getElementById("historyEndDate");

        this.exportButton =
            document.getElementById("historyExportBtn");

        this.exportSummaryElement =
            document.getElementById("historyExportSummary");
    
        if (!this.listElement) {
    
            console.warn("找不到 historyList");
    
            return;
    
        }

        this.bindFilterEvents();

        this.bindExportEvents();

        this.syncExportState();
    
    },

    bindFilterEvents() {

        this.filterButtons.forEach(button => {

            button.addEventListener("click", () => {

                this.toggleFilter(button);

            });

        });

        if (this.advancedToggleButton) {

            this.advancedToggleButton.addEventListener("click", () => {

                this.toggleAdvancedFilters();

            });

        }

        if (this.startDateInput) {

            this.startDateInput.addEventListener("change", () => {

                this.filters.startDate = this.startDateInput.value || "";

                this.render();

            });

        }

        if (this.endDateInput) {

            this.endDateInput.addEventListener("change", () => {

                this.filters.endDate = this.endDateInput.value || "";

                this.render();

            });

        }

        this.syncFilterButtons();

        this.syncAdvancedFilters();

    },

    bindExportEvents() {

        if (!this.exportButton) {

            return;

        }

        this.exportButton.addEventListener("click", async () => {

            await this.exportCsv();

        });

    },

    toggleAdvancedFilters() {

        this.setAdvancedFiltersVisible(
            !this.filters.showAdvanced
        );

    },

    setAdvancedFiltersVisible(visible) {

        this.filters.showAdvanced = Boolean(visible);

        this.syncAdvancedFilters();

    },

    syncAdvancedFilters() {

        if (this.advancedFiltersElement) {

            this.advancedFiltersElement.hidden = !this.filters.showAdvanced;

        }

        if (this.advancedToggleButton) {

            this.advancedToggleButton.classList.toggle(
                "active",
                this.filters.showAdvanced
            );

            this.advancedToggleButton.setAttribute(
                "aria-expanded",
                this.filters.showAdvanced ? "true" : "false"
            );

        }

    },

    toggleFilter(button) {

        const type = button.dataset.filterType;

        const value = button.dataset.filterValue;

        if (type === "period") {

            if (value === "all") {

                this.filters.periods = [];

                this.syncFilterButtons();

                this.render();

                return;

            }

            const periods = new Set(this.filters.periods);

            if (periods.has(value)) {

                periods.delete(value);

            } else {

                periods.add(value);

            }

            this.filters.periods = Array.from(periods);

        }

        if (type === "range") {

            this.filters.range = value || "all";

        }

        if (type === "status") {

            const statuses = new Set(this.filters.statuses);

            if (statuses.has(value)) {

                statuses.delete(value);

            } else {

                statuses.add(value);

            }

            this.filters.statuses = Array.from(statuses);

        }

        this.syncFilterButtons();

        this.render();

    },

    syncFilterButtons() {

        this.filterButtons.forEach(button => {

            const type = button.dataset.filterType;

            const value = button.dataset.filterValue;

            let isActive = false;

            if (type === "period") {

                isActive = value === "all"
                    ? this.filters.periods.length === 0
                    : this.filters.periods.includes(value);

            }

            if (type === "range") {

                isActive = this.filters.range === value;

            }

            if (type === "status") {

                isActive = this.filters.statuses.includes(value);

            }

            if (button === this.advancedToggleButton) {

                return;

            }

            button.classList.toggle("active", isActive);

            button.setAttribute("aria-pressed", isActive ? "true" : "false");

        });

    },

    async load() {

        try {

            const user =
                localStorage.getItem("bp-user") || "使用者";

            const result = await getRecords(user);

            if (!result.success) {

                this.allRecords = [];

                this.records = [];

                this.renderEmpty();

                return;

            }

            this.allRecords = result.data || [];

            this.records = this.getFilteredRecords();

            this.render();

        }

        catch (err) {

            console.error(err);

            this.allRecords = [];

            this.records = [];

            this.renderError();

        }

    },

    render() {

        this.records = this.getFilteredRecords();

        this.syncExportState();

        if (!this.records.length) {

            this.renderEmpty(this.allRecords.length > 0);

            return;

        }

        if (!this.listElement) return;

        if(this.listElement){

            this.listElement.textContent = "";

        }

        this.records
            .sort((a, b) => this.getTimeValue(b.datetime) - this.getTimeValue(a.datetime))
            .forEach(record => {

                this.listElement.appendChild(

                    this.createCard(record)

                );

            });

    },

    getFilteredRecords() {

        const range = this.filters.range;

        const selectedPeriods = this.filters.periods;

        const selectedStatuses = this.filters.statuses;

        const startDate = this.parseFilterDate(this.filters.startDate, "start");

        const endDate = this.parseFilterDate(this.filters.endDate, "end");

        return this.allRecords.filter(record => {

            const date = this.parseDate(record.datetime);

            if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

                return false;

            }

            if (range !== "all" && !this.isWithinRange(date, Number(range))) {

                return false;

            }

            if (startDate && date < startDate) {

                return false;

            }

            if (endDate && date > endDate) {

                return false;

            }

            if (selectedStatuses.length) {

                const status = this.getStatusKey(record);

                if (!selectedStatuses.includes(status)) {

                    return false;

                }

            }

            if (!selectedPeriods.length) {

                return true;

            }

            const period = this.getDayPeriod(date);

            return selectedPeriods.includes(period.label);

        });

    },

    isWithinRange(date, days) {

        if (!Number.isFinite(days) || days <= 0) {

            return true;

        }

        const start = new Date();

        start.setHours(0, 0, 0, 0);

        start.setDate(start.getDate() - (days - 1));

        return date >= start;

    },

    parseFilterDate(value, edge) {

        if (!value) {

            return null;

        }

        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (!match) {

            return null;

        }

        const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

        if (edge === "end") {

            date.setHours(23, 59, 59, 999);

        } else {

            date.setHours(0, 0, 0, 0);

        }

        return date;

    },

    createCard(record) {

        const card = document.createElement("article");

        card.className = "history-card";

        card.dataset.id = record.id;

        const dateValue = this.parseDate(record.datetime);

        const status = this.getBpStatus(record);

        const period = this.getDayPeriod(dateValue);

        if (status.className === "is-caution" || status.className === "is-high") {

            card.classList.add("is-caution-reading");

        }

        const header = document.createElement("div");

        header.className = "history-card-header";

        const meta = document.createElement("div");

        meta.className = "history-card-meta";

        const metaTop = document.createElement("div");

        metaTop.className = "history-card-meta-top";

        const date = document.createElement("div");

        date.className = "history-date";

        date.textContent = this.formatDateOnly(record.datetime);

        const periodBadge = document.createElement("div");

        periodBadge.className = "history-period";

        periodBadge.appendChild(this.createPeriodIcon(period.icon));

        const timeInline = document.createElement("div");

        timeInline.className = "history-time-inline";

        timeInline.textContent = this.formatTime(record.datetime);

        const statusBadge = document.createElement("div");

        statusBadge.className =
            `history-status ${status.className}`.trim();

        statusBadge.textContent = status.label;

        metaTop.appendChild(date);
        metaTop.appendChild(periodBadge);
        metaTop.appendChild(timeInline);

        meta.appendChild(metaTop);

        header.appendChild(meta);

        header.appendChild(statusBadge);

        const metrics = document.createElement("div");

        metrics.className = "history-metrics";

        metrics.appendChild(this.createMetric(
            "收縮壓",
            String(record.sys),
            "history-metric-sys"
        ));

        metrics.appendChild(this.createMetric(
            "舒張壓",
            String(record.dia),
            "history-metric-dia"
        ));

        metrics.appendChild(this.createPulseMetric(record));

        const details = document.createElement("div");

        details.className = "history-details";

        const actions = document.createElement("div");

        actions.className = "history-actions";

        const editBtn = document.createElement("button");

        editBtn.type = "button";

        editBtn.className = "history-edit-btn";

        editBtn.textContent = "編輯";

        editBtn.addEventListener("click", async (e) => {

            e.stopPropagation();

            await this.edit(record);

        });

        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.className = "history-delete-btn";

        deleteBtn.textContent = "刪除";

        deleteBtn.setAttribute(
            "aria-label",
            `刪除 ${this.formatDate(record.datetime)} 的血壓紀錄`
        );

        deleteBtn.addEventListener("click", async (e) => {

            e.stopPropagation();

            await this.remove(record);

        });

        actions.appendChild(editBtn);

        actions.appendChild(deleteBtn);

        details.appendChild(actions);

        card.appendChild(header);

        card.appendChild(metrics);

        card.appendChild(details);

        card.addEventListener("click", async () => {

            card.classList.toggle("expanded");
        
        });

        return card;

    },

    createMetric(label, value, extraClass = "") {

        const metric = document.createElement("div");

        metric.className =
            `history-metric ${extraClass}`.trim();

        metric.setAttribute("aria-label", `${label} ${value}`);

        const metricValue = document.createElement("div");

        metricValue.className = "history-metric-value";

        metricValue.textContent = value;

        metric.appendChild(metricValue);

        return metric;

    },

    createPulseMetric(record) {

        const metric = document.createElement("div");

        metric.className =
            "history-metric history-pulse-metric history-metric-pulse";

        const metricValue = document.createElement("div");

        metricValue.className = "history-metric-value";

        metricValue.textContent = String(record.pulse);

        metric.setAttribute(
            "aria-label",
            record.ihb === true
                ? `脈搏 ${record.pulse}，不規則心跳`
                : `脈搏 ${record.pulse}`
        );

        if (record.ihb === true) {

            const icon = document.createElement("img");

            icon.className = "metric-ihb-icon";

            icon.src = "assets/ihb.svg";

            icon.alt = "不規則心跳";

            metricValue.appendChild(icon);

        }

        metric.appendChild(metricValue);

        return metric;

    },

    renderEmpty(isFiltered = false) {

        if (!this.listElement) return;

        this.records = [];

        this.syncExportState();

        this.listElement.textContent = "";

        const empty = document.createElement("div");

        empty.className = "history-empty";

        empty.textContent = isFiltered
            ? "找不到符合條件的紀錄"
            : "尚無血壓紀錄";

        this.listElement.appendChild(empty);

    },

    renderError() {

        if (!this.listElement) return;

        this.records = [];

        this.syncExportState();

        this.listElement.textContent = "";

        const error = document.createElement("div");

        error.className = "history-empty";

        error.textContent = "無法讀取資料";

        this.listElement.appendChild(error);

    },

    formatDate(value) {

        const date = this.parseDate(value);

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return "--";

        }

        return date.toLocaleString("zh-TW", {

            year: "numeric",

            month: "2-digit",

            day: "2-digit",

            hour: "2-digit",

            minute: "2-digit"

        });

    },

    formatDateOnly(value) {

        const date = this.parseDate(value);

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return "--";

        }

        const now = new Date();
        const sameYear = date.getFullYear() === now.getFullYear();

        return date.toLocaleDateString("zh-TW", sameYear ? {

            month: "2-digit",

            day: "2-digit"

        } : {

            year: "numeric",

            month: "2-digit",

            day: "2-digit"

        });

    },

    formatTime(value) {

        const date = this.parseDate(value);

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return "--";

        }

        return date.toLocaleTimeString("zh-TW", {

            hour: "2-digit",

            minute: "2-digit",

            hour12: false

        });

    },

    getDayPeriod(date) {

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return {
                icon: "time",
                label: "未分類"
            };

        }

        const hour = date.getHours();

        return DAY_PERIODS.find(period => hour < period.maxHour) || {
            icon: "time",
            label: "未分類"
        };

    },

    parseDate(value) {

        if (typeof parseRecordDateTime === "function") {

            return parseRecordDateTime(value);

        }

        const date = new Date(value);

        return Number.isNaN(date.getTime()) ? null : date;

    },

    getTimeValue(value) {

        const date = this.parseDate(value);

        return date instanceof Date ? date.getTime() : 0;

    },

    getBpStatus(record) {

        if (
            typeof App !== "undefined" &&
            typeof App.getBpStatus === "function"
        ) {

            return App.getBpStatus(
                Number(record.sys),
                Number(record.dia)
            );

        }

        return {
            label: "正常",
            className: ""
        };

    },

    getStatusKey(record) {

        const status = this.getBpStatus(record);

        if (!status.className) {

            return "ideal";

        }

        return status.className.replace("is-", "");

    },

    syncExportState() {

        if (this.exportSummaryElement) {

            this.exportSummaryElement.textContent =
                this.getExportSummaryText();

        }

        if (this.exportButton) {

            this.exportButton.disabled = !this.getExportRecords().length;

        }

    },

    getExportRecords() {

        return [...this.records].sort(
            (a, b) => this.getTimeValue(b.datetime) - this.getTimeValue(a.datetime)
        );

    },

    getExportSummaryText() {

        const count = this.getExportRecords().length;

        if (!this.allRecords.length) {

            return "目前沒有可匯出的紀錄";

        }

        if (!count) {

            return "目前篩選條件沒有可匯出的紀錄";

        }

        return `目前可匯出 ${count} 筆`;

    },

    async exportCsv() {

        const records = this.getExportRecords();

        if (!records.length) {

            this.showExportMessage(this.getExportSummaryText());

            return;

        }

        const csv = this.buildCsv(records);

        const fileName = this.getExportFileName(records);

        await this.shareOrDownloadCsv(csv, fileName);

    },

    buildCsv(records) {

        const rows = [
            this.getCsvHeaders(),
            ...records.map(record => this.mapRecordToCsvRow(record))
        ];

        return `\ufeff${rows.map(row => this.buildCsvRow(row)).join("\r\n")}`;

    },

    getCsvHeaders() {

        return [
            "姓名",
            "日期",
            "時間",
            "時段",
            "SYS",
            "DIA",
            "Pulse",
            "不規則心跳",
            "血壓燈號",
            "RecordID"
        ];

    },

    mapRecordToCsvRow(record) {

        const date = this.parseDate(record.datetime);

        const period = this.getDayPeriod(date);

        const status = this.getBpStatus(record);

        return [
            record.user || localStorage.getItem("bp-user") || "使用者",
            this.formatCsvDate(date),
            this.formatCsvTime(date),
            period.label,
            Number(record.sys),
            Number(record.dia),
            Number(record.pulse),
            record.ihb === true ? "是" : "否",
            this.getCsvStatusLabel(status.label),
            record.id || ""
        ];

    },

    buildCsvRow(values) {

        return values
            .map(value => this.escapeCsvValue(value))
            .join(",");

    },

    escapeCsvValue(value) {

        const text = value === null || value === undefined
            ? ""
            : String(value);

        if (!/[",\r\n]/.test(text)) {

            return text;

        }

        return `"${text.replace(/"/g, '""')}"`;

    },

    getCsvStatusLabel(label) {

        return String(label || "")
            .replace(/[🟢🔵🟡🟠🔴⚫]/g, "")
            .trim();

    },

    formatCsvDate(date) {

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return "";

        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

    },

    formatCsvTime(date) {

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return "";

        }

        return [
            String(date.getHours()).padStart(2, "0"),
            String(date.getMinutes()).padStart(2, "0")
        ].join(":");

    },

    getExportFileName(records) {

        const user = this.sanitizeFileName(
            localStorage.getItem("bp-user") || "使用者"
        );

        const dates = records
            .map(record => this.parseDate(record.datetime))
            .filter(date => date instanceof Date && !Number.isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());

        const first = dates[0] || new Date();

        const last = dates[dates.length - 1] || first;

        const range = this.formatFileDate(first) === this.formatFileDate(last)
            ? this.formatFileDate(first)
            : `${this.formatFileDate(first)}-${this.formatFileDate(last)}`;

        return `SafeBP_血壓紀錄_${user}_${range}.csv`;

    },

    formatFileDate(date) {

        return this.formatCsvDate(date).replace(/-/g, "");

    },

    sanitizeFileName(value) {

        return String(value || "使用者")
            .trim()
            .replace(/[\\/:*?"<>|,\r\n]+/g, "_") || "使用者";

    },

    async shareOrDownloadCsv(csv, fileName) {

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8"
        });

        if (typeof File !== "function") {

            this.downloadCsvFile(blob, fileName);

            return;

        }

        const file = new File([blob], fileName, {
            type: "text/csv"
        });

        if (this.canShareFile(file)) {

            const shared = await this.shareCsvFile(file, fileName);

            if (shared) {

                return;

            }

        }

        this.downloadCsvFile(blob, fileName);

    },

    canShareFile(file) {

        return (
            typeof navigator !== "undefined" &&
            typeof navigator.share === "function" &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] })
        );

    },

    async shareCsvFile(file, fileName) {

        try {

            await navigator.share({
                files: [file],
                title: "安心血壓 CSV",
                text: fileName
            });

            return true;

        }

        catch (err) {

            if (err && err.name === "AbortError") {

                return true;

            }

            console.warn("CSV 分享失敗，改用下載", err);

            return false;

        }

    },

    downloadCsvFile(blob, fileName) {

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = fileName;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        this.showExportMessage("已準備 CSV 檔案");

    },

    showExportMessage(message) {

        if (
            typeof App !== "undefined" &&
            typeof App.showToast === "function"
        ) {

            App.showToast(message);

        }

    },

    createPeriodIcon(type) {

        const ns = "http://www.w3.org/2000/svg";

        const svg = document.createElementNS(ns, "svg");

        svg.setAttribute("class", "chip-icon");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");

        const partsByType = {
            dawn: [
                { tag: "path", attrs: { d: "M3 16c2 .8 4 .8 6 0s4-.8 6 0 4 .8 6 0" } },
                { tag: "path", attrs: { d: "M6.5 16a5.5 5.5 0 0 1 11 0" } },
                { tag: "path", attrs: { d: "M12 4v3" } },
                { tag: "path", attrs: { d: "m7.4 6.1 1.4 2.4" } },
                { tag: "path", attrs: { d: "m16.6 6.1-1.4 2.4" } },
                { tag: "path", attrs: { d: "M4.4 10.2 7 11.7" } },
                { tag: "path", attrs: { d: "m19.6 10.2-2.6 1.5" } }
            ],
            morning: [
                { tag: "circle", attrs: { cx: "12", cy: "12", r: "5.5" } },
                { tag: "path", attrs: { d: "M12 1.8v2" } },
                { tag: "path", attrs: { d: "M12 20.2v2" } },
                { tag: "path", attrs: { d: "M1.8 12h2" } },
                { tag: "path", attrs: { d: "M20.2 12h2" } },
                { tag: "path", attrs: { d: "m4.8 4.8 1.4 1.4" } },
                { tag: "path", attrs: { d: "m17.8 17.8 1.4 1.4" } },
                { tag: "path", attrs: { d: "m19.2 4.8-1.4 1.4" } },
                { tag: "path", attrs: { d: "m6.2 17.8-1.4 1.4" } }
            ],
            afternoon: [
                { tag: "path", attrs: { d: "M4 15h16" } },
                { tag: "path", attrs: { d: "M6.5 15a5.5 5.5 0 0 1 11 0" } },
                { tag: "path", attrs: { d: "M12 4v3" } },
                { tag: "path", attrs: { d: "m7.4 6.2 1.4 2.4" } },
                { tag: "path", attrs: { d: "m16.6 6.2-1.4 2.4" } },
                { tag: "path", attrs: { d: "M4.5 10.2 7 11.6" } },
                { tag: "path", attrs: { d: "m19.5 10.2-2.5 1.4" } },
                { tag: "path", attrs: { d: "M8 17.5h8" } },
                { tag: "path", attrs: { d: "M9.5 20h5" } }
            ],
            night: [
                { tag: "path", attrs: { d: "M19.2 14.7A7.3 7.3 0 0 1 8.4 5.3a6 6 0 1 0 10.8 9.4Z" } }
            ],
            time: [
                { tag: "circle", attrs: { cx: "12", cy: "12", r: "8" } },
                { tag: "path", attrs: { d: "M12 8v5" } },
                { tag: "path", attrs: { d: "m12 13 3 2" } }
            ]
        };

        const parts = partsByType[type] || partsByType.time;

        parts.forEach(part => {
            const node = document.createElementNS(ns, part.tag);
            Object.keys(part.attrs).forEach(name => {
                node.setAttribute(name, part.attrs[name]);
            });
            svg.appendChild(node);
        });

        return svg;

    },

    async edit(record) {

        // 記住目前正在編輯哪一筆
        App.state.editingId = record.id;

        // 切換按鈕文字
        App.elements.saveBtn.textContent = "更新紀錄";

        await App.switchPage("home");
    
        App.elements.sys.value = record.sys;
    
        App.elements.dia.value = record.dia;
    
        App.elements.pulse.value = record.pulse;
    
        App.state.ihb = !!record.ihb;
    
        App.elements.ihbBtn.classList.toggle(
            "active",
            App.state.ihb
        );
    
        App.elements.ihbBtn.setAttribute(
            "aria-pressed",
            App.state.ihb
        );
    
        App.focusFirstInput();
    
    },

    async remove(record) {

        const confirmed = window.confirm(
            "確定要刪除這筆血壓紀錄嗎？"
        );

        if (!confirmed) return;

        try {

            const user =
                localStorage.getItem("bp-user") || "使用者";

            const result = await deleteRecord(
                record.id,
                user
            );

            if (!result.success) {

                App.showToast(result.message || "刪除失敗");

                return;

            }

            App.showToast("已刪除紀錄");

            await this.load();

            if (typeof App !== "undefined") {

                await App.refreshToday();

            }

            if (typeof ChartPage !== "undefined") {

                await ChartPage.load();

            }

        }

        catch (err) {

            console.error(err);

            App.showToast("刪除失敗");

        }

    }

};

window.History = History;

document.addEventListener("DOMContentLoaded", () => {

    History.init();

});
