/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("directory-search");
    const input = document.getElementById("directory-query");
    const message = document.getElementById("directory-message");
    const results = document.getElementById("directory-results");
    const history = document.getElementById("history-view");
    const historyList = document.getElementById("history-list");
    const dateInput = document.getElementById("history-date");
    let currentPatientId = null;

    /** Coordina la operación patientCard de la interfaz de médico. */
    function patientCard(person) {
        return `<button class="patient-result" data-id="${person.id}"><i>${GIMMED.initials(person.full_name)}</i><span><strong>${GIMMED.escape(person.full_name)}</strong><small>${GIMMED.escape(person.file_number)} · ${GIMMED.escape(person.identification)}</small><em>${GIMMED.escape(person.last_reason)}</em></span><time>ÚLTIMA ACTUALIZACIÓN<br><strong>${GIMMED.formatDate(person.updated_at)}</strong></time><b>›</b></button>`;
    }

    /** Filtra registros según el texto indicado por la persona usuaria. */
    async function search(event) {
        event?.preventDefault();
        const query = input.value.trim();
        if (query.length < 3) { GIMMED.toast("Escriba al menos tres letras del nombre.", "warning"); return; }
        try {
            const data = await GIMMED.fetchJSON(`/api/pacientes?nombre=${encodeURIComponent(query)}`);
            message.hidden = true; history.hidden = true; results.hidden = false;
            results.innerHTML = data.patients.map(patientCard).join("") || `<section class="empty-panel panel"><h2>Paciente no encontrado</h2><p>Compruebe el nombre escrito.</p></section>`;
            results.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => loadHistory(Number(button.dataset.id))));
            if (!data.patients.length) GIMMED.toast("Paciente no encontrado.", "error");
        } catch (error) { GIMMED.toast(error.message, "error"); }
    }

    /** Coordina la operación recordCard de la interfaz de médico. */
    function recordCard(record) {
        const details = Object.entries(record.details).filter(([, value]) => value).map(([key, value]) => `<div><dt>${GIMMED.escape(key)}</dt><dd>${GIMMED.escape(value)}</dd></div>`).join("");
        return `<article class="panel record-card"><header><div><span class="badge">${GIMMED.escape(record.record_type)}</span><h3>${GIMMED.escape(record.title)}</h3><p>${GIMMED.escape(record.summary)}</p></div><time><small>GUARDADO</small><strong>${GIMMED.formatDate(record.created_at)}</strong><small>Por ${GIMMED.escape(record.author)}</small></time></header><dl>${details}</dl></article>`;
    }

    /** Consulta y prepara datos de la interfaz de médico. */
    async function loadHistory(patientId, date = "") {
        try {
            currentPatientId = patientId;
            const data = await GIMMED.fetchJSON(`/api/expedientes/${patientId}${date ? `?fecha=${date}` : ""}`);
            results.hidden = true; history.hidden = false;
            document.getElementById("patient-hero").innerHTML = `<i>${GIMMED.initials(data.patient.full_name)}</i><div><small>EXPEDIENTE CLÍNICO · ${GIMMED.escape(data.patient.file_number)}</small><strong>${GIMMED.escape(data.patient.full_name)}</strong><p>${GIMMED.escape(data.patient.identification)} · ${data.patient.age} años · Sangre ${GIMMED.escape(data.patient.blood_type)} · Alergia: ${GIMMED.escape(data.patient.allergy)}</p></div>`;
            document.getElementById("record-count").textContent = `${data.records.length} registros`;
            historyList.innerHTML = data.records.map(recordCard).join("") || `<section class="empty-panel panel"><h2>Sin registros en esta fecha</h2></section>`;
            document.getElementById("date-buttons").innerHTML = `<button class="${date ? "" : "active"}" data-date="">Todas</button>${data.dates.map(item => `<button class="${date === item ? "active" : ""}" data-date="${item}">${item}</button>`).join("")}`;
            document.querySelectorAll("#date-buttons button").forEach(button => button.addEventListener("click", () => { dateInput.value = button.dataset.date; loadHistory(patientId, button.dataset.date); }));
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) { GIMMED.toast(error.message, "error"); }
    }

    form.addEventListener("submit", search);
    dateInput.addEventListener("change", () => loadHistory(currentPatientId, dateInput.value));
    document.getElementById("back-to-results").addEventListener("click", () => { history.hidden = true; results.hidden = false; });
    const id = new URLSearchParams(location.search).get("patient");
    if (id) loadHistory(Number(id));
});
