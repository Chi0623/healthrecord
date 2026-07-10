/* ==========================================================
   安心血壓 v1.0 RC1
   chart.js
========================================================== */

"use strict";

const CHART_DAY_PERIODS = [

    {
        maxHour: 6,
        label: "晚上"
    },

    {
        maxHour: 9,
        label: "清晨"
    },

    {
        maxHour: 12,
        label: "上午"
    },

    {
        maxHour: 18,
        label: "下午"
    },

    {
        maxHour: 24,
        label: "晚上"
    }

];

const BP_THRESHOLD_ZONE_PLUGIN = {
    id: "bpThresholdZone",
    beforeDatasetsDraw(chart) {

        const yScale = chart.scales && chart.scales.y;
        const chartArea = chart.chartArea;

        if (!yScale || !chartArea) {

            return;

        }

        const ctx = chart.ctx;
        const top = chartArea.top;
        const bottom = chartArea.bottom;
        const left = chartArea.left;
        const right = chartArea.right;
        const sysStageTwoY = yScale.getPixelForValue(140);
        const diaStageTwoY = yScale.getPixelForValue(90);

        ctx.save();

        if (Number.isFinite(sysStageTwoY)) {

            const zoneTop = Math.max(top, Math.min(bottom, sysStageTwoY));

            ctx.fillStyle = "rgba(255, 107, 107, .10)";
            ctx.fillRect(left, top, right - left, zoneTop - top);

            ctx.strokeStyle = "rgba(255, 59, 48, .58)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(left, zoneTop);
            ctx.lineTo(right, zoneTop);
            ctx.stroke();

        }

        if (Number.isFinite(diaStageTwoY)) {

            const lineY = Math.max(top, Math.min(bottom, diaStageTwoY));

            ctx.strokeStyle = "rgba(255, 59, 48, .42)";
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.moveTo(left, lineY);
            ctx.lineTo(right, lineY);
            ctx.stroke();

        }

        ctx.restore();

    }
};

