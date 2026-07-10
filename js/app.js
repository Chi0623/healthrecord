/* ==========================================================
   安心血壓 v1.0 RC1
   app.js
========================================================== */

"use strict";

const App = {

    /* ==========================================
       State
    ========================================== */

    state: {

        ihb: false,
    
        currentPage: "home",
    
        saving: false,

        editingId: null,

        diaManualEdit: false,

        diaAutoFocus: false,

        programmaticFocus: false,

        userOptions: []
    
    },

    localUserOptionsKey: "bp-user-options",

    ocrTemplatesKey: "bp-ocr-templates",

    ocr: {

        recognizing: false,

        objectUrl: "",

        stream: null,

        templateStream: null,

        templateImage: null,

        templateRects: {},

        templateStep: "sys",

        templateLcdCandidates: [],

        templateLcdDetection: null,

        templateLcdConfirmPending: false,

        templateAutoFields: null,

        templateDebug: false,

        templateDragging: false,

        templateDragStart: null,

        templateDragHandle: null

    },

    /* ==========================================
       DOM
    ========================================== */

    elements: {},

    /* ==========================================
       Init
    ========================================== */

    init() {

        this.cacheElements();

        // 初始化按鈕文字
        this.setSaveButtonLabel("儲存紀錄");

        this.bindViewportEvents();

        this.ensureUserProfile();

        this.loadSettingsForm();

        this.bindEvents();
    
        this.setupInputFlow();
    
        this.updateClock();
    
        this.focusFirstInput();
    
        setInterval(() => {
    
            this.updateClock();
    
        }, 60000);

        this.loadToday();

        this.loadUserOptions();

        this.updateOcrTemplateStatus();
        this.loadCurrentOcrTemplate();
    
    },

    bindViewportEvents() {

        this.updateViewportOffset();

        if (window.visualViewport) {

            window.visualViewport.addEventListener(
                "resize",
                () => this.updateViewportOffset()
            );

            window.visualViewport.addEventListener(
                "scroll",
                () => this.updateViewportOffset()
            );

        }

        window.addEventListener("resize", () => {

            this.updateViewportOffset();

        });

    },

    updateViewportOffset() {

        let keyboardOffset = 0;

        if (window.visualViewport) {

            keyboardOffset = Math.max(
                0,
                window.innerHeight -
                    window.visualViewport.height -
                    window.visualViewport.offsetTop
            );

        }

        document.documentElement.style.setProperty(
            "--keyboard-offset",
            `${Math.round(keyboardOffset)}px`
        );

    },

    /* ==========================================
       User Profile
    ========================================== */

    ensureUserProfile() {

        const profile = this.getUserProfile();

        if (!profile.hasId) {

            localStorage.setItem("bp-user-id", profile.id);

        }

        if (!profile.hasName) {

            localStorage.setItem("bp-user", profile.name);

        }

    },

    getUserProfile() {

        const rawName =
            String(localStorage.getItem("bp-user") || "").trim();

        const rawId =
            String(localStorage.getItem("bp-user-id") || "").trim();

        const name = this.normalizeUserName(rawName);

        const id = rawId ||
            this.createUserId();

        localStorage.setItem("bp-user-id", id);

        if (rawName) {

            localStorage.setItem("bp-user", name);

        }

        return {
            name,
            id,
            hasName: Boolean(rawName),
            hasId: Boolean(rawId)
        };

    },

    getUserName() {

        return this.getUserProfile().name;

    },

    normalizeUserName(value) {

        return String(value || "").trim() || "使用者";

    },

    createUserId() {

        return `user-${Date.now()}`;

    },

    /* ==========================================
       Cache DOM
    ========================================== */

    cacheElements() {

        this.elements = {

            sys: document.getElementById("sys"),

            dia: document.getElementById("dia"),

            pulse: document.getElementById("pulse"),

            ihbBtn: document.getElementById("ihbBtn"),

            saveBtn: document.getElementById("saveBtn"),

            saveBtnLabel: document.querySelector("#saveBtn span"),

            toast: document.getElementById("toast"),

            loading: document.getElementById("loadingOverlay"),

            loadingText: document.querySelector(".loading-text"),

            currentTime: document.getElementById("currentTime"),

            todayCard: document.getElementById("todayCard"),

            todayGreeting: document.getElementById("todayGreeting"),

            todayTitle: document.getElementById("todayTitle"),

            todayTime: document.getElementById("todayTime"),

            todaySys: document.getElementById("todaySys"),

            todayDia: document.getElementById("todayDia"),

            todayPulse: document.getElementById("todayPulse"),

            todayStatus: document.getElementById("todayStatus"),

            ocrCaptureBtn: document.getElementById("ocrCaptureBtn"),

            ocrCameraPanel: document.getElementById("ocrCameraPanel"),

            ocrCameraVideo: document.getElementById("ocrCameraVideo"),

            ocrShutterBtn: document.getElementById("ocrShutterBtn"),

            ocrCancelBtn: document.getElementById("ocrCancelBtn"),

            ocrStatus: document.getElementById("ocrStatus"),

            ocrPreviewWrap: document.getElementById("ocrPreviewWrap"),

            ocrPreview: document.getElementById("ocrPreview"),

            ocrClearBtn: document.getElementById("ocrClearBtn"),

            ocrDebugPanel: document.getElementById("ocrDebugPanel"),

            ocrDebugContent: document.getElementById("ocrDebugContent"),

            settingsApiUrl: document.getElementById("settingsApiUrl"),

            settingsUserOptions: document.getElementById("settingsUserOptions"),

            settingsAddUserBtn: document.getElementById("settingsAddUserBtn"),

            settingsSaveBtn: document.getElementById("settingsSaveBtn"),

            ocrTemplateStatus: document.getElementById("ocrTemplateStatus"),

            ocrTemplateStartBtn: document.getElementById("ocrTemplateStartBtn"),

            ocrTemplateClearBtn: document.getElementById("ocrTemplateClearBtn"),

            ocrTemplatePanel: document.getElementById("ocrTemplatePanel"),

            ocrTemplateVideo: document.getElementById("ocrTemplateVideo"),

            ocrTemplateCanvas: document.getElementById("ocrTemplateCanvas"),

            ocrTemplateHint: document.getElementById("ocrTemplateHint"),

            ocrTemplateCaptureBtn: document.getElementById("ocrTemplateCaptureBtn"),

            ocrTemplateDebugBtn: document.getElementById("ocrTemplateDebugBtn"),

            ocrTemplateCancelBtn: document.getElementById("ocrTemplateCancelBtn"),

            ocrTemplateSteps: document.querySelectorAll(".ocr-template-step"),

            tabs: document.querySelectorAll(".tab"),

            pages: document.querySelectorAll(".page"),

            cards: document.querySelectorAll(".bp-card"),

            tabbar: document.querySelector(".tabbar")

        };

    },

    /* ==========================================
       Bind Events
    ========================================== */

    bindEvents() {

        // Card 點擊

        this.elements.cards.forEach(card => {

            card.addEventListener("click", (e) => {

                if (e.target.closest(".ihb-btn")) return;

                const id = card.dataset.input;

                const input = document.getElementById(id);

                if (!input) return;

                input.focus();

                input.select();

            });

        });

        // IHB

        this.elements.ihbBtn.addEventListener(

            "click",

            () => this.toggleIHB()

        );

        // Save

        this.elements.saveBtn.addEventListener(

            "click",

            () => this.save()

        );

        this.bindOcrEvents();

        // Tabs

        this.elements.tabs.forEach(tab => {

            tab.addEventListener("click", async () => {

                await this.switchPage(tab.dataset.page);

            });

        });

        if (this.elements.settingsSaveBtn) {

            this.elements.settingsSaveBtn.addEventListener("click", async () => {

                await this.saveSettings();

            });

        }

        if (this.elements.settingsAddUserBtn) {

            this.elements.settingsAddUserBtn.addEventListener("click", () => {

                this.promptAddUser();

            });

        }

        this.bindOcrTemplateEvents();

    },

    bindOcrEvents() {

        if (this.elements.ocrCaptureBtn) {

            this.elements.ocrCaptureBtn.addEventListener("click", async () => {

                if (this.ocr.recognizing) return;

                await this.startOcrCamera();

            });

        }

        if (this.elements.ocrShutterBtn) {

            this.elements.ocrShutterBtn.addEventListener("click", async () => {

                await this.captureOcrFrame();

            });

        }

        if (this.elements.ocrCancelBtn) {

            this.elements.ocrCancelBtn.addEventListener("click", () => {

                this.stopOcrCamera();

            });

        }

        if (this.elements.ocrClearBtn) {

            this.elements.ocrClearBtn.addEventListener("click", () => {

                this.clearOcrImage();

            });

        }

    },

    bindOcrTemplateEvents() {

        if (this.elements.ocrTemplateStartBtn) {

            this.elements.ocrTemplateStartBtn.addEventListener("click", async () => {

                await this.startOcrTemplateSetup();

            });

        }

        if (this.elements.ocrTemplateCaptureBtn) {

            this.elements.ocrTemplateCaptureBtn.addEventListener("click", () => {

                this.handleOcrTemplatePrimaryAction();

            });

        }

        if (this.elements.ocrTemplateDebugBtn) {

            this.elements.ocrTemplateDebugBtn.addEventListener("click", () => {

                this.toggleOcrTemplateDebug();

            });

        }

        if (this.elements.ocrTemplateCancelBtn) {

            this.elements.ocrTemplateCancelBtn.addEventListener("click", () => {

                this.cancelOcrTemplateSetup();

            });

        }

        if (this.elements.ocrTemplateClearBtn) {

            this.elements.ocrTemplateClearBtn.addEventListener("click", () => {

                this.clearCurrentOcrTemplate();

            });

        }

        const canvas = this.elements.ocrTemplateCanvas;

        if (!canvas) return;

        canvas.addEventListener("pointerdown", event => {

            this.startOcrTemplateDrag(event);

        });

        canvas.addEventListener("pointermove", event => {

            this.moveOcrTemplateDrag(event);

        });

        canvas.addEventListener("pointerup", event => {

            this.endOcrTemplateDrag(event);

        });

        canvas.addEventListener("pointercancel", event => {

            this.endOcrTemplateDrag(event);

        });

    },

    setSaveButtonLabel(label) {

        if (this.elements.saveBtnLabel) {

            this.elements.saveBtnLabel.textContent = label;

            return;

        }

        if (this.elements.saveBtn) {

            this.elements.saveBtn.textContent = label;

        }

    },

    getSaveButtonLabel() {

        return this.elements.saveBtnLabel
            ? this.elements.saveBtnLabel.textContent
            : this.elements.saveBtn.textContent;

    },

    /* ==========================================
       Header Clock
    ========================================== */

    updateClock() {

        const now = new Date();

        const hour24 = now.getHours();

        const minute = String(now.getMinutes()).padStart(2, "0");

        const period = hour24 < 12 ? "上午" : "下午";

        const hour12 = hour24 % 12 || 12;

        this.elements.currentTime.textContent =

            `${period} ${hour12}:${minute}`;

        this.renderGreeting(now);

    },

    /* ==========================================
       Focus
    ========================================== */

    focusFirstInput() {

        requestAnimationFrame(() => {

            if(this.state.currentPage==="home"){

                this.state.programmaticFocus = true;
        
                this.elements.sys.focus();

                window.setTimeout(() => {

                    this.state.programmaticFocus = false;

                }, 0);
        
            }
        
        });

    },

    /* ==========================================
       IHB
    ========================================== */

    toggleIHB() {

        this.state.ihb = !this.state.ihb;

        this.elements.ihbBtn.classList.toggle(

            "active",

            this.state.ihb

        );

        this.elements.ihbBtn.setAttribute(

            "aria-pressed",

            this.state.ihb

        );

    },

    resetIHB() {

        this.state.ihb = false;

        this.elements.ihbBtn.classList.remove("active");

        this.elements.ihbBtn.setAttribute(

            "aria-pressed",

            "false"

        );

    },

    /* ==========================================
       Loading
    ========================================== */

    showLoading(message = "儲存中") {

        if (this.elements.loadingText) {

            this.elements.loadingText.textContent = message;

        }

        this.elements.loading.classList.remove("hidden");

    },

    hideLoading() {

        this.elements.loading.classList.add("hidden");

    },

    /* ==========================================
       OCR Template Settings
    ========================================== */

    getOcrTemplates() {

        try {

            const data = JSON.parse(
                localStorage.getItem(this.ocrTemplatesKey) || "{}"
            );

            return data && typeof data === "object" ? data : {};

        }

        catch (err) {

            console.error("[OCR Template] parse failed", err);

            return {};

        }

    },

    getCurrentOcrTemplate() {

        return this.normalizeOcrTemplate(
            this.getOcrTemplates()[this.getUserName()] || null
        );

    },

    normalizeOcrTemplate(template) {

        if (!template || typeof template !== "object") {

            return null;

        }

        if (template.version === 2 && template.lcd && template.fields) {

            return template;

        }

        if (template.lcd && template.fields) {

            return {
                ...template,
                version: 2
            };

        }

        if (template.sys && template.dia && template.pulse) {

            return {
                version: 1,
                sys: template.sys,
                dia: template.dia,
                pulse: template.pulse,
                updatedAt: template.updatedAt || ""
            };

        }

        return null;

    },

    createOcrTemplateV2(rects) {

        const lcd = rects.lcd;

        return {
            version: 2,
            lcd,
            fields: {
                sys: this.convertRectToBase(rects.sys, lcd),
                dia: this.convertRectToBase(rects.dia, lcd),
                pulse: this.convertRectToBase(rects.pulse, lcd)
            }
        };

    },

    convertRectToBase(rect, base) {

        return {
            x: (rect.x - base.x) / base.width,
            y: (rect.y - base.y) / base.height,
            width: rect.width / base.width,
            height: rect.height / base.height
        };

    },

    convertRectFromBase(rect, base) {

        return {
            x: base.x + rect.x * base.width,
            y: base.y + rect.y * base.height,
            width: rect.width * base.width,
            height: rect.height * base.height
        };

    },

    async loadCurrentOcrTemplate() {

        if (typeof getOcrTemplate !== "function") {

            return;

        }

        const user = this.getUserName();
        const result = await getOcrTemplate(user);

        if (!result.success || !result.data) {

            this.updateOcrTemplateStatus();

            return;

        }

        const templates = this.getOcrTemplates();

        templates[user] = result.data;

        localStorage.setItem(this.ocrTemplatesKey, JSON.stringify(templates));
        this.updateOcrTemplateStatus();

    },

    async saveCurrentOcrTemplate(template) {

        const templates = this.getOcrTemplates();
        const user = this.getUserName();

        templates[user] = {
            ...template,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(this.ocrTemplatesKey, JSON.stringify(templates));
        this.updateOcrTemplateStatus();

        if (typeof saveOcrTemplate === "function") {

            const result = await saveOcrTemplate(user, template);

            if (!result.success) {

                this.showToast("已儲存在本機，雲端同步失敗");

            }

        }

    },

    async clearCurrentOcrTemplate() {

        const templates = this.getOcrTemplates();
        const user = this.getUserName();

        delete templates[user];

        localStorage.setItem(this.ocrTemplatesKey, JSON.stringify(templates));
        this.updateOcrTemplateStatus();

        if (typeof deleteOcrTemplate === "function") {

            const result = await deleteOcrTemplate(user);

            if (!result.success) {

                this.showToast("已清除本機設定，雲端同步失敗");

                return;

            }

        }

        this.showToast("已清除 OCR 設定");

    },

    updateOcrTemplateStatus() {

        if (!this.elements.ocrTemplateStatus) return;

        const template = this.getCurrentOcrTemplate();

        this.elements.ocrTemplateStatus.textContent = template
            ? template.version === 2
                ? "已設定 OCR v2：LCD 螢幕與數字位置"
                : "已設定舊版 OCR 位置，建議重新設定 v2"
            : "尚未設定目前使用者的 OCR 位置";

    },

    async startOcrTemplateSetup() {

        if (
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== "function"
        ) {

            this.showToast("無法開啟相機");

            return;

        }

        this.ocr.templateRects = {};
        this.ocr.templateStep = "lcd";
        this.ocr.templateImage = null;
        this.ocr.templateLcdCandidates = [];
        this.ocr.templateLcdDetection = null;
        this.ocr.templateLcdConfirmPending = false;
        this.ocr.templateAutoFields = null;
        this.ocr.templateDragHandle = null;
        this.setOcrTemplatePrimaryLabel("拍下");
        this.updateOcrTemplateHint();
        this.syncOcrTemplateSteps();

        if (this.elements.ocrTemplatePanel) {

            this.elements.ocrTemplatePanel.hidden = false;

        }

        if (this.elements.ocrTemplateCanvas) {

            this.elements.ocrTemplateCanvas.hidden = true;

        }

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },
                audio: false
            });

            this.ocr.templateStream = stream;

            if (this.elements.ocrTemplateVideo) {

                this.elements.ocrTemplateVideo.srcObject = stream;
                this.elements.ocrTemplateVideo.hidden = false;

            }

        }

        catch (err) {

            console.error("[OCR Template Camera]", err);
            this.showToast("無法開啟相機");
            this.cancelOcrTemplateSetup();

        }

    },

    handleOcrTemplatePrimaryAction() {

        if (
            this.ocr.templateImage &&
            this.ocr.templateStep === "lcd" &&
            this.ocr.templateLcdConfirmPending
        ) {

            this.confirmDetectedLcd();

            return;

        }

        if (this.ocr.templateImage && this.ocr.templateStep === "lcd") {

            this.startOcrTemplateSetup();

            return;

        }

        this.captureOcrTemplateImage();

    },

    setOcrTemplatePrimaryLabel(label) {

        if (this.elements.ocrTemplateCaptureBtn) {

            this.elements.ocrTemplateCaptureBtn.textContent = label;

        }

    },

    toggleOcrTemplateDebug() {

        this.ocr.templateDebug = !this.ocr.templateDebug;

        if (this.elements.ocrTemplateDebugBtn) {

            this.elements.ocrTemplateDebugBtn.classList.toggle(
                "active",
                this.ocr.templateDebug
            );
            this.elements.ocrTemplateDebugBtn.setAttribute(
                "aria-pressed",
                String(this.ocr.templateDebug)
            );

        }

        this.drawOcrTemplateCanvas();

    },

    captureOcrTemplateImage() {

        const video = this.elements.ocrTemplateVideo;
        const canvas = this.elements.ocrTemplateCanvas;

        if (!video || !canvas || !video.videoWidth || !video.videoHeight) {

            this.showToast("相機尚未準備好");

            return;

        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const image = new Image();

        image.onload = () => {

            this.ocr.templateImage = image;
            this.ocr.templateLcdCandidates = [];
            this.ocr.templateLcdDetection = null;
            this.ocr.templateLcdConfirmPending = false;
            this.ocr.templateAutoFields = null;
            this.ocr.templateDragHandle = null;
            this.stopOcrTemplateCamera();
            video.hidden = true;
            canvas.hidden = false;
            this.detectOcrTemplateLcd();
            this.drawOcrTemplateCanvas();
            this.updateOcrTemplateHint();

        };

        image.src = canvas.toDataURL("image/jpeg", .92);

    },

    detectOcrTemplateLcd() {

        const canvas = this.elements.ocrTemplateCanvas;

        if (!canvas || !this.ocr.templateImage) return;

        const cvBest = this.findLcdWithOpenCv(canvas);

        if (cvBest && cvBest.score >= .58) {

            this.ocr.templateLcdCandidates = [cvBest];
            this.ocr.templateLcdDetection = {
                best: cvBest,
                rejected: []
            };
            this.ocr.templateRects.lcd = cvBest.rect;
            this.ocr.templateLcdConfirmPending = true;
            this.setOcrTemplatePrimaryLabel("確認");

            return;

        }

        const analysis = this.findLcdCandidates(canvas);
        const best = analysis.candidates[0] || null;

        this.ocr.templateLcdCandidates = analysis.candidates;
        this.ocr.templateLcdDetection = {
            best,
            rejected: analysis.rejected
        };

        if (best && best.score >= .72) {

            this.ocr.templateRects.lcd = best.rect;
            this.ocr.templateLcdConfirmPending = true;
            this.setOcrTemplatePrimaryLabel("確認");

            return;

        }

        if (best && best.score >= .48) {

            this.ocr.templateRects.lcd = best.rect;
            this.ocr.templateLcdConfirmPending = true;
            this.setOcrTemplatePrimaryLabel("確認");

            return;

        }

        delete this.ocr.templateRects.lcd;
        this.ocr.templateLcdConfirmPending = false;
        this.setOcrTemplatePrimaryLabel("重拍");

    },

    findLcdCandidates(sourceCanvas) {

        const sampleWidth = 240;
        const sampleHeight = Math.max(
            120,
            Math.round(sourceCanvas.height * sampleWidth / sourceCanvas.width)
        );
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = sampleWidth;
        sampleCanvas.height = sampleHeight;

        const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(sourceCanvas, 0, 0, sampleWidth, sampleHeight);

        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;
        const pixels = sampleWidth * sampleHeight;
        const mask = new Uint8Array(pixels);
        const edge = new Uint8Array(pixels);
        const gray = new Uint8Array(pixels);

        for (let i = 0; i < pixels; i += 1) {

            const offset = i * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            const value = max / 255;
            const labLikeGreen =
                g >= r - 16 &&
                g >= b - 8 &&
                value >= .18 &&
                value <= .78;
            const mutedLcd =
                sat <= .34 &&
                value >= .20 &&
                value <= .74 &&
                labLikeGreen;
            const neutralScreen =
                sat <= .20 &&
                value >= .24 &&
                value <= .70;

            gray[i] = Math.round(r * .299 + g * .587 + b * .114);
            mask[i] = mutedLcd || neutralScreen ? 1 : 0;

        }

        for (let y = 1; y < sampleHeight - 1; y += 1) {

            for (let x = 1; x < sampleWidth - 1; x += 1) {

                const i = y * sampleWidth + x;
                const gx =
                    -gray[i - sampleWidth - 1] +
                    gray[i - sampleWidth + 1] -
                    2 * gray[i - 1] +
                    2 * gray[i + 1] -
                    gray[i + sampleWidth - 1] +
                    gray[i + sampleWidth + 1];
                const gy =
                    -gray[i - sampleWidth - 1] -
                    2 * gray[i - sampleWidth] -
                    gray[i - sampleWidth + 1] +
                    gray[i + sampleWidth - 1] +
                    2 * gray[i + sampleWidth] +
                    gray[i + sampleWidth + 1];

                edge[i] = Math.sqrt(gx * gx + gy * gy) > 42 ? 1 : 0;

            }

        }

        const visited = new Uint8Array(pixels);
        const candidates = [];
        const rejected = [];
        const queue = [];

        for (let i = 0; i < pixels; i += 1) {

            if (!mask[i] || visited[i]) continue;

            let minX = sampleWidth;
            let minY = sampleHeight;
            let maxX = 0;
            let maxY = 0;
            let area = 0;
            let edgeCount = 0;

            queue.length = 0;
            queue.push(i);
            visited[i] = 1;

            for (let q = 0; q < queue.length; q += 1) {

                const current = queue[q];
                const x = current % sampleWidth;
                const y = Math.floor(current / sampleWidth);

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                area += 1;
                edgeCount += edge[current];

                const neighbors = [
                    current - 1,
                    current + 1,
                    current - sampleWidth,
                    current + sampleWidth
                ];

                neighbors.forEach(next => {

                    if (
                        next < 0 ||
                        next >= pixels ||
                        visited[next] ||
                        !mask[next]
                    ) return;

                    const nx = next % sampleWidth;

                    if (Math.abs(nx - x) > 1) return;

                    visited[next] = 1;
                    queue.push(next);

                });

            }

            const candidate = this.scoreLcdCandidate({
                minX,
                minY,
                maxX,
                maxY,
                area,
                edgeCount
            }, sampleWidth, sampleHeight);

            if (candidate.accepted) {

                candidates.push(candidate);

            } else {

                rejected.push(candidate);

            }

        }

        candidates.sort((a, b) => b.score - a.score);
        rejected.sort((a, b) => b.score - a.score);

        return {
            candidates: candidates.slice(0, 8),
            rejected: rejected.slice(0, 12)
        };

    },

    scoreLcdCandidate(raw, width, height) {

        const boxWidth = raw.maxX - raw.minX + 1;
        const boxHeight = raw.maxY - raw.minY + 1;
        const boxArea = boxWidth * boxHeight;
        const imageArea = width * height;
        const fillRatio = raw.area / Math.max(1, boxArea);
        const areaRatio = boxArea / imageArea;
        const aspect = boxWidth / Math.max(1, boxHeight);
        const centerX = (raw.minX + raw.maxX) / 2 / width;
        const centerY = (raw.minY + raw.maxY) / 2 / height;
        const edgeDensity = raw.edgeCount / Math.max(1, raw.area);
        const rectScore = this.scoreRange(fillRatio, .55, .98);
        const areaScore = this.scoreRange(areaRatio, .04, .48);
        const aspectScore = this.scoreSoftRange(aspect, 1.05, 3.9, 1.65, 2.8);
        const positionScore =
            this.scoreSoftRange(centerX, .12, .88, .25, .75) * .55 +
            this.scoreSoftRange(centerY, .10, .86, .20, .68) * .45;
        const edgeScore = this.scoreSoftRange(edgeDensity, .015, .36, .035, .20);
        const quadrilateralScore = this.scoreRectangularEdges(raw, width, height);
        const score =
            rectScore * .20 +
            areaScore * .18 +
            aspectScore * .20 +
            positionScore * .14 +
            edgeScore * .13 +
            quadrilateralScore * .15;
        const reasons = [];

        if (areaRatio < .04) reasons.push("area too small");
        if (areaRatio > .48) reasons.push("area too large");
        if (aspect < 1.05) reasons.push("aspect too narrow");
        if (aspect > 3.9) reasons.push("aspect too wide");
        if (fillRatio < .55) reasons.push("low rectangular fill");
        if (centerY < .10 || centerY > .86) reasons.push("position unlikely");
        if (edgeDensity < .015) reasons.push("weak edge");
        if (score < .30) reasons.push("low confidence");

        return {
            score,
            accepted: score >= .30 && reasons.length < 3,
            reasons,
            rect: {
                x: raw.minX / width,
                y: raw.minY / height,
                width: boxWidth / width,
                height: boxHeight / height
            },
            metrics: {
                areaRatio,
                aspect,
                fillRatio,
                edgeDensity,
                rectangularity: quadrilateralScore,
                centerX,
                centerY
            }
        };

    },

    scoreRectangularEdges(raw, width, height) {

        const marginX = Math.min(raw.minX, width - raw.maxX);
        const marginY = Math.min(raw.minY, height - raw.maxY);
        const hasReasonableMargins = marginX >= 1 && marginY >= 1;
        const boxWidth = raw.maxX - raw.minX + 1;
        const boxHeight = raw.maxY - raw.minY + 1;
        const compactness = Math.min(boxWidth, boxHeight) / Math.max(boxWidth, boxHeight);

        return Math.max(
            0,
            Math.min(
                1,
                (hasReasonableMargins ? .68 : .45) + compactness * .32
            )
        );

    },

    scoreRange(value, min, max) {

        return value >= min && value <= max ? 1 : 0;

    },

    scoreSoftRange(value, outerMin, outerMax, innerMin, innerMax) {

        if (value >= innerMin && value <= innerMax) return 1;
        if (value < outerMin || value > outerMax) return 0;
        if (value < innerMin) {

            return (value - outerMin) / Math.max(.0001, innerMin - outerMin);

        }

        return (outerMax - value) / Math.max(.0001, outerMax - innerMax);

    },

    async confirmDetectedLcd() {

        const rect = this.ocr.templateRects.lcd;

        if (!rect || rect.width < .02 || rect.height < .02) {

            this.showToast("請先確認 LCD 螢幕範圍");

            return;

        }

        const fields = this.detectOcrTemplateNumberFields(rect);

        if (!fields) {

            this.showToast("找不到三組數字，請重拍");
            this.updateOcrTemplateHint();

            return;

        }

        this.ocr.templateRects = {
            lcd: rect,
            sys: this.convertRectFromBase(fields.sys, rect),
            dia: this.convertRectFromBase(fields.dia, rect),
            pulse: this.convertRectFromBase(fields.pulse, rect)
        };
        this.ocr.templateAutoFields = fields;
        this.ocr.templateLcdConfirmPending = false;
        this.setOcrTemplatePrimaryLabel("拍下");
        this.syncOcrTemplateSteps();
        this.drawOcrTemplateCanvas();
        this.updateOcrTemplateHint();

        const template = this.createOcrTemplateV2(this.ocr.templateRects);

        await this.saveCurrentOcrTemplate(template);
        await this.testOcrTemplate(template);
        this.cancelOcrTemplateSetup();

    },

    detectOcrTemplateNumberFields(lcdRect) {

        const canvas = this.elements.ocrTemplateCanvas;

        if (!canvas || !this.ocr.templateImage) {

            return null;

        }

        const crop = this.rectToPixelCrop(lcdRect, canvas.width, canvas.height);
        const sampleWidth = 420;
        const sampleHeight = Math.max(
            160,
            Math.round(crop.height * sampleWidth / Math.max(1, crop.width))
        );
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = sampleWidth;
        sampleCanvas.height = sampleHeight;

        const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(
            this.ocr.templateImage,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            sampleWidth,
            sampleHeight
        );

        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;
        const gray = new Uint8Array(sampleWidth * sampleHeight);
        let total = 0;

        for (let i = 0; i < gray.length; i += 1) {

            const offset = i * 4;
            const value = Math.round(
                data[offset] * .299 +
                data[offset + 1] * .587 +
                data[offset + 2] * .114
            );

            gray[i] = value;
            total += value;

        }

        const mean = total / gray.length;
        const threshold = Math.max(32, Math.min(145, mean - 18));
        const startX = Math.round(sampleWidth * .22);
        const endX = Math.round(sampleWidth * .96);
        const rowCounts = new Array(sampleHeight).fill(0);

        for (let y = 0; y < sampleHeight; y += 1) {

            let count = 0;

            for (let x = startX; x < endX; x += 1) {

                if (gray[y * sampleWidth + x] <= threshold) {

                    count += 1;

                }

            }

            rowCounts[y] = count;

        }

        const smoothed = rowCounts.map((_, index) => {

            let sum = 0;
            let size = 0;

            for (
                let y = Math.max(0, index - 3);
                y <= Math.min(sampleHeight - 1, index + 3);
                y += 1
            ) {

                sum += rowCounts[y];
                size += 1;

            }

            return sum / size;

        });
        const maxRow = Math.max(...smoothed);
        const activeThreshold = Math.max(8, maxRow * .20);
        const bands = [];
        let bandStart = null;

        smoothed.forEach((value, y) => {

            if (value >= activeThreshold && bandStart === null) {

                bandStart = y;

            } else if (value < activeThreshold && bandStart !== null) {

                bands.push({
                    top: bandStart,
                    bottom: y - 1
                });
                bandStart = null;

            }

        });

        if (bandStart !== null) {

            bands.push({
                top: bandStart,
                bottom: sampleHeight - 1
            });

        }

        const fields = bands
            .map(band => this.createNumberFieldFromBand(
                band,
                gray,
                threshold,
                sampleWidth,
                sampleHeight,
                startX,
                endX
            ))
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .sort((a, b) => a.rect.y - b.rect.y);

        if (fields.length < 3) {

            return null;

        }

        return {
            sys: fields[0].rect,
            dia: fields[1].rect,
            pulse: fields[2].rect
        };

    },

    createNumberFieldFromBand(
        band,
        gray,
        threshold,
        width,
        height,
        startX,
        endX
    ) {

        const bandHeight = band.bottom - band.top + 1;
        const heightRatio = bandHeight / height;

        if (heightRatio < .045 || heightRatio > .26) return null;

        let minX = endX;
        let maxX = startX;
        let darkCount = 0;
        const columnCounts = new Array(width).fill(0);

        for (let y = band.top; y <= band.bottom; y += 1) {

            for (let x = startX; x < endX; x += 1) {

                if (gray[y * width + x] <= threshold) {

                    columnCounts[x] += 1;
                    darkCount += 1;

                }

            }

        }

        if (!darkCount) return null;

        const activeColumns = [];
        const columnThreshold = Math.max(1, Math.round((band.bottom - band.top + 1) * .08));

        for (let x = startX; x < endX; x += 1) {

            if (columnCounts[x] >= columnThreshold) {

                activeColumns.push(x);

            }

        }

        if (!activeColumns.length) return null;

        minX = Math.min(...activeColumns);
        maxX = Math.max(...activeColumns);

        if (maxX <= minX) return null;

        const padX = Math.round(width * .035);
        const padY = Math.round(height * .035);
        const left = Math.max(0, minX - padX);
        const right = Math.min(width - 1, maxX + padX);
        const top = Math.max(0, band.top - padY);
        const bottom = Math.min(height - 1, band.bottom + padY);
        const rectWidth = right - left + 1;
        const rectHeight = bottom - top + 1;

        if (rectWidth / width < .12) return null;

        return {
            score: darkCount * heightRatio * (rectWidth / width),
            rect: {
                x: left / width,
                y: top / height,
                width: rectWidth / width,
                height: rectHeight / height
            }
        };

    },

    stopOcrTemplateCamera() {

        if (this.ocr.templateStream) {

            this.ocr.templateStream.getTracks().forEach(track => track.stop());
            this.ocr.templateStream = null;

        }

        if (this.elements.ocrTemplateVideo) {

            this.elements.ocrTemplateVideo.srcObject = null;

        }

    },

    cancelOcrTemplateSetup() {

        this.stopOcrTemplateCamera();

        if (this.elements.ocrTemplatePanel) {

            this.elements.ocrTemplatePanel.hidden = true;

        }

    },

    getOcrTemplatePointer(event) {

        const canvas = this.elements.ocrTemplateCanvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * scaleX)),
            y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * scaleY))
        };

    },

    startOcrTemplateDrag(event) {

        if (!this.ocr.templateImage) return;

        if (this.ocr.templateStep === "lcd") return;

        event.preventDefault();
        this.elements.ocrTemplateCanvas.setPointerCapture(event.pointerId);
        this.ocr.templateDragging = true;
        this.ocr.templateDragStart = this.getOcrTemplatePointer(event);
        this.ocr.templateDragHandle = this.getOcrTemplateDragHandle(
            this.ocr.templateDragStart
        );

    },

    moveOcrTemplateDrag(event) {

        if (!this.ocr.templateDragging || !this.ocr.templateDragStart) return;

        const point = this.getOcrTemplatePointer(event);

        if (this.ocr.templateDragHandle) {

            this.updateOcrTemplateRectHandle(
                this.ocr.templateDragHandle,
                point
            );

        } else {

            this.ocr.templateRects[this.ocr.templateStep] =
                this.createNormalizedRect(this.ocr.templateDragStart, point);

        }

        this.drawOcrTemplateCanvas();

    },

    async endOcrTemplateDrag(event) {

        if (!this.ocr.templateDragging) return;

        this.moveOcrTemplateDrag(event);
        this.ocr.templateDragging = false;
        this.ocr.templateDragStart = null;
        this.ocr.templateDragHandle = null;

        if (this.ocr.templateStep === "lcd") {

            this.ocr.templateLcdConfirmPending = true;
            this.setOcrTemplatePrimaryLabel("確認");

            this.drawOcrTemplateCanvas();
            this.updateOcrTemplateHint();

            return;

        }

        await this.advanceOcrTemplateStep();

    },

    getOcrTemplateDragHandle(point) {

        if (this.ocr.templateStep !== "lcd") return null;

        const rect = this.ocr.templateRects.lcd;
        const canvas = this.elements.ocrTemplateCanvas;

        if (!rect || !canvas) return null;

        const corners = {
            nw: {
                x: rect.x * canvas.width,
                y: rect.y * canvas.height
            },
            ne: {
                x: (rect.x + rect.width) * canvas.width,
                y: rect.y * canvas.height
            },
            sw: {
                x: rect.x * canvas.width,
                y: (rect.y + rect.height) * canvas.height
            },
            se: {
                x: (rect.x + rect.width) * canvas.width,
                y: (rect.y + rect.height) * canvas.height
            }
        };
        const threshold = Math.max(24, Math.min(canvas.width, canvas.height) * .035);
        let best = null;
        let bestDistance = Infinity;

        Object.keys(corners).forEach(key => {

            const corner = corners[key];
            const distance = Math.hypot(point.x - corner.x, point.y - corner.y);

            if (distance < bestDistance) {

                best = key;
                bestDistance = distance;

            }

        });

        return bestDistance <= threshold ? best : null;

    },

    updateOcrTemplateRectHandle(handle, point) {

        const canvas = this.elements.ocrTemplateCanvas;
        const current = this.ocr.templateRects[this.ocr.templateStep];

        if (!canvas || !current) return;

        const left = current.x * canvas.width;
        const top = current.y * canvas.height;
        const right = (current.x + current.width) * canvas.width;
        const bottom = (current.y + current.height) * canvas.height;
        const next = {
            left,
            top,
            right,
            bottom
        };

        if (handle.includes("n")) next.top = point.y;
        if (handle.includes("s")) next.bottom = point.y;
        if (handle.includes("w")) next.left = point.x;
        if (handle.includes("e")) next.right = point.x;

        const normalized = this.createNormalizedRect(
            {
                x: next.left,
                y: next.top
            },
            {
                x: next.right,
                y: next.bottom
            }
        );

        this.ocr.templateRects[this.ocr.templateStep] = normalized;

    },

    createNormalizedRect(start, end) {

        const canvas = this.elements.ocrTemplateCanvas;
        const left = Math.min(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        return {
            x: left / canvas.width,
            y: top / canvas.height,
            width: width / canvas.width,
            height: height / canvas.height
        };

    },

    async advanceOcrTemplateStep() {

        const steps = ["lcd", "sys", "dia", "pulse"];
        const currentIndex = steps.indexOf(this.ocr.templateStep);
        const rect = this.ocr.templateRects[this.ocr.templateStep];

        if (!rect || rect.width < .02 || rect.height < .02) {

            this.showToast("請框選較大的數字區域");

            return;

        }

        if (
            this.ocr.templateStep !== "lcd" &&
            !this.isRectInsideBase(rect, this.ocr.templateRects.lcd)
        ) {

            this.showToast("請在 LCD 螢幕範圍內框選");

            return;

        }

        if (currentIndex < steps.length - 1) {

            this.ocr.templateStep = steps[currentIndex + 1];
            this.syncOcrTemplateSteps();
            this.updateOcrTemplateHint();

            return;

        }

        const template = this.createOcrTemplateV2(this.ocr.templateRects);

        await this.saveCurrentOcrTemplate(template);
        await this.testOcrTemplate(template);
        this.cancelOcrTemplateSetup();

    },

    async testOcrTemplate(template) {

        if (!window.Tesseract || !this.ocr.templateImage) {

            this.showToast("已儲存 OCR 位置");

            return;

        }

        if (this.elements.ocrTemplateHint) {

            this.elements.ocrTemplateHint.textContent = "正在測試 OCR 位置";

        }

        const values = await this.recognizeBloodPressureWithTemplateV2(
            this.ocr.templateImage,
            template
        );

        if (values) {

            this.showToast(
                `OCR 測試 ${values.sys}/${values.dia} 脈搏 ${values.pulse}`
            );

            return;

        }

        this.showToast("已儲存，測試未成功可重新設定");

    },

    isRectInsideBase(rect, base) {

        if (!rect || !base) {

            return false;

        }

        return (
            rect.x >= base.x &&
            rect.y >= base.y &&
            rect.x + rect.width <= base.x + base.width &&
            rect.y + rect.height <= base.y + base.height
        );

    },

    drawOcrTemplateCanvas() {

        const canvas = this.elements.ocrTemplateCanvas;

        if (!canvas || !this.ocr.templateImage) return;

        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.ocr.templateImage, 0, 0, canvas.width, canvas.height);

        if (this.ocr.templateDebug) {

            this.drawOcrTemplateDebug(ctx, canvas);

        }

        Object.keys(this.ocr.templateRects).forEach(key => {

            const rect = this.ocr.templateRects[key];
            const x = rect.x * canvas.width;
            const y = rect.y * canvas.height;
            const width = rect.width * canvas.width;
            const height = rect.height * canvas.height;

            ctx.lineWidth = 4;
            ctx.strokeStyle = key === "lcd"
                ? "#FF9500"
                : key === this.ocr.templateStep
                    ? "#007AFF"
                    : "#34C759";
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = "rgba(0,122,255,.18)";
            ctx.fillRect(x, y, width, height);

            if (key === "lcd") {

                this.drawOcrTemplateHandles(ctx, x, y, width, height);

            }

        });

    },

    drawOcrTemplateDebug(ctx, canvas) {

        const candidates = this.ocr.templateLcdCandidates || [];
        const rejected = this.ocr.templateLcdDetection
            ? this.ocr.templateLcdDetection.rejected || []
            : [];

        candidates.forEach((candidate, index) => {

            this.drawOcrTemplateCandidate(
                ctx,
                canvas,
                candidate,
                index === 0 ? "#FF9500" : "#5AC8FA",
                `${index + 1} ${Math.round(candidate.score * 100)}`
            );

        });

        rejected.slice(0, 6).forEach((candidate, index) => {

            this.drawOcrTemplateCandidate(
                ctx,
                canvas,
                candidate,
                "rgba(255,59,48,.75)",
                `x ${Math.round(candidate.score * 100)} ${candidate.reasons.join(", ")}`
            );

        });

    },

    drawOcrTemplateCandidate(ctx, canvas, candidate, color, label) {

        const rect = candidate.rect;
        const x = rect.x * canvas.width;
        const y = rect.y * canvas.height;
        const width = rect.width * canvas.width;
        const height = rect.height * canvas.height;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
        ctx.font = "700 18px system-ui, sans-serif";
        ctx.fillStyle = "rgba(0,0,0,.72)";
        ctx.fillRect(x, Math.max(0, y - 26), Math.min(canvas.width - x, 320), 24);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, x + 6, Math.max(18, y - 8));
        ctx.restore();

    },

    drawOcrTemplateHandles(ctx, x, y, width, height) {

        const points = [
            [x, y],
            [x + width, y],
            [x, y + height],
            [x + width, y + height]
        ];

        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FF9500";
        ctx.lineWidth = 3;

        points.forEach(point => {

            ctx.beginPath();
            ctx.arc(point[0], point[1], 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

        });

        ctx.restore();

    },

    syncOcrTemplateSteps() {

        this.elements.ocrTemplateSteps.forEach(step => {

            step.classList.toggle(
                "active",
                step.dataset.templateStep === this.ocr.templateStep
            );

            step.classList.toggle(
                "done",
                step.dataset.templateStep === "auto"
                    ? Boolean(
                        this.ocr.templateRects.sys &&
                        this.ocr.templateRects.dia &&
                        this.ocr.templateRects.pulse
                    )
                    : Boolean(this.ocr.templateRects[step.dataset.templateStep])
            );

        });

    },

    updateOcrTemplateHint() {

        if (!this.elements.ocrTemplateHint) return;

        const labels = {
            lcd: "請拍下後確認 LCD 螢幕範圍",
            auto: "正在自動建立數字位置"
        };

        if (
            this.ocr.templateImage &&
            this.ocr.templateStep === "lcd" &&
            this.ocr.templateLcdConfirmPending
        ) {

            const best = this.ocr.templateLcdDetection
                ? this.ocr.templateLcdDetection.best
                : null;

            this.elements.ocrTemplateHint.textContent =
                best && best.score >= .72
                    ? "已找到螢幕，請確認"
                    : "找到可能的螢幕，請確認或重拍";

            return;

        }

        if (
            this.ocr.templateImage &&
            this.ocr.templateStep === "lcd"
        ) {

            this.elements.ocrTemplateHint.textContent =
                "找不到螢幕，請重拍";

            return;

        }

        this.elements.ocrTemplateHint.textContent =
            this.ocr.templateImage
                ? labels[this.ocr.templateStep]
                : "請拍下血壓計螢幕";

    },

    /* ==========================================
       OCR
    ========================================== */

    async startOcrCamera() {

        if (this.ocr.stream) {

            this.showOcrCameraPanel();

            return;

        }

        if (
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== "function"
        ) {

            this.setOcrStatus("此瀏覽器無法直接開啟相機，請改用手動輸入");
            this.showToast("無法開啟相機");

            return;

        }

        this.setOcrStatus("正在開啟相機");

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },
                audio: false
            });

            this.ocr.stream = stream;

            if (this.elements.ocrCameraVideo) {

                this.elements.ocrCameraVideo.srcObject = stream;

            }

            this.setOcrModeActive(true);
            this.showOcrCameraPanel();
            this.setOcrStatus("請對準血壓計螢幕後按拍下辨識");

        }

        catch (err) {

            console.error("[OCR Camera]", err);
            this.setOcrStatus("無法開啟相機，請確認瀏覽器權限");
            this.showToast("無法開啟相機");

        }

    },

    showOcrCameraPanel() {

        this.setOcrModeActive(true);

        if (this.elements.ocrCameraPanel) {

            this.elements.ocrCameraPanel.hidden = false;

        }

    },

    stopOcrCamera() {

        if (this.ocr.stream) {

            this.ocr.stream.getTracks().forEach(track => track.stop());
            this.ocr.stream = null;

        }

        if (this.elements.ocrCameraVideo) {

            this.elements.ocrCameraVideo.srcObject = null;

        }

        if (this.elements.ocrCameraPanel) {

            this.elements.ocrCameraPanel.hidden = true;

        }

        if (!this.ocr.recognizing) {

            this.setOcrStatus("");
            this.setOcrModeActive(false);

        }

    },

    async captureOcrFrame() {

        if (!this.elements.ocrCameraVideo || this.ocr.recognizing) return;

        const video = this.elements.ocrCameraVideo;

        if (!video.videoWidth || !video.videoHeight) {

            this.setOcrStatus("相機尚未準備好，請稍候");

            return;

        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        await this.recognizeBloodPressureImage(canvas);

    },

    async recognizeBloodPressureImage(source) {

        if (!source || this.ocr.recognizing) return;

        if (!window.Tesseract) {

            this.setOcrStatus("無法載入辨識工具，請改用手動輸入");
            this.showToast("無法載入辨識工具");

            return;

        }

        this.ocr.recognizing = true;
        this.setOcrBusy(true);
        this.clearOcrDebug();
        this.showOcrPreview(source);
        this.stopOcrCamera();
        this.setOcrStatus("辨識中，請稍候");
        this.showLoading("辨識中");

        try {

            const debug = {
                steps: []
            };
            let values = await this.recognizeBloodPressureAutomatically(
                source,
                debug
            );

            if (!values) {

                values = await this.recognizeBloodPressureWithTemplate(source);

            }

            if (!values) {

                const images = await this.prepareOcrImages(source);

                for (const image of images) {

                    const text = await this.recognizeOcrCanvas(image, "6");

                    values = this.extractBloodPressureValues(text);

                    if (values) {

                        break;

                    }

                }

            }

            if (!values) {

                this.renderOcrDebug(debug);
                this.setOcrStatus("沒有辨識到完整數字，請重拍或清除照片後手動輸入");
                this.showToast("請重拍或手動輸入");

                return;

            }

            this.renderOcrDebug(debug);
            this.applyOcrValues(values);

        }

        catch (err) {

            console.error("[OCR]", err);
            this.setOcrStatus("辨識失敗，請重拍或手動輸入");
            this.showToast("辨識失敗");

        }

        finally {

            this.ocr.recognizing = false;
            this.setOcrBusy(false);
            this.hideLoading();

        }

    },

    async recognizeOcrCanvas(canvas, pageSegMode = "6") {

        const result = await Tesseract.recognize(
            canvas,
            "eng",
            {
                logger: progress => this.updateOcrProgress(progress),
                tessedit_pageseg_mode: pageSegMode,
                user_defined_dpi: "300",
                tessedit_char_whitelist:
                    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz血壓压收縮缩舒張张脈脉搏拍心率高低/: "
            }
        );

        return result && result.data ? result.data.text : "";

    },

    async recognizeBloodPressureAutomatically(source, debug = null) {

        const bitmap =
            this.isOcrBitmapSource(source)
                ? source
                : await this.loadOcrBitmap(source);
        const lcd = this.detectLcdForOcr(bitmap);

        if (lcd && lcd.canvas) {

            const lcdValues = await this.recognizeBloodPressureFromDigitCanvas(
                lcd.canvas,
                debug,
                "LCD 校正後"
            );

            if (lcdValues) {

                return lcdValues;

            }

        }

        const photoCanvas = this.createBitmapCanvas(bitmap, 1200);

        const photoValues = await this.recognizeBloodPressureFromDigitCanvas(
            photoCanvas,
            debug,
            "整張照片"
        );

        if (photoValues) {

            return photoValues;

        }

        return await this.recognizeBloodPressureFromKnownDeviceLayout(
            photoCanvas,
            debug
        );

    },

    async recognizeBloodPressureFromDigitCanvas(canvas, debug = null, label = "") {

        const fields = this.detectDigitFieldsFromLcdCanvas(canvas);

        if (debug) {

            this.captureDigitFieldDebug(debug, canvas, fields, label);

        }

        if (!fields) {

            return null;

        }

        const segmentValues = this.recognizeSevenSegmentFields(
            canvas,
            fields,
            debug,
            label
        );

        if (segmentValues) {

            return segmentValues;

        }

        const ranges = {
            sys: [50, 280],
            dia: [30, 180],
            pulse: [30, 220]
        };
        const values = {};

        for (const key of ["sys", "dia", "pulse"]) {

            const value = await this.recognizeTemplateField(
                canvas,
                fields[key],
                ranges[key]
            );

            if (!Number.isFinite(value)) {

                return null;

            }

            values[key] = value;

        }

        return this.isOcrBloodPressureValid(
            values.sys,
            values.dia,
            values.pulse
        )
            ? values
            : null;

    },

    async recognizeBloodPressureFromKnownDeviceLayout(canvas, debug = null) {

        const candidates = this.getKnownDeviceDigitLayouts();

        for (const candidate of candidates) {

            if (debug) {

                this.captureDigitFieldDebug(
                    debug,
                    canvas,
                    candidate.fields,
                    candidate.label
                );

            }

            const segmentValues = this.recognizeSevenSegmentFields(
                canvas,
                candidate.fields,
                debug,
                candidate.label
            );

            if (segmentValues) {

                return segmentValues;

            }

            const tesseractValues = await this.recognizeFieldsWithTesseract(
                canvas,
                candidate.fields
            );

            if (tesseractValues) {

                return tesseractValues;

            }

        }

        return null;

    },

    getKnownDeviceDigitLayouts() {

        return [
            {
                label: "Tensoval 右側大字 fallback A",
                fields: {
                    sys: { x: .43, y: .245, width: .24, height: .105 },
                    dia: { x: .46, y: .355, width: .22, height: .105 },
                    pulse: { x: .49, y: .478, width: .18, height: .090 }
                }
            },
            {
                label: "Tensoval 右側大字 fallback B",
                fields: {
                    sys: { x: .39, y: .225, width: .30, height: .120 },
                    dia: { x: .43, y: .335, width: .27, height: .120 },
                    pulse: { x: .46, y: .455, width: .24, height: .105 }
                }
            },
            {
                label: "Tensoval 右側大字 fallback C",
                fields: {
                    sys: { x: .36, y: .205, width: .34, height: .140 },
                    dia: { x: .40, y: .320, width: .31, height: .135 },
                    pulse: { x: .43, y: .440, width: .28, height: .120 }
                }
            }
        ];

    },

    async recognizeFieldsWithTesseract(canvas, fields) {

        const ranges = {
            sys: [50, 280],
            dia: [30, 180],
            pulse: [30, 220]
        };
        const values = {};

        for (const key of ["sys", "dia", "pulse"]) {

            const value = await this.recognizeTemplateField(
                canvas,
                fields[key],
                ranges[key]
            );

            if (!Number.isFinite(value)) {

                return null;

            }

            values[key] = value;

        }

        return this.isOcrBloodPressureValid(
            values.sys,
            values.dia,
            values.pulse
        )
            ? values
            : null;

    },

    detectLcdForOcr(bitmap) {

        const canvas = this.createBitmapCanvas(bitmap, 960);
        const cvResult = this.findLcdWithOpenCv(canvas);

        if (cvResult && cvResult.score >= .58) {

            return {
                ...cvResult,
                canvas: this.createPerspectiveLcdCanvas(canvas, cvResult.corners)
            };

        }

        const analysis = this.findLcdCandidates(canvas);
        const best = analysis.candidates[0] || null;

        if (!best || best.score < .46) {

            return null;

        }

        return {
            score: best.score,
            rect: best.rect,
            corners: this.rectToCorners(best.rect, canvas.width, canvas.height),
            canvas: this.cropRectToCanvas(canvas, best.rect)
        };

    },

    createBitmapCanvas(bitmap, maxLongSide = 1200) {

        const scale = Math.min(
            1,
            maxLongSide / Math.max(bitmap.width, bitmap.height)
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        return canvas;

    },

    findLcdWithOpenCv(canvas) {

        if (!window.cv || typeof cv.imread !== "function") {

            return null;

        }

        let src;
        let gray;
        let blurred;
        let edges;
        let contours;
        let hierarchy;

        try {

            src = cv.imread(canvas);
            gray = new cv.Mat();
            blurred = new cv.Mat();
            edges = new cv.Mat();
            contours = new cv.MatVector();
            hierarchy = new cv.Mat();

            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            cv.Canny(blurred, edges, 40, 130);
            cv.findContours(
                edges,
                contours,
                hierarchy,
                cv.RETR_EXTERNAL,
                cv.CHAIN_APPROX_SIMPLE
            );

            const candidates = [];

            for (let i = 0; i < contours.size(); i += 1) {

                const contour = contours.get(i);
                const bounds = cv.boundingRect(contour);
                const boundAreaRatio =
                    (bounds.width * bounds.height) /
                    Math.max(1, canvas.width * canvas.height);
                const boundAspect =
                    bounds.width / Math.max(1, bounds.height);

                if (
                    boundAreaRatio < .035 ||
                    boundAreaRatio > .62 ||
                    bounds.width < canvas.width * .18 ||
                    bounds.height < canvas.height * .08 ||
                    boundAspect < 1.05 ||
                    boundAspect > 5.2
                ) {

                    contour.delete();

                    continue;

                }

                const peri = cv.arcLength(contour, true);
                const approx = new cv.Mat();

                cv.approxPolyDP(contour, approx, peri * .035, true);

                if (approx.rows === 4) {

                    const points = [];

                    for (let r = 0; r < 4; r += 1) {

                        points.push({
                            x: approx.intPtr(r, 0)[0],
                            y: approx.intPtr(r, 0)[1]
                        });

                    }

                    const candidate = this.scoreLcdQuadCandidate(
                        points,
                        canvas.width,
                        canvas.height
                    );

                    if (candidate.score >= .24) {

                        candidates.push(candidate);

                    }

                }

                approx.delete();
                contour.delete();

            }

            candidates.sort((a, b) => b.score - a.score);

            return candidates[0] || null;

        }

        catch (err) {

            console.warn("[OCR LCD OpenCV]", err);

            return null;

        }

        finally {

            [src, gray, blurred, edges, contours, hierarchy].forEach(mat => {

                if (mat && typeof mat.delete === "function") {

                    mat.delete();

                }

            });

        }

    },

    scoreLcdQuadCandidate(points, width, height) {

        const ordered = this.orderQuadPoints(points);
        const topWidth = Math.hypot(
            ordered.tr.x - ordered.tl.x,
            ordered.tr.y - ordered.tl.y
        );
        const bottomWidth = Math.hypot(
            ordered.br.x - ordered.bl.x,
            ordered.br.y - ordered.bl.y
        );
        const leftHeight = Math.hypot(
            ordered.bl.x - ordered.tl.x,
            ordered.bl.y - ordered.tl.y
        );
        const rightHeight = Math.hypot(
            ordered.br.x - ordered.tr.x,
            ordered.br.y - ordered.tr.y
        );
        const quadWidth = (topWidth + bottomWidth) / 2;
        const quadHeight = (leftHeight + rightHeight) / 2;
        const area = this.polygonArea([
            ordered.tl,
            ordered.tr,
            ordered.br,
            ordered.bl
        ]);
        const areaRatio = area / Math.max(1, width * height);
        const aspect = quadWidth / Math.max(1, quadHeight);
        const rectLeft = Math.min(ordered.tl.x, ordered.bl.x);
        const rectTop = Math.min(ordered.tl.y, ordered.tr.y);
        const rectRight = Math.max(ordered.tr.x, ordered.br.x);
        const rectBottom = Math.max(ordered.bl.y, ordered.br.y);
        const rectWidthRatio = (rectRight - rectLeft) / width;
        const rectHeightRatio = (rectBottom - rectTop) / height;

        if (
            areaRatio < .035 ||
            areaRatio > .62 ||
            rectWidthRatio < .18 ||
            rectHeightRatio < .08 ||
            aspect < 1.05 ||
            aspect > 5.2 ||
            quadWidth < 80 ||
            quadHeight < 36
        ) {

            return {
                score: 0,
                corners: ordered,
                rect: {
                    x: rectLeft / width,
                    y: rectTop / height,
                    width: rectWidthRatio,
                    height: rectHeightRatio
                }
            };

        }

        const centerX =
            (ordered.tl.x + ordered.tr.x + ordered.br.x + ordered.bl.x) /
            4 /
            width;
        const centerY =
            (ordered.tl.y + ordered.tr.y + ordered.br.y + ordered.bl.y) /
            4 /
            height;
        const parallelScore =
            1 -
            Math.min(
                1,
                (
                    Math.abs(topWidth - bottomWidth) / Math.max(quadWidth, 1) +
                    Math.abs(leftHeight - rightHeight) / Math.max(quadHeight, 1)
                ) / 2
            );
        const score =
            this.scoreSoftRange(areaRatio, .025, .55, .06, .32) * .25 +
            this.scoreSoftRange(aspect, 1.05, 4.8, 1.45, 3.5) * .25 +
            this.scoreSoftRange(centerX, .06, .94, .18, .82) * .12 +
            this.scoreSoftRange(centerY, .06, .92, .16, .76) * .12 +
            parallelScore * .26;

        return {
            score,
            corners: ordered,
            rect: {
                x: rectLeft / width,
                y: rectTop / height,
                width: rectWidthRatio,
                height: rectHeightRatio
            }
        };

    },

    orderQuadPoints(points) {

        const sorted = [...points].sort((a, b) => a.y - b.y);
        const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = sorted.slice(2).sort((a, b) => a.x - b.x);

        return {
            tl: top[0],
            tr: top[1],
            bl: bottom[0],
            br: bottom[1]
        };

    },

    polygonArea(points) {

        let area = 0;

        points.forEach((point, index) => {

            const next = points[(index + 1) % points.length];
            area += point.x * next.y - next.x * point.y;

        });

        return Math.abs(area / 2);

    },

    createPerspectiveLcdCanvas(sourceCanvas, corners) {

        if (!window.cv || typeof cv.imread !== "function" || !corners) {

            return this.cropRectToCanvas(
                sourceCanvas,
                this.cornersToRect(corners, sourceCanvas.width, sourceCanvas.height)
            );

        }

        const targetWidth = Math.max(
            240,
            Math.round(Math.max(
                Math.hypot(corners.tr.x - corners.tl.x, corners.tr.y - corners.tl.y),
                Math.hypot(corners.br.x - corners.bl.x, corners.br.y - corners.bl.y)
            ))
        );
        const targetHeight = Math.max(
            120,
            Math.round(Math.max(
                Math.hypot(corners.bl.x - corners.tl.x, corners.bl.y - corners.tl.y),
                Math.hypot(corners.br.x - corners.tr.x, corners.br.y - corners.tr.y)
            ))
        );
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        let src;
        let dst;
        let srcTri;
        let dstTri;
        let matrix;

        try {

            src = cv.imread(sourceCanvas);
            dst = new cv.Mat();
            srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                corners.tl.x, corners.tl.y,
                corners.tr.x, corners.tr.y,
                corners.br.x, corners.br.y,
                corners.bl.x, corners.bl.y
            ]);
            dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0, 0,
                targetWidth - 1, 0,
                targetWidth - 1, targetHeight - 1,
                0, targetHeight - 1
            ]);
            matrix = cv.getPerspectiveTransform(srcTri, dstTri);
            cv.warpPerspective(
                src,
                dst,
                matrix,
                new cv.Size(targetWidth, targetHeight),
                cv.INTER_LINEAR,
                cv.BORDER_REPLICATE
            );
            cv.imshow(canvas, dst);

            return canvas;

        }

        catch (err) {

            console.warn("[OCR LCD Warp]", err);

            return this.cropRectToCanvas(
                sourceCanvas,
                this.cornersToRect(corners, sourceCanvas.width, sourceCanvas.height)
            );

        }

        finally {

            [src, dst, srcTri, dstTri, matrix].forEach(mat => {

                if (mat && typeof mat.delete === "function") {

                    mat.delete();

                }

            });

        }

    },

    rectToCorners(rect, width, height) {

        const x = rect.x * width;
        const y = rect.y * height;
        const right = x + rect.width * width;
        const bottom = y + rect.height * height;

        return {
            tl: { x, y },
            tr: { x: right, y },
            br: { x: right, y: bottom },
            bl: { x, y: bottom }
        };

    },

    cornersToRect(corners, width, height) {

        const xs = [corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x];
        const ys = [corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y];
        const left = Math.max(0, Math.min(...xs));
        const top = Math.max(0, Math.min(...ys));
        const right = Math.min(width, Math.max(...xs));
        const bottom = Math.min(height, Math.max(...ys));

        return {
            x: left / width,
            y: top / height,
            width: (right - left) / width,
            height: (bottom - top) / height
        };

    },

    cropRectToCanvas(sourceCanvas, rect) {

        const crop = this.rectToPixelCrop(
            rect,
            sourceCanvas.width,
            sourceCanvas.height
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(crop.width));
        canvas.height = Math.max(1, Math.round(crop.height));

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(
            sourceCanvas,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return canvas;

    },

    detectDigitFieldsFromLcdCanvas(lcdCanvas) {

        const sampleWidth = 520;
        const sampleHeight = Math.max(
            180,
            Math.round(lcdCanvas.height * sampleWidth / lcdCanvas.width)
        );
        const canvas = document.createElement("canvas");
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(lcdCanvas, 0, 0, sampleWidth, sampleHeight);

        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;
        const gray = new Uint8Array(sampleWidth * sampleHeight);
        const histogram = new Array(256).fill(0);

        for (let i = 0; i < gray.length; i += 1) {

            const offset = i * 4;
            const value = Math.round(
                data[offset] * .299 +
                data[offset + 1] * .587 +
                data[offset + 2] * .114
            );

            gray[i] = value;
            histogram[value] += 1;

        }

        const threshold = this.estimateDarkPixelThreshold(histogram, gray.length);
        let groups = this.findDigitRowsInBloodPressureRoi(
            gray,
            threshold,
            sampleWidth,
            sampleHeight
        );
        let usedComponents = false;

        if (groups.length < 3) {

            groups = this.findDigitRowGroups(
                gray,
                threshold,
                sampleWidth,
                sampleHeight
            );

        }

        if (groups.length < 3) {

            groups = this.findDigitGroupsByComponents(
                gray,
                threshold,
                sampleWidth,
                sampleHeight
            );
            usedComponents = true;

        }

        let selected = this.selectBestDigitFieldTriplet(groups);

        if (!selected && !usedComponents) {

            groups = this.findDigitGroupsByComponents(
                gray,
                threshold,
                sampleWidth,
                sampleHeight
            );
            selected = this.selectBestDigitFieldTriplet(groups);

        }

        if (!selected) {

            return null;

        }

        return {
            sys: selected[0].rect,
            dia: selected[1].rect,
            pulse: selected[2].rect
        };

    },

    findDigitRowsInBloodPressureRoi(gray, threshold, width, height) {

        const rois = [
            {
                x1: .36,
                x2: .78,
                y1: .18,
                y2: .72
            },
            {
                x1: .30,
                x2: .82,
                y1: .16,
                y2: .76
            },
            {
                x1: .22,
                x2: .78,
                y1: .18,
                y2: .74
            }
        ];
        const groups = [];

        rois.forEach(roi => {

            groups.push(...this.findDigitRowsInRoi(
                gray,
                threshold,
                width,
                height,
                roi
            ));

        });

        return this.dedupeDigitGroups(groups);

    },

    findDigitRowsInRoi(gray, threshold, width, height, roi) {

        const startX = Math.round(width * roi.x1);
        const endX = Math.round(width * roi.x2);
        const startY = Math.round(height * roi.y1);
        const endY = Math.round(height * roi.y2);
        const rowCounts = new Array(height).fill(0);

        for (let y = startY; y < endY; y += 1) {

            let count = 0;

            for (let x = startX; x < endX; x += 1) {

                if (gray[y * width + x] <= threshold) {

                    count += 1;

                }

            }

            rowCounts[y] = count;

        }

        const smoothed = rowCounts.map((_, index) => {

            let sum = 0;
            let size = 0;

            for (
                let y = Math.max(startY, index - 5);
                y <= Math.min(endY - 1, index + 5);
                y += 1
            ) {

                sum += rowCounts[y];
                size += 1;

            }

            return size ? sum / size : 0;

        });
        const maxRow = Math.max(...smoothed);
        const activeThreshold = Math.max(4, maxRow * .22);
        const bands = [];
        let start = null;

        for (let y = startY; y < endY; y += 1) {

            if (smoothed[y] >= activeThreshold && start === null) {

                start = y;

            } else if (smoothed[y] < activeThreshold && start !== null) {

                bands.push({
                    top: start,
                    bottom: y - 1
                });
                start = null;

            }

        }

        if (start !== null) {

            bands.push({
                top: start,
                bottom: endY - 1
            });

        }

        return this.mergeDigitBands(bands, height)
            .map(band => this.createNumberFieldFromBand(
                band,
                gray,
                threshold,
                width,
                height,
                startX,
                endX
            ))
            .filter(Boolean)
            .filter(group => (
                group.rect.width >= .07 &&
                group.rect.width <= .50 &&
                group.rect.height >= .030 &&
                group.rect.height <= .18
            ));

    },

    dedupeDigitGroups(groups) {

        const sorted = [...groups].sort((a, b) => b.score - a.score);
        const result = [];

        sorted.forEach(group => {

            const duplicate = result.some(existing =>
                this.rectOverlapRatio(group.rect, existing.rect) >= .55
            );

            if (!duplicate) {

                result.push(group);

            }

        });

        return result;

    },

    rectOverlapRatio(a, b) {

        const left = Math.max(a.x, b.x);
        const top = Math.max(a.y, b.y);
        const right = Math.min(a.x + a.width, b.x + b.width);
        const bottom = Math.min(a.y + a.height, b.y + b.height);
        const width = Math.max(0, right - left);
        const height = Math.max(0, bottom - top);
        const intersection = width * height;
        const minArea = Math.min(a.width * a.height, b.width * b.height);

        return minArea ? intersection / minArea : 0;

    },

    detectDigitFieldsFromLcdCanvasLegacy(lcdCanvas) {

        const sampleWidth = 520;
        const sampleHeight = Math.max(
            180,
            Math.round(lcdCanvas.height * sampleWidth / lcdCanvas.width)
        );
        const canvas = document.createElement("canvas");
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(lcdCanvas, 0, 0, sampleWidth, sampleHeight);

        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;
        const gray = new Uint8Array(sampleWidth * sampleHeight);
        const histogram = new Array(256).fill(0);

        for (let i = 0; i < gray.length; i += 1) {

            const offset = i * 4;
            const value = Math.round(
                data[offset] * .299 +
                data[offset + 1] * .587 +
                data[offset + 2] * .114
            );

            gray[i] = value;
            histogram[value] += 1;

        }

        const threshold = this.estimateDarkPixelThreshold(histogram, gray.length);
        let groups = this.findDigitRowGroups(
            gray,
            threshold,
            sampleWidth,
            sampleHeight
        );
        let usedComponents = false;

        if (groups.length < 3) {

            groups = this.findDigitGroupsByComponents(
                gray,
                threshold,
                sampleWidth,
                sampleHeight
            );
            usedComponents = true;

        }

        let selected = this.selectBestDigitFieldTriplet(groups);

        if (!selected && !usedComponents) {

            groups = this.findDigitGroupsByComponents(
                gray,
                threshold,
                sampleWidth,
                sampleHeight
            );
            selected = this.selectBestDigitFieldTriplet(groups);

        }

        if (!selected) {

            return null;

        }

        return {
            sys: selected[0].rect,
            dia: selected[1].rect,
            pulse: selected[2].rect
        };

    },

    selectBestDigitFieldTriplet(groups) {

        if (!groups || groups.length < 3) return null;

        const sorted = [...groups]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        let best = null;
        let bestScore = -Infinity;

        for (let a = 0; a < sorted.length - 2; a += 1) {

            for (let b = a + 1; b < sorted.length - 1; b += 1) {

                for (let c = b + 1; c < sorted.length; c += 1) {

                    const triplet = [sorted[a], sorted[b], sorted[c]]
                        .sort((x, y) => x.rect.y - y.rect.y);
                    const firstGap = triplet[1].rect.y - triplet[0].rect.y;
                    const secondGap = triplet[2].rect.y - triplet[1].rect.y;
                    const xCenters = triplet.map(item => item.rect.x + item.rect.width / 2);
                    const avgX = xCenters.reduce((sum, value) => sum + value, 0) / 3;
                    const xSpread = Math.max(...xCenters) - Math.min(...xCenters);
                    const sizeScore = triplet.reduce(
                        (sum, item) => sum + item.score,
                        0
                    );
                    const verticalScore =
                        this.scoreSoftRange(firstGap, .05, .36, .09, .24) *
                        this.scoreSoftRange(secondGap, .05, .36, .09, .24);
                    const alignScore = 1 - Math.min(1, xSpread / .34);
                    const positionScore =
                        this.scoreSoftRange(avgX, .18, .88, .34, .72);
                    const total =
                        sizeScore * .55 +
                        verticalScore * 8 +
                        alignScore * 6 +
                        positionScore * 3;

                    if (total > bestScore) {

                        best = triplet;
                        bestScore = total;

                    }

                }

            }

        }

        return best;

    },

    recognizeSevenSegmentFields(canvas, fields, debug = null, label = "") {

        const ranges = {
            sys: [50, 280],
            dia: [30, 180],
            pulse: [30, 220]
        };
        const values = {};

        for (const key of ["sys", "dia", "pulse"]) {

            const value = this.recognizeSevenSegmentField(
                canvas,
                fields[key],
                ranges[key],
                debug,
                `${label} ${key.toUpperCase()}`
            );

            if (!Number.isFinite(value)) {

                return null;

            }

            values[key] = value;

        }

        return this.isOcrBloodPressureValid(
            values.sys,
            values.dia,
            values.pulse
        )
            ? values
            : null;

    },

    recognizeSevenSegmentField(canvas, rect, range, debug = null, label = "") {

        const digitCanvas = this.createSevenSegmentCanvas(canvas, rect);
        const binary = this.createSevenSegmentBinary(digitCanvas);
        const digitRects = this.findSevenSegmentDigitRects(
            binary.mask,
            binary.width,
            binary.height
        );

        const digits = digitRects.map(digitRect =>
            this.classifySevenSegmentDigit(
                binary.mask,
                binary.width,
                binary.height,
                digitRect
            )
        );

        if (debug) {

            this.captureSevenSegmentDebug(
                debug,
                digitCanvas,
                binary,
                digitRects,
                digits,
                label
            );

        }

        if (digitRects.length < 2 || digitRects.length > 3) {

            return null;

        }

        if (digits.some(item => !item || item.confidence < .62)) {

            return null;

        }

        const value = Number(digits.map(item => item.value).join(""));

        return (
            Number.isFinite(value) &&
            value >= range[0] &&
            value <= range[1]
        )
            ? value
            : null;

    },

    createSevenSegmentCanvas(sourceCanvas, rect) {

        const crop = this.rectToPixelCrop(
            rect,
            sourceCanvas.width,
            sourceCanvas.height
        );
        const targetHeight = 150;
        const scale = Math.max(1, targetHeight / Math.max(1, crop.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(crop.width * scale));
        canvas.height = Math.max(1, Math.round(crop.height * scale));

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(
            sourceCanvas,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return canvas;

    },

    createSevenSegmentBinary(canvas) {

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const gray = new Uint8Array(canvas.width * canvas.height);
        const histogram = new Array(256).fill(0);

        for (let i = 0; i < gray.length; i += 1) {

            const offset = i * 4;
            const value = Math.round(
                data[offset] * .299 +
                data[offset + 1] * .587 +
                data[offset + 2] * .114
            );

            gray[i] = value;
            histogram[value] += 1;

        }

        const threshold = this.estimateDarkPixelThreshold(histogram, gray.length);
        const mask = new Uint8Array(gray.length);

        for (let i = 0; i < gray.length; i += 1) {

            mask[i] = gray[i] <= threshold ? 1 : 0;

        }

        return {
            mask,
            width: canvas.width,
            height: canvas.height
        };

    },

    findSevenSegmentDigitRects(mask, width, height) {

        const columns = new Array(width).fill(0);

        for (let y = 0; y < height; y += 1) {

            for (let x = 0; x < width; x += 1) {

                columns[x] += mask[y * width + x];

            }

        }

        const activeThreshold = Math.max(3, height * .08);
        const bands = [];
        let start = null;

        columns.forEach((count, x) => {

            if (count >= activeThreshold && start === null) {

                start = x;

            } else if (count < activeThreshold && start !== null) {

                bands.push({
                    left: start,
                    right: x - 1
                });
                start = null;

            }

        });

        if (start !== null) {

            bands.push({
                left: start,
                right: width - 1
            });

        }

        const merged = this.mergeSevenSegmentDigitBands(bands, width);
        const rects = merged
            .map(band => this.tightenSevenSegmentDigitRect(
                mask,
                width,
                height,
                band
            ))
            .filter(Boolean)
            .filter(rect => (
                rect.width >= width * .035 &&
                rect.height >= height * .32 &&
                rect.width <= width * .48
            ));

        return rects.slice(0, 3);

    },

    mergeSevenSegmentDigitBands(bands, width) {

        const merged = [];
        const gapLimit = Math.max(4, Math.round(width * .035));

        bands.forEach(band => {

            const last = merged[merged.length - 1];

            if (last && band.left - last.right <= gapLimit) {

                last.right = band.right;

            } else {

                merged.push({ ...band });

            }

        });

        return merged;

    },

    tightenSevenSegmentDigitRect(mask, width, height, band) {

        let top = height;
        let bottom = 0;
        let left = Math.max(0, band.left);
        let right = Math.min(width - 1, band.right);
        let count = 0;

        for (let y = 0; y < height; y += 1) {

            for (let x = left; x <= right; x += 1) {

                if (mask[y * width + x]) {

                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                    count += 1;

                }

            }

        }

        if (!count || bottom <= top || right <= left) return null;

        const padX = Math.round((right - left + 1) * .16);
        const padY = Math.round((bottom - top + 1) * .08);

        return {
            x: Math.max(0, left - padX),
            y: Math.max(0, top - padY),
            width: Math.min(width - 1, right + padX) - Math.max(0, left - padX) + 1,
            height: Math.min(height - 1, bottom + padY) - Math.max(0, top - padY) + 1
        };

    },

    classifySevenSegmentDigit(mask, width, height, rect) {

        const regions = {
            a: [.24, .02, .76, .20],
            b: [.68, .12, .98, .48],
            c: [.68, .52, .98, .88],
            d: [.24, .80, .76, .98],
            e: [.02, .52, .32, .88],
            f: [.02, .12, .32, .48],
            g: [.24, .40, .76, .60]
        };
        const active = {};

        Object.keys(regions).forEach(key => {

            active[key] = this.measureSevenSegmentRegion(
                mask,
                width,
                height,
                rect,
                regions[key]
            ) >= .16;

        });

        const pattern = ["a", "b", "c", "d", "e", "f", "g"]
            .map(key => active[key] ? "1" : "0")
            .join("");
        const digits = {
            "1111110": 0,
            "0110000": 1,
            "1101101": 2,
            "1111001": 3,
            "0110011": 4,
            "1011011": 5,
            "1011111": 6,
            "1110000": 7,
            "1111111": 8,
            "1111011": 9
        };

        if (Object.prototype.hasOwnProperty.call(digits, pattern)) {

            return {
                value: digits[pattern],
                confidence: 1
            };

        }

        let bestValue = null;
        let bestDistance = Infinity;

        Object.keys(digits).forEach(target => {

            let distance = 0;

            for (let i = 0; i < target.length; i += 1) {

                if (target[i] !== pattern[i]) {

                    distance += 1;

                }

            }

            if (distance < bestDistance) {

                bestDistance = distance;
                bestValue = digits[target];

            }

        });

        return {
            value: bestValue,
            confidence: Math.max(0, 1 - bestDistance / 3)
        };

    },

    measureSevenSegmentRegion(mask, width, height, rect, region) {

        const left = Math.max(0, Math.round(rect.x + rect.width * region[0]));
        const top = Math.max(0, Math.round(rect.y + rect.height * region[1]));
        const right = Math.min(width - 1, Math.round(rect.x + rect.width * region[2]));
        const bottom = Math.min(height - 1, Math.round(rect.y + rect.height * region[3]));
        let dark = 0;
        let total = 0;

        for (let y = top; y <= bottom; y += 1) {

            for (let x = left; x <= right; x += 1) {

                dark += mask[y * width + x];
                total += 1;

            }

        }

        return total ? dark / total : 0;

    },

    captureDigitFieldDebug(debug, canvas, fields, label) {

        if (!debug || !canvas) return;

        const overlay = this.createOcrDebugCanvas(canvas, 720);
        const ctx = overlay.getContext("2d");

        if (fields) {

            const colors = {
                sys: "#FF3B30",
                dia: "#007AFF",
                pulse: "#34C759"
            };

            Object.keys(colors).forEach(key => {

                const rect = fields[key];

                if (!rect) return;

                const x = rect.x * overlay.width;
                const y = rect.y * overlay.height;
                const width = rect.width * overlay.width;
                const height = rect.height * overlay.height;

                ctx.lineWidth = 4;
                ctx.strokeStyle = colors[key];
                ctx.strokeRect(x, y, width, height);
                ctx.fillStyle = colors[key];
                ctx.font = "700 22px system-ui, sans-serif";
                ctx.fillText(key.toUpperCase(), x + 6, Math.max(24, y - 8));

            });

        }

        debug.steps.push({
            label: `${label || "影像"}：${fields ? "找到三組數字列" : "找不到三組數字列"}`,
            canvas: overlay
        });

    },

    captureSevenSegmentDebug(debug, digitCanvas, binary, digitRects, digits, label) {

        if (!debug || !digitCanvas || !binary) return;

        const canvas = document.createElement("canvas");
        canvas.width = digitCanvas.width;
        canvas.height = digitCanvas.height;
        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(canvas.width, canvas.height);

        for (let i = 0; i < binary.mask.length; i += 1) {

            const value = binary.mask[i] ? 0 : 255;
            const offset = i * 4;
            imageData.data[offset] = value;
            imageData.data[offset + 1] = value;
            imageData.data[offset + 2] = value;
            imageData.data[offset + 3] = 255;

        }

        ctx.putImageData(imageData, 0, 0);

        digitRects.forEach((rect, index) => {

            const digit = digits[index];

            ctx.lineWidth = 3;
            ctx.strokeStyle = digit && digit.confidence >= .62
                ? "#34C759"
                : "#FF3B30";
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = "700 20px system-ui, sans-serif";
            ctx.fillText(
                digit
                    ? `${digit.value} ${Math.round(digit.confidence * 100)}`
                    : "?",
                rect.x + 2,
                Math.max(20, rect.y - 4)
            );

        });

        debug.steps.push({
            label: `${label || "七段"}：digit ${digitRects.length}`,
            canvas
        });

    },

    createOcrDebugCanvas(sourceCanvas, maxWidth) {

        const scale = Math.min(1, maxWidth / sourceCanvas.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sourceCanvas.width * scale));
        canvas.height = Math.max(1, Math.round(sourceCanvas.height * scale));

        const ctx = canvas.getContext("2d");
        ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

        return canvas;

    },

    renderOcrDebug(debug) {

        if (!this.elements.ocrDebugPanel || !this.elements.ocrDebugContent) {

            return;

        }

        this.elements.ocrDebugContent.innerHTML = "";

        if (!debug || !debug.steps || !debug.steps.length) {

            this.elements.ocrDebugPanel.hidden = true;

            return;

        }

        debug.steps.slice(-8).forEach(step => {

            const item = document.createElement("div");
            item.className = "ocr-debug-item";

            const label = document.createElement("div");
            label.className = "ocr-debug-label";
            label.textContent = step.label;

            step.canvas.classList.add("ocr-debug-canvas");
            item.appendChild(label);
            item.appendChild(step.canvas);
            this.elements.ocrDebugContent.appendChild(item);

        });

        this.elements.ocrDebugPanel.hidden = false;

    },

    clearOcrDebug() {

        if (this.elements.ocrDebugContent) {

            this.elements.ocrDebugContent.innerHTML = "";

        }

        if (this.elements.ocrDebugPanel) {

            this.elements.ocrDebugPanel.hidden = true;

        }

    },

    estimateDarkPixelThreshold(histogram, total) {

        let cumulative = 0;

        for (let value = 0; value < histogram.length; value += 1) {

            cumulative += histogram[value];

            if (cumulative / total >= .22) {

                return Math.max(42, Math.min(150, value + 12));

            }

        }

        return 120;

    },

    findDigitRowGroups(gray, threshold, width, height) {

        const startX = Math.round(width * .02);
        const endX = Math.round(width * .98);
        const rowCounts = new Array(height).fill(0);
        const minRun = Math.max(2, Math.round(width * .004));

        for (let y = 0; y < height; y += 1) {

            let count = 0;
            let run = 0;

            for (let x = startX; x < endX; x += 1) {

                const value = gray[y * width + x];

                if (value <= threshold) {

                    run += 1;

                } else {

                    if (run >= minRun) {

                        count += run;

                    }

                    run = 0;

                }

            }

            if (run >= minRun) {

                count += run;

            }

            rowCounts[y] = count;

        }

        const smoothed = rowCounts.map((_, index) => {

            let sum = 0;
            let size = 0;

            for (
                let y = Math.max(0, index - 4);
                y <= Math.min(height - 1, index + 4);
                y += 1
            ) {

                sum += rowCounts[y];
                size += 1;

            }

            return sum / size;

        });
        const maxRow = Math.max(...smoothed);
        const activeThreshold = Math.max(5, maxRow * .16);
        const bands = [];
        let start = null;

        smoothed.forEach((value, y) => {

            if (value >= activeThreshold && start === null) {

                start = y;

            } else if (value < activeThreshold && start !== null) {

                bands.push({ top: start, bottom: y - 1 });
                start = null;

            }

        });

        if (start !== null) {

            bands.push({ top: start, bottom: height - 1 });

        }

        return this.mergeDigitBands(bands, height)
            .map(band => this.createNumberFieldFromBand(
                band,
                gray,
                threshold,
                width,
                height,
                startX,
                endX
            ))
            .filter(Boolean)
            .filter(group => (
                group.rect.width >= .08 &&
                group.rect.width <= .78 &&
                group.rect.height >= .035 &&
                group.rect.height <= .26
            ));

    },

    findDigitGroupsByComponents(gray, threshold, width, height) {

        const mask = new Uint8Array(gray.length);

        for (let i = 0; i < gray.length; i += 1) {

            mask[i] = gray[i] <= threshold ? 1 : 0;

        }

        const components = this.findDarkComponents(mask, width, height)
            .filter(component => this.isLikelySevenSegmentComponent(
                component,
                width,
                height
            ));
        const rows = this.clusterDigitComponentsIntoRows(
            components,
            width,
            height
        );

        return rows
            .map(row => this.createDigitFieldFromComponents(row, width, height))
            .filter(Boolean)
            .filter(group => (
                group.rect.width >= .07 &&
                group.rect.width <= .58 &&
                group.rect.height >= .035 &&
                group.rect.height <= .22
            ));

    },

    findDarkComponents(mask, width, height) {

        const visited = new Uint8Array(mask.length);
        const components = [];
        const queue = [];

        for (let i = 0; i < mask.length; i += 1) {

            if (!mask[i] || visited[i]) continue;

            let minX = width;
            let minY = height;
            let maxX = 0;
            let maxY = 0;
            let area = 0;

            queue.length = 0;
            queue.push(i);
            visited[i] = 1;

            for (let q = 0; q < queue.length; q += 1) {

                const current = queue[q];
                const x = current % width;
                const y = Math.floor(current / width);

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                area += 1;

                const neighbors = [
                    current - 1,
                    current + 1,
                    current - width,
                    current + width
                ];

                neighbors.forEach(next => {

                    if (
                        next < 0 ||
                        next >= mask.length ||
                        visited[next] ||
                        !mask[next]
                    ) return;

                    const nx = next % width;

                    if (Math.abs(nx - x) > 1) return;

                    visited[next] = 1;
                    queue.push(next);

                });

            }

            components.push({
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1,
                area,
                centerX: (minX + maxX) / 2,
                centerY: (minY + maxY) / 2
            });

        }

        return components;

    },

    isLikelySevenSegmentComponent(component, width, height) {

        const areaRatio = component.area / Math.max(1, width * height);
        const componentWidthRatio = component.width / width;
        const componentHeightRatio = component.height / height;
        const fillRatio = component.area / Math.max(1, component.width * component.height);
        const aspect = component.width / Math.max(1, component.height);

        return (
            areaRatio >= .000035 &&
            areaRatio <= .018 &&
            componentWidthRatio >= .006 &&
            componentWidthRatio <= .18 &&
            componentHeightRatio >= .010 &&
            componentHeightRatio <= .18 &&
            fillRatio >= .10 &&
            aspect >= .08 &&
            aspect <= 12
        );

    },

    clusterDigitComponentsIntoRows(components, width, height) {

        const rows = [];
        const sorted = [...components].sort((a, b) => a.centerY - b.centerY);
        const rowGap = Math.max(8, height * .055);

        sorted.forEach(component => {

            let row = rows.find(item =>
                Math.abs(item.centerY - component.centerY) <= rowGap ||
                this.componentOverlapsRow(component, item)
            );

            if (!row) {

                row = {
                    components: [],
                    centerY: component.centerY,
                    minY: component.y,
                    maxY: component.y + component.height
                };
                rows.push(row);

            }

            row.components.push(component);
            row.centerY =
                row.components.reduce((sum, item) => sum + item.centerY, 0) /
                row.components.length;
            row.minY = Math.min(row.minY, component.y);
            row.maxY = Math.max(row.maxY, component.y + component.height);

        });

        return rows
            .map(row => ({
                ...row,
                components: row.components.sort((a, b) => a.x - b.x)
            }))
            .filter(row => row.components.length >= 3);

    },

    componentOverlapsRow(component, row) {

        const top = component.y;
        const bottom = component.y + component.height;

        return bottom >= row.minY && top <= row.maxY;

    },

    createDigitFieldFromComponents(row, width, height) {

        if (!row || !row.components.length) return null;

        const minX = Math.min(...row.components.map(component => component.x));
        const minY = Math.min(...row.components.map(component => component.y));
        const maxX = Math.max(...row.components.map(
            component => component.x + component.width
        ));
        const maxY = Math.max(...row.components.map(
            component => component.y + component.height
        ));
        const totalArea = row.components.reduce(
            (sum, component) => sum + component.area,
            0
        );
        const padX = Math.round(width * .025);
        const padY = Math.round(height * .020);
        const left = Math.max(0, minX - padX);
        const top = Math.max(0, minY - padY);
        const right = Math.min(width - 1, maxX + padX);
        const bottom = Math.min(height - 1, maxY + padY);
        const rectWidth = right - left + 1;
        const rectHeight = bottom - top + 1;
        const centerX = (left + right) / 2 / width;
        const score =
            totalArea / Math.max(1, width * height) * 1000 +
            row.components.length * .18 +
            this.scoreSoftRange(centerX, .18, .90, .34, .76) * 2;

        return {
            score,
            rect: {
                x: left / width,
                y: top / height,
                width: rectWidth / width,
                height: rectHeight / height
            },
            components: row.components.length
        };

    },

    mergeDigitBands(bands, height) {

        const merged = [];
        const gapLimit = Math.max(4, Math.round(height * .025));

        bands.forEach(band => {

            const last = merged[merged.length - 1];

            if (last && band.top - last.bottom <= gapLimit) {

                last.bottom = band.bottom;

            } else {

                merged.push({ ...band });

            }

        });

        return merged;

    },

    async recognizeBloodPressureWithTemplate(source) {

        const template = this.getCurrentOcrTemplate();

        if (!template) return null;

        const bitmap =
            this.isOcrBitmapSource(source)
                ? source
                : await this.loadOcrBitmap(source);

        if (template.version === 2) {

            return await this.recognizeBloodPressureWithTemplateV2(
                bitmap,
                template
            );

        }

        return await this.recognizeBloodPressureWithLegacyTemplate(
            bitmap,
            template
        );

    },

    async recognizeBloodPressureWithTemplateV2(bitmap, template) {

        const lcdCanvas = this.createOcrCanvas(
            bitmap,
            this.rectToPixelCrop(template.lcd, bitmap.width, bitmap.height),
            "grayscale"
        );
        const fields = {
            sys: {
                rect: template.fields.sys,
                range: [50, 280]
            },
            dia: {
                rect: template.fields.dia,
                range: [30, 180]
            },
            pulse: {
                rect: template.fields.pulse,
                range: [30, 220]
            }
        };
        const values = {};

        for (const key of Object.keys(fields)) {

            const value = await this.recognizeTemplateField(
                lcdCanvas,
                fields[key].rect,
                fields[key].range
            );

            if (!Number.isFinite(value)) {

                return null;

            }

            values[key] = value;

        }

        return this.isOcrBloodPressureValid(
            values.sys,
            values.dia,
            values.pulse
        )
            ? values
            : null;

    },

    async recognizeBloodPressureWithLegacyTemplate(bitmap, template) {

        const fields = {
            sys: {
                rect: template.sys,
                range: [50, 280]
            },
            dia: {
                rect: template.dia,
                range: [30, 180]
            },
            pulse: {
                rect: template.pulse,
                range: [30, 220]
            }
        };
        const values = {};

        for (const key of Object.keys(fields)) {

            const value = await this.recognizeTemplateField(
                bitmap,
                fields[key].rect,
                fields[key].range
            );

            if (!Number.isFinite(value)) {

                return null;

            }

            values[key] = value;

        }

        return this.isOcrBloodPressureValid(
            values.sys,
            values.dia,
            values.pulse
        )
            ? values
            : null;

    },

    rectToPixelCrop(rect, width, height) {

        return {
            x: rect.x * width,
            y: rect.y * height,
            width: rect.width * width,
            height: rect.height * height
        };

    },

    async recognizeTemplateField(bitmap, rect, range) {

        if (!rect) return null;

        const crop = this.rectToPixelCrop(rect, bitmap.width, bitmap.height);
        const images = [
            this.createOcrCanvas(bitmap, crop, "lcd"),
            this.createOcrCanvas(bitmap, crop, "contrast"),
            this.createOcrCanvas(bitmap, crop, "threshold"),
            this.createOcrCanvas(bitmap, crop, "grayscale")
        ];

        for (const image of images) {

            for (const pageSegMode of ["7", "8"]) {

                const text = await this.recognizeOcrCanvas(image, pageSegMode);
                const value = this.extractSingleOcrNumber(text, range);

                if (Number.isFinite(value)) {

                    return value;

                }

            }

        }

        return null;

    },

    extractSingleOcrNumber(text, range) {

        const candidates = (
            String(text || "").match(/\b[0-9OQILSB]{2,3}\b/g) || []
        )
            .filter(value => /\d/.test(value))
            .map(value => Number(this.normalizeOcrNumberToken(value)))
            .filter(value => (
                Number.isFinite(value) &&
                value >= range[0] &&
                value <= range[1]
            ));

        return candidates.length ? candidates[0] : null;

    },

    showOcrPreview(source) {

        if (!this.elements.ocrPreview || !this.elements.ocrPreviewWrap) return;

        if (this.ocr.objectUrl) {

            URL.revokeObjectURL(this.ocr.objectUrl);

        }

        if (source instanceof HTMLCanvasElement) {

            this.elements.ocrPreview.src = source.toDataURL("image/jpeg", .9);

        } else {

            this.ocr.objectUrl = URL.createObjectURL(source);
            this.elements.ocrPreview.src = this.ocr.objectUrl;

        }

        this.elements.ocrPreviewWrap.hidden = false;
        this.setOcrModeActive(true);

    },

    clearOcrImage() {

        this.stopOcrCamera();
        this.clearOcrDebug();

        if (this.elements.ocrPreview) {

            this.elements.ocrPreview.removeAttribute("src");

        }

        if (this.elements.ocrPreviewWrap) {

            this.elements.ocrPreviewWrap.hidden = true;

        }

        if (this.ocr.objectUrl) {

            URL.revokeObjectURL(this.ocr.objectUrl);
            this.ocr.objectUrl = "";

        }

        this.setOcrStatus("");
        this.setOcrModeActive(false);

    },

    setOcrModeActive(active) {

        const homePage = document.getElementById("page-home");

        if (homePage) {

            homePage.classList.toggle("is-ocr-active", Boolean(active));

        }

    },

    setOcrStatus(message) {

        if (this.elements.ocrStatus) {

            this.elements.ocrStatus.textContent = message;

        }

    },

    setOcrBusy(busy) {

        if (this.elements.ocrCaptureBtn) {

            this.elements.ocrCaptureBtn.disabled = Boolean(busy);

        }

        if (this.elements.ocrShutterBtn) {

            this.elements.ocrShutterBtn.disabled = Boolean(busy);

        }

    },

    updateOcrProgress(progress) {

        if (!progress || progress.status !== "recognizing text") return;

        const percent = Math.round((progress.progress || 0) * 100);

        this.setOcrStatus(`辨識中 ${percent}%`);

    },

    async prepareOcrImages(source) {

        const bitmap =
            this.isOcrBitmapSource(source)
                ? source
                : await this.loadOcrBitmap(source);
        const crops = this.getOcrCropCandidates(bitmap.width, bitmap.height);
        const modes = [
            "lcd",
            "contrast",
            "threshold",
            "grayscale"
        ];
        const images = [];

        crops.forEach(crop => {

            modes.forEach(mode => {

                images.push(this.createOcrCanvas(bitmap, crop, mode));

            });

        });

        return images;

    },

    getOcrCropCandidates(width, height) {

        return [
            {
                x: 0,
                y: 0,
                width,
                height
            },
            {
                x: width * .08,
                y: height * .18,
                width: width * .68,
                height: height * .68
            },
            {
                x: width * .30,
                y: height * .22,
                width: width * .42,
                height: height * .58
            },
            {
                x: width * .18,
                y: height * .22,
                width: width * .58,
                height: height * .62
            }
        ].map(crop => ({
            x: Math.max(0, Math.round(crop.x)),
            y: Math.max(0, Math.round(crop.y)),
            width: Math.max(1, Math.round(Math.min(crop.width, width - crop.x))),
            height: Math.max(1, Math.round(Math.min(crop.height, height - crop.y)))
        }));

    },

    createOcrCanvas(bitmap, crop, mode) {

        const canvas = document.createElement("canvas");
        const targetLongSide = 1800;
        const cropLongSide = Math.max(crop.width, crop.height);
        const scale = Math.max(
            1,
            Math.min(3, targetLongSide / cropLongSide)
        );

        canvas.width = Math.max(1, Math.round(crop.width * scale));
        canvas.height = Math.max(1, Math.round(crop.height * scale));

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(
            bitmap,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {

            const gray =
                data[i] * 0.299 +
                data[i + 1] * 0.587 +
                data[i + 2] * 0.114;

            if (mode === "threshold") {

                const contrast = gray > 120 ? 255 : 0;

                data[i] = contrast;
                data[i + 1] = contrast;
                data[i + 2] = contrast;

            } else if (mode === "lcd") {

                const enhanced = Math.max(
                    0,
                    Math.min(255, (gray - 82) * 3.1)
                );

                const contrast = enhanced > 105 ? 255 : 0;

                data[i] = contrast;
                data[i + 1] = contrast;
                data[i + 2] = contrast;

            } else if (mode === "contrast") {

                const contrast = Math.max(
                    0,
                    Math.min(255, (gray - 96) * 2.2)
                );

                data[i] = contrast;
                data[i + 1] = contrast;
                data[i + 2] = contrast;

            } else {

                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;

            }

        }

        ctx.putImageData(imageData, 0, 0);

        return canvas;

    },

    async loadOcrBitmap(file) {

        if (typeof createImageBitmap === "function") {

            return await createImageBitmap(file);

        }

        return await new Promise((resolve, reject) => {

            const image = new Image();
            const url = URL.createObjectURL(file);

            image.onload = () => {

                URL.revokeObjectURL(url);
                resolve(image);

            };

            image.onerror = () => {

                URL.revokeObjectURL(url);
                reject(new Error("Image load failed"));

            };

            image.src = url;

        });

    },

    isOcrBitmapSource(source) {

        return (
            source instanceof HTMLCanvasElement ||
            (
                typeof HTMLImageElement !== "undefined" &&
                source instanceof HTMLImageElement
            )
        );

    },

    extractBloodPressureValues(text) {

        const normalized = String(text || "")
            .toUpperCase()
            .replace(/[|]/g, "I")
            .replace(/[^\dA-Z\u4E00-\u9FFF/\n\r :.-]+/g, " ");

        const numbers = (normalized.match(/\b[0-9OQILSB]{2,3}\b/g) || [])
            .filter(value => /\d/.test(value))
            .map(value => this.normalizeOcrNumberToken(value))
            .filter(value => value !== "")
            .map(value => Number(value))
            .filter(value => value >= 30 && value <= 280);

        const readings = this.findOcrLabeledReadings(normalized);
        const sysReadings = readings
            .filter(reading => reading.type === "sys")
            .map(reading => reading.value);
        const diaReadings = readings
            .filter(reading => reading.type === "dia")
            .map(reading => reading.value);
        const pulseReadings = readings
            .filter(reading => reading.type === "pulse")
            .map(reading => reading.value);

        const sys = sysReadings.find(value => value >= 50 && value <= 280) ||
            numbers.find(value => value >= 50 && value <= 280);
        const sysIndex = numbers.findIndex(value => value === sys);

        const dia = diaReadings.find(value => (
            value >= 30 &&
            value <= 180 &&
            value < sys
        )) || sysReadings.find(value => (
            value >= 30 &&
            value <= 180 &&
            value < sys
        )) || numbers.find((value, index) => (
            index !== sysIndex &&
            value >= 30 &&
            value <= 180 &&
            value < sys
        ));
        const diaIndex = numbers.findIndex((value, index) => (
            index !== sysIndex &&
            value === dia
        ));

        const pulse = pulseReadings.find(value => (
            value >= 30 &&
            value <= 220
        )) || numbers.find((value, index) => (
            index !== sysIndex &&
            index !== diaIndex &&
            value >= 30 &&
            value <= 220
        ));

        if (!this.isOcrBloodPressureValid(sys, dia, pulse)) {

            return null;

        }

        return {
            sys,
            dia,
            pulse
        };

    },

    findOcrLabeledReadings(text) {

        const patterns = {
            sys: /\b(SYS|SYSTOLIC|SIS)\b|最高\s*血[壓压圧]|收縮\s*[壓压圧]|收缩\s*[壓压圧]|高\s*[壓压圧]/,
            dia: /\b(DIA|DIASTOLIC)\b|最低\s*血[壓压圧]|舒張\s*[壓压圧]|舒张\s*[壓压圧]|低\s*[壓压圧]/,
            pulse: /\b(PUL|PULSE|PR|BPM)\b|脈拍|脉拍|脈搏|脉搏|心跳|心率/
        };
        const lines = String(text || "")
            .split(/\n+/)
            .map(line => line.trim())
            .filter(Boolean);
        const readings = [];

        lines.forEach((line, index) => {

            const lineHasNumber = /\b\d{2,3}\b/.test(line);
            const labelText = [
                line,
                lines[index + 1] || ""
            ].join(" ");
            const valueText = [
                line,
                lines[index + 1] || "",
                lines[index + 2] || "",
                lines[index + 3] || ""
            ].join(" ");

            Object.keys(patterns).forEach(type => {

                const hasCurrentLabel = patterns[type].test(line);
                const hasSplitLabel =
                    !lineHasNumber &&
                    patterns[type].test(labelText);

                if (!hasCurrentLabel && !hasSplitLabel) return;

                const match = valueText.match(/\b[0-9OQILSB]{2,3}\b/);

                if (!match) return;

                const value = Number(this.normalizeOcrNumberToken(match[0]));

                if (!Number.isFinite(value)) return;

                if (readings.some(reading => (
                    reading.type === type &&
                    reading.value === value &&
                    Math.abs(reading.index - index) <= 1
                ))) {

                    return;

                }

                readings.push({
                    type,
                    value,
                    index
                });

            });

        });

        return readings;

    },

    findOcrLabeledValue(text, labelPattern) {

        const lines = String(text || "").split(/\n+/);

        for (let index = 0; index < lines.length; index += 1) {

            const line = lines[index];

            if (!labelPattern.test(line)) continue;

            const nearbyText = [
                line,
                lines[index + 1] || ""
            ].join(" ");

            const match = nearbyText.match(/\b[0-9OQILSB]{2,3}\b/);

            if (match) {

                return Number(this.normalizeOcrNumberToken(match[0]));

            }

        }

        return null;

    },

    normalizeOcrNumberToken(value) {

        return String(value || "")
            .toUpperCase()
            .replace(/[OQ]/g, "0")
            .replace(/[IL]/g, "1")
            .replace(/S/g, "5")
            .replace(/B/g, "8")
            .replace(/\D/g, "");

    },

    isOcrBloodPressureValid(sys, dia, pulse) {

        return (
            Number.isFinite(sys) &&
            Number.isFinite(dia) &&
            Number.isFinite(pulse) &&
            sys >= 50 &&
            sys <= 280 &&
            dia >= 30 &&
            dia <= 180 &&
            pulse >= 30 &&
            pulse <= 220 &&
            dia < sys
        );

    },

    applyOcrValues(values) {

        this.elements.sys.value = String(values.sys);
        this.elements.dia.value = String(values.dia);
        this.elements.pulse.value = String(values.pulse);

        this.clearErrors();
        this.setOcrModeActive(false);
        this.setOcrStatus(
            `已填入 ${values.sys} / ${values.dia}，脈搏 ${values.pulse}`
        );
        this.showToast("已填入辨識結果");

        if (this.elements.saveBtn) {

            this.elements.saveBtn.focus();

        }

    },

    setKeyboardOpen(open) {

        document.body.classList.toggle("is-keyboard-open", open);

        if (this.elements.tabbar) {

            this.elements.tabbar.setAttribute(
                "aria-hidden",
                open ? "true" : "false"
            );

        }

    },

    scrollFocusedCardIntoView(input) {

        const card = input.closest(".bp-card");

        if (!card) return;

        window.setTimeout(() => {

            card.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            });

        }, 120);

    },

    loadSettingsForm() {

        if (this.elements.settingsApiUrl) {

            this.elements.settingsApiUrl.value =
                typeof getApiUrl === "function"
                    ? getApiUrl()
                    : "";

        }

    },

    async loadUserOptions(showToast = false) {

        if (!this.elements.settingsUserOptions) {

            return;

        }

        this.state.userOptions = this.getMergedUserOptions();
        this.renderUserOptions();

        if (typeof getUsers !== "function") {

            return;

        }

        const result = await getUsers();

        if (!result.success) {

            if (showToast) {

                this.showToast(result.message || "無法載入姓名");

            }

            return;

        }

        this.state.userOptions = this.getMergedUserOptions(result.data || []);
        this.renderUserOptions();

        if (showToast) {

            this.showToast("已更新姓名名單");

        }

    },

    renderUserOptions() {

        const list = this.elements.settingsUserOptions;

        if (!list) {

            return;

        }

        list.textContent = "";

        const currentUser = this.getUserName();

        this.state.userOptions.forEach(name => {

            const option = document.createElement("button");

            option.type = "button";

            option.className = "settings-user-option";

            option.textContent = name;

            option.setAttribute("role", "option");

            option.setAttribute(
                "aria-selected",
                name === currentUser ? "true" : "false"
            );

            option.classList.toggle("active", name === currentUser);

            option.addEventListener("click", () => {

                this.selectUserOption(name);

            });

            list.appendChild(option);

        });

        if (this.elements.settingsAddUserBtn) {

            list.appendChild(this.elements.settingsAddUserBtn);

        }

    },

    getLocalUserOptions() {

        try {

            const raw = JSON.parse(
                localStorage.getItem(this.localUserOptionsKey) || "[]"
            );

            return Array.isArray(raw)
                ? raw.map(name => this.normalizeUserName(name))
                : [];

        }

        catch (err) {

            console.error("[Settings] local users parse failed", err);

            return [];

        }

    },

    saveLocalUserOption(name) {

        const normalized = this.normalizeUserName(name);
        const options = this.getMergedUserOptions([
            ...this.getLocalUserOptions(),
            normalized
        ]);

        localStorage.setItem(
            this.localUserOptionsKey,
            JSON.stringify(options)
        );

        this.state.userOptions = this.getMergedUserOptions(this.state.userOptions);
        this.renderUserOptions();

    },

    getMergedUserOptions(options = []) {

        const names = [
            this.getUserName(),
            ...this.getLocalUserOptions(),
            ...options
        ];
        const seen = new Set();

        return names
            .map(name => this.normalizeUserName(name))
            .filter(name => {

                if (!name || seen.has(name)) {

                    return false;

                }

                seen.add(name);

                return true;

            });

    },

    selectUserOption(name) {

        const userName = this.normalizeUserName(name);

        localStorage.setItem("bp-user", userName);

        this.renderUserOptions();
        this.renderGreeting();
        this.updateOcrTemplateStatus();
        this.loadCurrentOcrTemplate();

    },

    promptAddUser() {

        const input = window.prompt("請輸入新增使用者姓名");

        if (input === null) {

            return;

        }

        const userName = this.normalizeUserName(input);

        if (!String(input || "").trim()) {

            this.showToast("請輸入姓名");

            return;

        }

        localStorage.setItem("bp-user", userName);
        this.saveLocalUserOption(userName);
        this.renderGreeting();
        this.updateOcrTemplateStatus();
        this.loadCurrentOcrTemplate();
        this.showToast("已新增使用者");

    },

    async saveSettings() {

        const apiInput = this.elements.settingsApiUrl;
        const userName = this.getUserName();

        const userId = this.getUserProfile().id || this.createUserId();

        if (typeof setApiUrl === "function" && apiInput) {

            setApiUrl(apiInput.value);
            apiInput.value = getApiUrl();

        }

        localStorage.setItem("bp-user", userName);
        localStorage.setItem("bp-user-id", userId);

        this.saveLocalUserOption(userName);
        this.renderUserOptions();
        this.updateOcrTemplateStatus();

        await this.refreshToday();

        if (window.History) {

            await History.load();

        }

        if (window.ChartPage) {

            await ChartPage.load();

        }

        await this.loadUserOptions();

        this.showToast("已儲存設定");

    },

    /* ==========================================
       Toast
    ========================================== */

    showToast(message = "已儲存紀錄") {

        const text = this.elements.toast.querySelector(".toast-message");

        if(text){

            text.textContent = message;
        
        }

        this.elements.toast.classList.add("show");

        setTimeout(() => {

            this.elements.toast.classList.remove("show");

        }, 1200);

    },
    /* ==========================================
       Input Flow
    ========================================== */

    setupInputFlow() {

        const inputs = [
            this.elements.sys,
            this.elements.dia,
            this.elements.pulse
        ];

        inputs.forEach((input, index) => {

            let timer = null;

            // 只能輸入數字
            input.addEventListener("input", (e) => {

                e.target.value = e.target.value.replace(/\D/g, "");

                clearTimeout(timer);

                const value = e.target.value;

                // SYS 三位數立即跳
                if (index === 0 && value.length >= 3) {

                    this.focusInput(index + 1);

                    return;

                }

                // DIA / Pulse 自動跳轉
                if (value.length >= 2) {

                    if (index === 0) {

                        return;

                    }

                    if (index === 1 && this.state.diaManualEdit) {

                        return;

                    }

                    if (index === 1) {

                        this.focusInput(index + 1);

                        return;

                    }

                    if (index < inputs.length - 1) {

                        this.focusInput(index + 1);

                    }

                }

            });

            // 點一下全選
            input.addEventListener("focus", () => {

                if (input === this.elements.dia) {

                    this.state.diaManualEdit =
                        !this.state.diaAutoFocus;

                    this.state.diaAutoFocus = false;

                }

                input.select();

                if (!this.state.programmaticFocus) {

                    this.setKeyboardOpen(true);

                }

                this.scrollFocusedCardIntoView(input);

            });

            input.addEventListener("blur", () => {

                window.setTimeout(() => {

                    const active = document.activeElement;

                    if (!active || !active.classList.contains("bp-input")) {

                        this.setKeyboardOpen(false);

                    }

                }, 80);

            });

            // Enter
            input.addEventListener("keydown", (e) => {

                if (e.key !== "Enter") return;

                e.preventDefault();

                if (index < inputs.length - 1) {

                    if (index === 1) {

                        this.state.diaManualEdit = false;

                    }

                    this.focusInput(index + 1);

                } else {

                    this.save();

                }

            });

            // 貼上時也只保留數字
            input.addEventListener("paste", (e) => {

                e.preventDefault();

                const text = (
                    e.clipboardData ||
                    window.clipboardData
                ).getData("text");

                input.value = text.replace(/\D/g, "").slice(0, 3);

            });

        });

    },

    /* ==========================================
       Focus Input
    ========================================== */

    focusInput(index) {

        const inputs = [

            this.elements.sys,

            this.elements.dia,

            this.elements.pulse

        ];

        if (!inputs[index]) return;

        if (inputs[index] === this.elements.dia) {

            this.state.diaManualEdit = false;

            this.state.diaAutoFocus = true;

        }

        requestAnimationFrame(() => {

            inputs[index].focus();

            inputs[index].select();

        });

    },

    /* ==========================================
       Switch Page
    ========================================== */

    async switchPage(page) {

        if (document.activeElement && document.activeElement.blur) {

            document.activeElement.blur();

        }

        this.setKeyboardOpen(false);

        this.state.currentPage = page;
    
        this.elements.pages.forEach(section => {
    
            section.classList.remove("active");
    
        });
    
        const current = document.getElementById(`page-${page}`);
    
        if (current) {
    
            current.classList.add("active");
    
        }
    
        this.elements.tabs.forEach(tab => {
    
            tab.classList.toggle(
    
                "active",
    
                tab.dataset.page === page
    
            );
    
        });
    
        switch (page) {
    
            case "history":
    
                if (window.History) {
    
                    await History.load();
    
                }
    
                break;
    
            case "chart":
    
                if (window.ChartPage) {
    
                    await ChartPage.load();
    
                }
    
                break;
    
            default:
    
                break;
    
        }
    
    },
        /* ==========================================
       Validation
    ========================================== */

    validate() {

        const sys = Number(this.elements.sys.value);

        const dia = Number(this.elements.dia.value);

        const pulse = Number(this.elements.pulse.value);

        this.clearErrors();

        if (!sys) {

            this.showError(this.elements.sys, "請輸入收縮壓");

            return false;

        }

        if (!dia) {

            this.showError(this.elements.dia, "請輸入舒張壓");

            return false;

        }

        if (!pulse) {

            this.showError(this.elements.pulse, "請輸入脈搏");

            return false;

        }

        if (sys < 50 || sys > 280) {

            this.showError(this.elements.sys, "請確認收縮壓");

            return false;

        }

        if (dia < 30 || dia > 180) {

            this.showError(this.elements.dia, "請確認舒張壓");

            return false;

        }

        if (pulse < 30 || pulse > 220) {

            this.showError(this.elements.pulse, "請確認脈搏");

            return false;

        }

        if (dia >= sys) {

            this.showError(this.elements.dia, "舒張壓不能大於收縮壓");

            return false;

        }

        return {

            sys,

            dia,

            pulse,

            ihb: this.state.ihb

        };

    },



    /* ==========================================
       Error UI
    ========================================== */

    showError(input, message) {

        const card = input.closest(".bp-card");

        if (!card) return;

        card.classList.add("error");

        let msg = card.querySelector(".error-message");

        if (!msg) {

            msg = document.createElement("div");

            msg.className = "error-message";

            card.appendChild(msg);

        }

        msg.textContent = message;

        input.focus();

        input.select();

    },



    clearErrors() {

        document.querySelectorAll(".bp-card").forEach(card => {

            card.classList.remove("error");

        });

        document.querySelectorAll(".error-message").forEach(el => {

            el.remove();

        });

    },



    /* ==========================================
       Save
    ========================================== */

    /* ==========================================
   Save
========================================== */

    async save() {

        if (this.state.saving) return;

        const data = this.validate();

        if (!data) return;

        this.state.saving = true;

        this.elements.saveBtn.disabled = true;

        const previousButtonText = this.getSaveButtonLabel();

        this.setSaveButtonLabel("儲存中");

        this.showLoading();

        try {

            const user =
                this.getUserName();

            let result;

            // ===== 修改模式 =====
            if (this.state.editingId) {

                result = await updateRecord({

                    id: this.state.editingId,

                    user,

                    sys: data.sys,

                    dia: data.dia,

                    pulse: data.pulse,

                    ihb: data.ihb

                });

            }

            // ===== 新增模式 =====
            else {

                result = await saveRecord({

                    user,

                    sys: data.sys,

                    dia: data.dia,

                    pulse: data.pulse,

                    ihb: data.ihb

                });

            }

            if (result.success) {

                // 修改完成後離開編輯模式
                this.state.editingId = null;

                await this.saveSuccess();

            } else {

                this.saveFailed(

                    result.message || "儲存失敗，請再按一次"

                );

            }

        }

        catch (err) {

            console.error(err);

            this.saveFailed(

                "儲存失敗，請再按一次"

            );

        }

        finally {

            this.state.saving = false;

            this.elements.saveBtn.disabled = false;

            if (this.getSaveButtonLabel() === "儲存中") {

                this.setSaveButtonLabel(previousButtonText);

            }

            this.hideLoading();

        }

    },



    /* ==========================================
       Save Result
    ========================================== */

    async saveSuccess() {

        const refreshed = await this.refreshToday();

        if (!refreshed) {

            this.showToast("已儲存，畫面更新失敗");

            return;

        }

        this.showToast("已儲存紀錄");
    
        this.clearForm();
    
        // 更新紀錄頁
        if (window.History) {
    
            await History.load();
    
        }
    
        // 更新趨勢圖
        if (window.ChartPage) {
    
            await ChartPage.load();
    
        }
    
    },



    saveFailed() {

        this.setSaveButtonLabel("儲存紀錄");

        this.showToast("儲存失敗，請再按一次");

    },



    /* ==========================================
       Clear Form
    ========================================== */

    clearForm() {

        this.elements.sys.value = "";
    
        this.elements.dia.value = "";
    
        this.elements.pulse.value = "";
    
        this.state.editingId = null;
    
        // 恢復按鈕文字
        this.setSaveButtonLabel("儲存紀錄");
    
        this.resetIHB();
    
        this.clearErrors();
    
        this.focusFirstInput();
    
    },
    /* ==========================================
       Today Card
    ========================================== */

    async loadToday() {

        if (!this.elements.todayCard) return;

        if (typeof getTodayRecord !== "function") {

            this.renderTodayEmpty();

            return false;

        }

        try {

            const user =
                this.getUserName();

            const result = await getTodayRecord(user);

            if (!result.success || !result.data) {

                this.renderTodayEmpty();

                return false;

            }

            this.renderToday(result.data);

            return true;

        }

        catch (err) {

            console.error(err);

            this.renderTodayEmpty();

            return false;

        }

    },

    async refreshToday() {

        return await this.loadToday();

    },

    renderToday(record) {

        const status = this.getBpStatus(
            Number(record.sys),
            Number(record.dia)
        );

        this.elements.todayCard.classList.remove("is-empty");

        this.renderGreeting();

        this.elements.todayTitle.textContent = "上次量測";

        this.renderTodayTime(record.datetime);

        this.elements.todaySys.textContent = String(record.sys);
        this.elements.todaySys.parentElement.setAttribute(
            "aria-label",
            `收縮壓 ${record.sys}`
        );

        this.elements.todayDia.textContent = String(record.dia);
        this.elements.todayDia.parentElement.setAttribute(
            "aria-label",
            `舒張壓 ${record.dia}`
        );

        this.renderPulseMetric(
            this.elements.todayPulse,
            record.pulse,
            record.ihb
        );

        this.elements.todayStatus.textContent = status.label;

        this.elements.todayStatus.className =
            `today-status ${status.className}`;

        this.elements.todayCard.classList.toggle(
            "is-caution-reading",
            status.className === "is-caution" || status.className === "is-high"
        );

    },

    renderTodayEmpty() {

        this.elements.todayCard.classList.add("is-empty");
        this.elements.todayCard.classList.remove("is-caution-reading");

        this.renderGreeting();

        this.elements.todayTitle.textContent = "上次量測";

        this.renderTodayTime(null);

        this.elements.todaySys.textContent = "--";
        this.elements.todaySys.parentElement.setAttribute(
            "aria-label",
            "收縮壓 --"
        );

        this.elements.todayDia.textContent = "--";
        this.elements.todayDia.parentElement.setAttribute(
            "aria-label",
            "舒張壓 --"
        );

        this.elements.todayPulse.textContent = "--";
        this.elements.todayPulse.parentElement.setAttribute(
            "aria-label",
            "脈搏 --"
        );

        this.elements.todayStatus.textContent = "--";

        this.elements.todayStatus.className =
            "today-status is-empty";

    },

    renderGreeting(now = new Date()) {

        if (!this.elements.todayGreeting) return;

        const user =
            this.getUserName();

        this.elements.todayGreeting.textContent =
            `${user}，${this.getGreetingLabel(now)}~`;

    },

    getGreetingLabel(date) {

        const hour = date.getHours();

        if (hour >= 5 && hour <= 10) {

            return "早安";

        }

        if (hour >= 11 && hour <= 16) {

            return "午安";

        }

        if (hour >= 17 && hour <= 22) {

            return "晚安";

        }

        return "夜深了";

    },

    renderPulseMetric(element, pulse, ihb) {

        if (!element) return;

        element.textContent = pulse == null ? "--" : String(pulse);

        element.parentElement.setAttribute(
            "aria-label",
            ihb === true
                ? `脈搏 ${pulse}，不規則心跳`
                : `脈搏 ${pulse == null ? "--" : pulse}`
        );

        if (ihb !== true) {

            return;

        }

        const icon = document.createElement("img");

        icon.className = "metric-ihb-icon";

        icon.src = "assets/ihb.svg";

        icon.alt = "不規則心跳";

        element.appendChild(icon);

    },

    formatTodayTime(value) {

        const parts = this.getTodayTimeParts(value);

        if (!parts) {

            return "--";

        }

        return `${parts.label} ${parts.time}`;

    },

    getTodayTimeParts(value) {

        const date =
            typeof parseRecordDateTime === "function"
                ? parseRecordDateTime(value)
                : new Date(value);

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return null;

        }

        const now = new Date();

        const time = date.toLocaleTimeString("zh-TW", {

            hour: "2-digit",

            minute: "2-digit",

            hour12: false

        });

        if (this.isSameDay(date, now)) {

            return {
                label: "今天",
                time
            };

        }

        const yesterday = new Date(now);

        yesterday.setDate(now.getDate() - 1);

        if (this.isSameDay(date, yesterday)) {

            return {
                label: "昨天",
                time
            };

        }

        if (this.isSameWeek(date, now)) {

            return {
                label: this.getWeekLabel(date),
                time
            };

        }

        return {
            label: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
                date.getDate()
            ).padStart(2, "0")}`,
            time
        };

    },

    renderTodayTime(value) {

        const container = this.elements.todayTime;

        if (!container) {

            return;

        }

        container.textContent = "";

        const date =
            typeof parseRecordDateTime === "function"
                ? parseRecordDateTime(value)
                : new Date(value);

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            container.textContent = "--";

            return;

        }

        const period = this.getDayPeriod(date);

        const parts = this.getTodayTimeParts(date);

        if (!parts) {

            container.textContent = "--";

            return;

        }

        const label = document.createElement("span");

        label.textContent = parts.label;

        container.appendChild(label);

        container.appendChild(
            this.createPeriodIcon(period.icon, "chip-icon")
        );

        const text = document.createElement("span");

        text.textContent = parts.time;

        container.appendChild(text);

    },

    getDayPeriod(date) {

        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {

            return {
                icon: "time",
                label: "未分類"
            };

        }

        const hour = date.getHours();

        if (hour < 6) {

            return {
                icon: "night",
                label: "晚上"
            };

        }

        if (hour < 9) {

            return {
                icon: "dawn",
                label: "清晨"
            };

        }

        if (hour < 12) {

            return {
                icon: "morning",
                label: "上午"
            };

        }

        if (hour < 18) {

            return {
                icon: "afternoon",
                label: "下午"
            };

        }

        return {
            icon: "night",
            label: "晚上"
        };

    },

    createPeriodIcon(type, className = "chip-icon") {

        const ns = "http://www.w3.org/2000/svg";

        const svg = document.createElementNS(ns, "svg");

        svg.setAttribute("class", className);
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

    getWeekLabel(date) {

        const labels = [
            "週日",
            "週一",
            "週二",
            "週三",
            "週四",
            "週五",
            "週六"
        ];

        return labels[date.getDay()];

    },

    getBpStatus(sys, dia) {

        if (sys >= 160 || dia >= 100) {

            return {
                label: "二期",
                className: "is-high"
            };

        }

        if (sys < 160 && dia < 100 && (sys > 139 || dia > 89)) {

            return {
                label: "一期",
                className: "is-caution"
            };

        }

        if (sys < 140 && dia < 90 && (sys > 120 || dia > 80)) {

            return {
                label: "前期",
                className: "is-info"
            };

        }

        return {
            label: "正常",
            className: ""
        };

    },

    /* ==========================================
       Page Load
    ========================================== */

    async loadHome() {

        await this.loadToday();

    },

    async loadHistory() {

        if (!window.History) return;
    
        try {
    
            await History.load();
    
        }
    
        catch (err) {
    
            console.error(err);
    
        }
    
    },


    async loadChart() {

        if (!window.ChartPage) return;
    
        try {
    
            await ChartPage.load();
    
        }
    
        catch (err) {
    
            console.error(err);
    
        }
    
    },



    /* ==========================================
       Refresh
    ========================================== */

    async refreshCurrentPage() {

        switch (this.state.currentPage) {

            case "history":

                await this.loadHistory();

                break;

            case "chart":

                await this.loadChart();

                break;

            default:

                await this.loadHome();

        }

    },



    /* ==========================================
       Helpers
    ========================================== */

    getFormData() {

        return {

            sys: Number(this.elements.sys.value),

            dia: Number(this.elements.dia.value),

            pulse: Number(this.elements.pulse.value),

            ihb: this.state.ihb

        };

    },



    resetForm() {

        this.clearForm();

    }

};



/* ==========================================
   Startup
========================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        App.init();

    }

);
