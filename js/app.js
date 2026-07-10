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

    ocr: {

        recognizing: false,

        objectUrl: "",

        stream: null

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

            settingsApiUrl: document.getElementById("settingsApiUrl"),

            settingsUserOptions: document.getElementById("settingsUserOptions"),

            settingsAddUserBtn: document.getElementById("settingsAddUserBtn"),

            settingsSaveBtn: document.getElementById("settingsSaveBtn"),

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
        this.showOcrPreview(source);
        this.stopOcrCamera();
        this.setOcrStatus("辨識中，請稍候");
        this.showLoading("辨識中");

        try {

            const images = await this.prepareOcrImages(source);
            let values = null;

            for (const image of images) {

                const result = await Tesseract.recognize(
                    image,
                    "eng",
                    {
                        logger: progress => this.updateOcrProgress(progress),
                        tessedit_pageseg_mode: "6",
                        user_defined_dpi: "300",
                        tessedit_char_whitelist:
                            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz血壓压收縮缩舒張张脈脉搏拍心率高低/: "
                    }
                );

                values = this.extractBloodPressureValues(
                    result && result.data ? result.data.text : ""
                );

                if (values) {

                    break;

                }

            }

            if (!values) {

                this.setOcrStatus("沒有辨識到完整數字，請重拍或清除照片後手動輸入");
                this.showToast("請重拍或手動輸入");

                return;

            }

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
            source instanceof HTMLCanvasElement
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