const ChartPage = {

    chart: null,

    statusChart: null,

    canvas: null,

    records: [],

    currentRange: 30,

    rangeButtons: [],

    periodButtons: [],

    selectedPeriods: [],

    summaryFields: {},

    statFields: {},

    statusSummaryElement: null,

    init() {

        this.canvas = document.getElementById("chartCanvas");

        this.rangeButtons = Array.from(
            document.querySelectorAll("[data-chart-range]")
        );

        this.periodButtons = Array.from(
            document.querySelectorAll("[data-chart-period]")
        );

        this.summaryFields = {
            todaySys: document.getElementById("chartTodaySys"),
            todayDia: document.getElementById("chartTodayDia"),
            todayPulse: document.getElementById("chartTodayPulse"),
            weekSys: document.getElementById("chartWeekSys"),
            weekDia: document.getElementById("chartWeekDia"),
            weekPulse: document.getElementById("chartWeekPulse"),
            monthSys: document.getElementById("chartMonthSys"),
            monthDia: document.getElementById("chartMonthDia"),
            monthPulse: document.getElementById("chartMonthPulse")
        };

        this.statFields = {
            count: document.getElementById("chartCount"),
            maxSys: document.getElementById("chartMaxSys"),
            maxDia: document.getElementById("chartMaxDia"),
            maxPulse: document.getElementById("chartMaxPulse"),
            minSys: document.getElementById("chartMinSys"),
            minDia: document.getElementById("chartMinDia"),
            minPulse: document.getElementById("chartMinPulse")
        };

        this.statusSummaryElement =
            document.getElementById("chartStatusSummary");

        this.bindEvents();

    },

    bindEvents() {

        this.rangeButtons.forEach(button => {

            button.addEventListener("click", async () => {

                const value = Number(button.dataset.chartRange || 30);

                if (!Number.isFinite(value) || value <= 0) {

                    return;

                }

                this.currentRange = value;

                this.syncRangeButtons();

                this.render();

            });

        });

        this.periodButtons.forEach(button => {

            button.addEventListener("click", () => {

                this.togglePeriod(button.dataset.chartPeriod || "");

            });

        });

        this.syncRangeButtons();
        this.syncPeriodButtons();

    },

    syncRangeButtons() {

        this.rangeButtons.forEach(button => {

            const value = Number(button.dataset.chartRange || 0);
            const active = value === this.currentRange;

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");

        });

    },

    syncPeriodButtons() {

        this.periodButtons.forEach(button => {

            const value = button.dataset.chartPeriod || "";
            const active = value === "all"
                ? this.selectedPeriods.length === 0
                : this.selectedPeriods.includes(value);

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");

        });

    },

    togglePeriod(value) {

        if (!value) {

            return;

        }

        if (value === "all") {

            this.selectedPeriods = [];

            this.syncPeriodButtons();
            this.syncRangeToAvailableRecords();
            this.render();

            return;

        }

        const periods = new Set(this.selectedPeriods);

        if (periods.has(value)) {

            periods.delete(value);

        } else {

            periods.add(value);

        }

        this.selectedPeriods = Array.from(periods);

        this.syncPeriodButtons();
        this.syncRangeToAvailableRecords();
        this.render();

    },

    async load() {

        try {

            const user =
                localStorage.getItem("bp-user") || "使用者";

            const result = await getRecords(user);

            if (!result.success) {

                this.records = [];

                this.renderEmpty();

                return;

            }

            this.records = this.normalizeRecords(result.data || []);

            this.syncRangeToAvailableRecords();

            this.render();

        }

        catch (err) {

            console.error(err);

            this.records = [];

            this.renderEmpty();

        }

    },

    syncRangeToAvailableRecords() {

        if (!this.records.length) {

            return;

        }

        if (this.getRecordsByRange(this.currentRange).length) {

            return;

        }

        const ranges = [7, 30, 90, 180, 365];

        const nextRange = ranges.find(days =>
            this.getRecordsByRange(days).length > 0
        );

        if (!nextRange) {

            return;

        }

        this.currentRange = nextRange;

        this.syncRangeButtons();

    },

    normalizeRecords(records) {

        return records
            .map(record => {

                const rawDate =
                    record.date !== undefined
                        ? record.date
                        : record.datetime;

                const date =
                    typeof parseRecordDateTime === "function"
                        ? parseRecordDateTime(rawDate)
                        : new Date(rawDate);

                if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

                    return null;

                }

                return {
                    ...record,
                    dateObject: date,
                    sys: Number(record.sys),
                    dia: Number(record.dia),
                    pulse: Number(record.pulse)
                };

            })
            .filter(Boolean)
            .sort((a, b) => a.dateObject - b.dateObject);

    },

    render() {

        if (!this.records.length) {

            this.renderEmpty();

            return;

        }

        const filteredRecords = this.getRecordsByRange(this.currentRange);

        if (!filteredRecords.length) {

            this.renderEmpty();

            return;

        }

        this.renderSummary(this.getDashboardSummary());
        this.renderStats(this.getRangeStats(filteredRecords));

        try {

            this.renderStatusSummary(this.getStatusDistribution(filteredRecords));

        }

        catch (err) {

            console.error("[ChartPage] status summary render failed", err);

        }

        try {

            this.renderChart(filteredRecords);

        }

        catch (err) {

            console.error("[ChartPage] chart render failed", err);

            this.renderChartUnavailable();

        }

    },

    getRecordsByRange(days) {

        const periodFilteredRecords = this.getRecordsBySelectedPeriods(this.records);

        const start = new Date();

        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));

        return periodFilteredRecords.filter(record => record.dateObject >= start);

    },

    getRecordsBySelectedPeriods(records) {

        if (!this.selectedPeriods.length) {

            return records;

        }

        return records.filter(record => {

            const period = this.getDayPeriod(record.dateObject);

            return this.selectedPeriods.includes(period.label);

        });

    },

    getDashboardSummary() {

        const records = this.getRecordsBySelectedPeriods(this.records);

        return {
            today: this.getAverageForPeriod(record =>
                this.isSameDay(record.dateObject, new Date()),
                records
            ),
            week: this.getAverageForPeriod(record =>
                this.isSameWeek(record.dateObject, new Date()),
                records
            ),
            month: this.getAverageForPeriod(record =>
                this.isSameMonth(record.dateObject, new Date()),
                records
            )
        };

    },

    getAverageForPeriod(predicate, records) {

        const sourceRecords = Array.isArray(records) ? records : this.records;
        const matches = sourceRecords.filter(predicate);

        if (!matches.length) {

            return {
                sys: "--",
                dia: "--",
                pulse: "--"
            };

        }

        return {
            sys: this.average(matches.map(item => item.sys)),
            dia: this.average(matches.map(item => item.dia)),
            pulse: this.average(matches.map(item => item.pulse))
        };

    },

    getRangeStats(records) {

        return {
            count: records.length,
            maxSys: String(Math.max(...records.map(item => item.sys))),
            maxDia: String(Math.max(...records.map(item => item.dia))),
            maxPulse: String(Math.max(...records.map(item => item.pulse))),
            minSys: String(Math.min(...records.map(item => item.sys))),
            minDia: String(Math.min(...records.map(item => item.dia))),
            minPulse: String(Math.min(...records.map(item => item.pulse)))
        };

    },

    getStatusDistribution(records) {

        const counts = this.createEmptyStatusSummary();

        records.forEach(record => {

            const key = this.getStatusKey(record.sys, record.dia);

            counts[key].count += 1;

        });

        return {
            total: records.length,
            statuses: counts
        };

    },

    renderSummary(summary) {

        this.setMetricField(this.summaryFields.todaySys, summary.today.sys, "今日平均收縮壓");
        this.setMetricField(this.summaryFields.todayDia, summary.today.dia, "今日平均舒張壓");
        this.setMetricField(this.summaryFields.todayPulse, summary.today.pulse, "今日平均脈搏");
        this.markBloodPressureMetricPair(
            this.summaryFields.todaySys,
            this.summaryFields.todayDia,
            this.summaryFields.todayPulse,
            summary.today.sys,
            summary.today.dia
        );

        this.setMetricField(this.summaryFields.weekSys, summary.week.sys, "本週平均收縮壓");
        this.setMetricField(this.summaryFields.weekDia, summary.week.dia, "本週平均舒張壓");
        this.setMetricField(this.summaryFields.weekPulse, summary.week.pulse, "本週平均脈搏");
        this.markBloodPressureMetricPair(
            this.summaryFields.weekSys,
            this.summaryFields.weekDia,
            this.summaryFields.weekPulse,
            summary.week.sys,
            summary.week.dia
        );

        this.setMetricField(this.summaryFields.monthSys, summary.month.sys, "本月平均收縮壓");
        this.setMetricField(this.summaryFields.monthDia, summary.month.dia, "本月平均舒張壓");
        this.setMetricField(this.summaryFields.monthPulse, summary.month.pulse, "本月平均脈搏");
        this.markBloodPressureMetricPair(
            this.summaryFields.monthSys,
            this.summaryFields.monthDia,
            this.summaryFields.monthPulse,
            summary.month.sys,
            summary.month.dia
        );

    },

    renderStats(stats) {

        this.setText(this.statFields.count, String(stats.count));
        this.setText(this.statFields.maxSys, stats.maxSys);
        this.setText(this.statFields.maxDia, stats.maxDia);
        this.setText(this.statFields.maxPulse, stats.maxPulse);
        this.setText(this.statFields.minSys, stats.minSys);
        this.setText(this.statFields.minDia, stats.minDia);
        this.setText(this.statFields.minPulse, stats.minPulse);

        this.markBloodPressureMetricPair(
            this.statFields.maxSys,
            this.statFields.maxDia,
            this.statFields.maxPulse,
            stats.maxSys,
            stats.maxDia
        );

        this.markBloodPressureMetricPair(
            this.statFields.minSys,
            this.statFields.minDia,
            this.statFields.minPulse,
            stats.minSys,
            stats.minDia
        );

    },

    renderStatusSummary(summary) {

        if (!this.statusSummaryElement) {

            return;

        }

        this.statusSummaryElement.textContent = "";

        if (this.statusChart) {

            this.statusChart.destroy();
            this.statusChart = null;

        }

        const wrapper = document.createElement("div");

        wrapper.className = "chart-status-layout";

        const canvas = document.createElement("canvas");

        canvas.className = "chart-status-canvas";
        canvas.setAttribute("aria-label", "燈號分布圓餅圖");
        canvas.width = 216;
        canvas.height = 216;

        const chartBox = document.createElement("div");

        chartBox.className = "chart-status-chartbox";
        chartBox.appendChild(canvas);

        const legend = document.createElement("div");

        legend.className = "chart-status-legend";

        const entries = Object.values(summary.statuses);
        const labels = [];
        const values = [];
        const colors = [];

        entries.forEach(item => {

            const statusLabel = this.normalizeStatusLabel(item.label);
            const percent = this.getStatusPercent(item.count, summary.total);

            if (item.count > 0) {

                labels.push(statusLabel);
                values.push(item.count);
                colors.push(this.getStatusColor(item.dotClass));

            }

            const row = document.createElement("div");

            row.className = "history-status-item";
            row.setAttribute(
                "aria-label",
                `${statusLabel} ${item.count} 筆，${percent}%`
            );

            const label = document.createElement("div");

            label.className = "history-status-label";
            label.appendChild(this.createStatusDot(item.dotClass));

            const text = document.createElement("span");

            text.textContent = statusLabel;

            label.appendChild(text);

            const percentNode = document.createElement("div");

            percentNode.className = "history-status-percent";
            percentNode.textContent = `${percent}%`;

            row.appendChild(label);
            row.appendChild(percentNode);

            legend.appendChild(row);

        });

        wrapper.appendChild(chartBox);
        wrapper.appendChild(legend);
        this.statusSummaryElement.appendChild(wrapper);

        if (!values.length) {

            return;

        }

        this.statusChart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 0,
                        hoverOffset: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "58%",
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {

                                const total = values.reduce((sum, value) => sum + value, 0);
                                const value = Number(context.raw || 0);
                                const percent = this.getStatusPercent(value, total);

                                return `${context.label} ${percent}%`;

                            }
                        }
                    }
                }
            }
        });

    },

    renderChart(records) {

        const density = this.getChartDensity(records.length);

        const labels = records.map(item =>
            `${item.dateObject.getMonth() + 1}/${item.dateObject.getDate()}`
        );

        const sys = records.map(item => item.sys);
        const dia = records.map(item => item.dia);
        const pulse = records.map(item => item.pulse);

        const wrapper = this.canvas.parentElement;
        const empty = wrapper ? wrapper.querySelector(".chart-empty") : null;

        if (empty) {

            empty.remove();

        }

        this.canvas.hidden = false;

        if (this.chart) {

            this.chart.destroy();

        }

        this.chart = new Chart(this.canvas, {
            type: "line",
            plugins: [BP_THRESHOLD_ZONE_PLUGIN],
            data: {
                labels,
                datasets: [
                    {
                        label: "收縮壓",
                        data: sys,
                        borderColor: "#FF6B6B",
                        backgroundColor: "transparent",
                        tension: 0.35,
                        borderWidth: density.borderWidth,
                        pointRadius: density.pointRadius,
                        pointHoverRadius: density.pointHoverRadius
                    },
                    {
                        label: "舒張壓",
                        data: dia,
                        borderColor: "#4D9FFF",
                        backgroundColor: "transparent",
                        tension: 0.35,
                        borderWidth: density.borderWidth,
                        pointRadius: density.pointRadius,
                        pointHoverRadius: density.pointHoverRadius
                    },
                    {
                        label: "脈搏",
                        data: pulse,
                        borderColor: "#34C759",
                        backgroundColor: "transparent",
                        tension: 0.35,
                        borderWidth: density.borderWidth,
                        pointRadius: density.pointRadius,
                        pointHoverRadius: density.pointHoverRadius
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index"
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: density.maxTicksLimit,
                            maxRotation: 0,
                            minRotation: 0,
                            callback: (value, index) => {

                                if (!this.shouldShowTickLabel(index, records, density)) {

                                    return "";

                                }

                                return labels[index];

                            }
                        }
                    },
                    y: {
                        suggestedMin: 40,
                        suggestedMax: 180,
                        grid: {
                            color: "rgba(148, 163, 184, .22)"
                        }
                    }
                }
            }
        });

    },

    getChartDensity(recordCount) {

        if (this.currentRange >= 365 || recordCount > 180) {

            return {
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 3,
                maxTicksLimit: 6,
                labelMode: "month"
            };

        }

        if (this.currentRange >= 180 || recordCount > 90) {

            return {
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 3,
                maxTicksLimit: 7,
                labelMode: "biweekly"
            };

        }

        if (this.currentRange >= 90 || recordCount > 45) {

            return {
                borderWidth: 3,
                pointRadius: 1.5,
                pointHoverRadius: 3.5,
                maxTicksLimit: 8,
                labelMode: "weekly"
            };

        }

        return {
            borderWidth: 3,
            pointRadius: 2.5,
            pointHoverRadius: 4,
            maxTicksLimit: 10,
            labelMode: "dense"
        };

    },

    shouldShowTickLabel(index, records, density) {

        if (!records[index]) {

            return false;

        }

        if (index === 0 || index === records.length - 1) {

            return true;

        }

        const currentDate = records[index].dateObject;
        const previousDate = records[index - 1].dateObject;

        if (density.labelMode === "month") {

            return currentDate.getDate() === 1 ||
                currentDate.getMonth() !== previousDate.getMonth();

        }

        if (density.labelMode === "biweekly") {

            return currentDate.getDay() === 1 &&
                Math.floor((currentDate.getDate() - 1) / 7) % 2 === 0;

        }

        if (density.labelMode === "weekly") {

            return currentDate.getDay() === 1;

        }

        return true;

    },

    renderEmpty() {

        this.resetSummary();
        this.resetStats();
        this.renderStatusSummary({
            total: 0,
            statuses: this.createEmptyStatusSummary()
        });

        if (this.chart) {

            this.chart.destroy();
            this.chart = null;

        }

        if (this.statusChart) {

            this.statusChart.destroy();
            this.statusChart = null;

        }

        const wrapper = this.canvas.parentElement;

        if (!wrapper) {

            return;

        }

        this.canvas.hidden = true;

        let empty = wrapper.querySelector(".chart-empty");

        if (!empty) {

            empty = document.createElement("div");
            empty.className = "history-empty chart-empty";
            wrapper.appendChild(empty);

        }

        empty.textContent = "尚無趨勢資料";

    },

    renderChartUnavailable() {

        if (this.chart) {

            this.chart.destroy();
            this.chart = null;

        }

        if (this.statusChart) {

            this.statusChart.destroy();
            this.statusChart = null;

        }

        const wrapper = this.canvas.parentElement;

        if (!wrapper) {

            return;

        }

        this.canvas.hidden = true;

        let empty = wrapper.querySelector(".chart-empty");

        if (!empty) {

            empty = document.createElement("div");
            empty.className = "history-empty chart-empty";
            wrapper.appendChild(empty);

        }

        empty.textContent = "圖表暫時無法顯示";

    },

    resetSummary() {

        Object.keys(this.summaryFields).forEach(key => {

            this.setMetricField(this.summaryFields[key], "--", "");

            if (this.summaryFields[key]) {

                this.summaryFields[key].classList.remove("is-caution-reading");

            }

        });

    },

    resetStats() {

        this.setText(this.statFields.count, "0");
        this.setText(this.statFields.maxSys, "--");
        this.setText(this.statFields.maxDia, "--");
        this.setText(this.statFields.maxPulse, "--");
        this.setText(this.statFields.minSys, "--");
        this.setText(this.statFields.minDia, "--");
        this.setText(this.statFields.minPulse, "--");

        Object.keys(this.statFields).forEach(key => {

            if (this.statFields[key]) {

                this.statFields[key].classList.remove("is-caution-reading");

            }

        });

    },

    setMetricField(element, value, label) {

        if (!element) {

            return;

        }

        if (element.classList.contains("chart-summary-metric")) {

            element.textContent = "";

            const valueNode = document.createElement("div");

            valueNode.className = "chart-summary-metric-value";
            valueNode.textContent = value;

            element.appendChild(valueNode);

        } else {

            element.textContent = value;

        }

        if (label) {

            element.setAttribute("aria-label", `${label} ${value}`);

        }

    },

    setText(element, value) {

        if (!element) {

            return;

        }

        element.textContent = value;

    },

    markBloodPressureMetricPair(sysElement, diaElement, pulseElement, sys, dia) {

        const statusKey = this.getStatusKey(sys, dia);
        const isCautionReading = statusKey === "caution" || statusKey === "high";

        [sysElement, diaElement, pulseElement].forEach(element => {

            if (!element) return;

            element.classList.toggle("is-caution-reading", isCautionReading);

        });

    },

    average(values) {

        if (!values.length) {

            return "--";

        }

        return String(
            Math.round(
                values.reduce((sum, value) => sum + value, 0) / values.length
            )
        );

    },

    isSameDay(a, b) {

        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );

    },

    isSameWeek(date, baseDate) {

        const start = new Date(baseDate);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + diff);

        const end = new Date(start);

        end.setDate(start.getDate() + 7);

        return date >= start && date < end;

    },

    isSameMonth(a, b) {

        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth()
        );

    },

    getDayPeriod(date) {

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return {
                label: "未分類"
            };

        }

        const hour = date.getHours();

        return CHART_DAY_PERIODS.find(period => hour < period.maxHour) || {
            label: "未分類"
        };

    },

    getStatusKey(sys, dia) {

        if (typeof App !== "undefined" && typeof App.getBpStatus === "function") {

            const status = App.getBpStatus(Number(sys), Number(dia));

            return status.className
                ? status.className.replace("is-", "")
                : "ideal";

        }

        return "ideal";

    },

    createStatusDot(className) {

        const dot = document.createElement("span");

        dot.className = `status-dot ${className}`.trim();
        dot.setAttribute("aria-hidden", "true");

        return dot;

    },

    getStatusColor(className) {

        const colors = {
            "status-dot-ideal": "#34C759",
            "status-dot-info": "#4D9FFF",
            "status-dot-caution": "#FF9500",
            "status-dot-high": "#FF6B6B"
        };

        return colors[className] || "#8E8E93";

    },

    normalizeStatusLabel(label) {

        return label === "理想" ? "正常" : label;

    },

    createEmptyStatusSummary() {

        return {
            ideal: { label: "正常", dotClass: "status-dot-ideal", count: 0 },
            info: { label: "偏高", dotClass: "status-dot-info", count: 0 },
            caution: { label: "一期", dotClass: "status-dot-caution", count: 0 },
            high: { label: "二期", dotClass: "status-dot-high", count: 0 }
        };

    },

    getStatusPercent(count, total) {

        if (!total) {

            return 0;

        }

        return Math.round((count / total) * 100);

    }

};

window.ChartPage = ChartPage;

document.addEventListener("DOMContentLoaded", () => {

    ChartPage.init();

});
