/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
(function () {
    "use strict";

    const GIMMED = {};
    const draftsPrefix = "gimmed-medico-draft:";

    GIMMED.escape = function (value) {
        const element = document.createElement("div");
        element.textContent = String(value ?? "");
        return element.innerHTML;
    };

    GIMMED.initials = function (name) {
        return String(name || "").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
    };

    GIMMED.formatDate = function (value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-NI", { dateStyle: "medium", timeStyle: "short" }).format(date);
    };

    GIMMED.toast = function (message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `<strong>${type === "success" ? "✓" : "!"}</strong><span>${GIMMED.escape(message)}</span><button aria-label="Cerrar">×</button>`;
        toast.querySelector("button").addEventListener("click", () => toast.remove());
        container.appendChild(toast);
        window.setTimeout(() => toast.remove(), 4800);
    };

    GIMMED.fetchJSON = async function (url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({ ok: false, message: "Respuesta inválida del servidor." }));
        if (!response.ok || data.ok === false) throw new Error(data.message || "No fue posible completar la operación.");
        return data;
    };

    GIMMED.formObject = function (form) {
        const object = {};
        new FormData(form).forEach((value, key) => { object[key] = String(value); });
        return object;
    };

    GIMMED.validate = function (form) {
        if (form.checkValidity()) return true;
        form.reportValidity();
        GIMMED.toast("Complete correctamente todos los campos obligatorios.", "warning");
        return false;
    };

    GIMMED.bindPatientSearch = function (root, onSelect) {
        const form = root.querySelector(".patient-search-form");
        const input = form.querySelector("input");
        const suggestions = root.querySelector(".patient-suggestions");
        const confirmed = root.querySelector(".patient-confirmed");
        const note = root.querySelector(".patient-search-note");
        let matches = [];

        /** Filtra registros según el texto indicado por la persona usuaria. */
        async function search(showError) {
            const query = input.value.trim();
            if (query.length < 3) {
                suggestions.innerHTML = "";
                if (showError) GIMMED.toast("Escriba al menos tres letras del nombre del paciente.", "warning");
                return;
            }
            try {
                const data = await GIMMED.fetchJSON(`/api/pacientes?nombre=${encodeURIComponent(query)}`);
                matches = data.patients;
                suggestions.innerHTML = matches.slice(0, 5).map(person => `<button type="button" data-id="${person.id}"><i>${GIMMED.initials(person.full_name)}</i><span><strong>${GIMMED.escape(person.full_name)}</strong><small>${GIMMED.escape(person.file_number)}</small></span><b>›</b></button>`).join("");
                suggestions.querySelectorAll("button").forEach(button => button.addEventListener("click", () => select(matches.find(person => person.id === Number(button.dataset.id)))));
                if (!matches.length && showError) GIMMED.toast("Paciente no encontrado. Revise el nombre escrito.", "error");
            } catch (error) {
                if (showError) GIMMED.toast(error.message, "error");
            }
        }

        /** Obtiene un elemento de la interfaz mediante un selector. */
        function select(person) {
            if (!person) return;
            input.value = person.full_name;
            suggestions.innerHTML = "";
            note.hidden = true;
            confirmed.hidden = false;
            confirmed.innerHTML = `<i>${GIMMED.initials(person.full_name)}</i><div><small>PACIENTE CONFIRMADO</small><strong>${GIMMED.escape(person.full_name)}</strong><small>${GIMMED.escape(person.file_number)} · ${GIMMED.escape(person.blood_type)} · ${person.age} años · Alergia: ${GIMMED.escape(person.allergy)}</small></div><button type="button">Cambiar paciente</button>`;
            confirmed.querySelector("button").addEventListener("click", () => {
                confirmed.hidden = true; note.hidden = false; input.value = ""; onSelect(null); input.focus();
            });
            onSelect(person);
        }

        let timer;
        input.addEventListener("input", () => { window.clearTimeout(timer); timer = window.setTimeout(() => search(false), 260); });
        form.addEventListener("submit", async event => {
            event.preventDefault();
            await search(true);
            const exact = matches.find(person => person.full_name.localeCompare(input.value.trim(), "es", { sensitivity: "base" }) === 0);
            if (exact) select(exact); else GIMMED.toast("Escriba y confirme el nombre completo del paciente.", "error");
        });
        return { select };
    };

    GIMMED.activateForm = function (form, patient, draftName) {
        const patientInput = form.querySelector("[name='patient_id']");
        if (!patient) { form.hidden = true; patientInput.value = ""; return; }
        form.hidden = false;
        patientInput.value = patient.id;
        const key = `${draftsPrefix}${draftName}:${patient.id}`;
        const saved = JSON.parse(localStorage.getItem(key) || "null");
        if (saved) {
            Object.entries(saved).forEach(([name, value]) => {
                const control = form.elements.namedItem(name);
                if (control && !Array.isArray(control)) control.value = value;
            });
            GIMMED.toast("Borrador recuperado automáticamente.");
        }
        form.dataset.draftKey = key;
        form.oninput = () => {
            localStorage.setItem(key, JSON.stringify(GIMMED.formObject(form)));
            const status = document.getElementById("draft-status");
            if (status) status.textContent = "Borrador local guardado ahora";
        };
    };

    GIMMED.clearDraft = function (form) {
        if (form.dataset.draftKey) localStorage.removeItem(form.dataset.draftKey);
    };

    GIMMED.postForm = async function (form, url, transform) {
        if (!GIMMED.validate(form)) return null;
        const payload = transform ? transform(GIMMED.formObject(form)) : GIMMED.formObject(form);
        try {
            const data = await GIMMED.fetchJSON(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            GIMMED.clearDraft(form);
            const patientInput = form.querySelector("[name='patient_id']");
            const patientId = patientInput?.value || "";
            form.reset();
            if (patientInput) patientInput.value = patientId;
            GIMMED.toast(`${data.message} Guardado por ${data.record?.author || "el médico"}.`);
            return data;
        } catch (error) {
            GIMMED.toast(`${error.message} El borrador no se perdió.`, "error");
            return null;
        }
    };

    GIMMED.allDrafts = function () {
        const drafts = {};
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key && key.startsWith(draftsPrefix)) drafts[key] = JSON.parse(localStorage.getItem(key) || "{}");
        }
        return drafts;
    };

    GIMMED.backup = async function (silent = false) {
        try {
            const data = await GIMMED.fetchJSON("/api/respaldos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ device_key: navigator.userAgent, drafts: GIMMED.allDrafts() }) });
            if (!silent) GIMMED.toast(data.message);
            return data;
        } catch (error) {
            if (!silent) GIMMED.toast("No se completó el respaldo; los borradores permanecen en este equipo.", "warning");
            return null;
        }
    };

    /** Consulta y prepara datos de la interfaz de médico. */
    async function loadNotifications() {
        const list = document.getElementById("notification-list");
        if (!list) return;
        try {
            const data = await GIMMED.fetchJSON("/api/notificaciones");
            const unread = data.notifications.filter(item => !item.is_read).length;
            document.getElementById("unread-count").textContent = `${unread} sin leer`;
            list.innerHTML = data.notifications.map(item => `<article class="notice ${item.is_read ? "read" : ""}"><button data-id="${item.id}"><small>${GIMMED.escape(item.category)} · ${GIMMED.formatDate(item.created_at)}</small><strong>${GIMMED.escape(item.title)}</strong><p>${GIMMED.escape(item.message)}</p></button></article>`).join("") || "<p>No hay notificaciones.</p>";
            list.querySelectorAll("button[data-id]").forEach(button => button.addEventListener("click", async () => { await GIMMED.fetchJSON("/api/notificaciones", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: Number(button.dataset.id) }) }); loadNotifications(); }));
        } catch (error) { list.innerHTML = `<p>${GIMMED.escape(error.message)}</p>`; }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const theme = localStorage.getItem("gimmed-theme") || "light";
        document.documentElement.dataset.theme = theme;
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("overlay");
        document.getElementById("menu-toggle")?.addEventListener("click", () => { sidebar.classList.add("open"); overlay.classList.add("open"); });
        overlay?.addEventListener("click", () => { sidebar.classList.remove("open"); overlay.classList.remove("open"); });
        const modal = document.getElementById("notifications-modal");
        document.getElementById("notification-button")?.addEventListener("click", () => { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); loadNotifications(); });
        modal?.querySelector("[data-close-modal]")?.addEventListener("click", () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); });
        document.getElementById("mark-all-read")?.addEventListener("click", async () => { await GIMMED.fetchJSON("/api/notificaciones", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); loadNotifications(); document.getElementById("unread-badge")?.remove(); });
        window.setInterval(() => GIMMED.backup(true), 60 * 60 * 1000);
    });

    window.GIMMED = GIMMED;
}());
