/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const results = document.getElementById("exam-results");
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="resultados-examen"] [data-patient-search]'), async patient => {
        if (!patient) { results.hidden = true; return; }
        try {
            const data = await GIMMED.fetchJSON(`/api/examenes/${patient.id}`);
            results.hidden = false;
            results.innerHTML = `<header class="results-header"><div><h2>${GIMMED.escape(patient.full_name)}</h2><p>${GIMMED.escape(patient.file_number)} · Solicitudes y resultados</p></div><strong>${data.exams.length} registros</strong></header>` + (data.exams.map(exam => `<article class="panel exam-card"><header><div><small>${GIMMED.escape(exam.record_type)}</small><h3>${GIMMED.escape(exam.title)}</h3><p>${GIMMED.escape(exam.summary)}</p></div><time>${GIMMED.formatDate(exam.created_at)}<br>Por ${GIMMED.escape(exam.author)}</time></header><dl>${Object.entries(exam.details).map(([key, value]) => `<div><dt>${GIMMED.escape(key)}</dt><dd>${GIMMED.escape(value)}</dd></div>`).join("")}</dl></article>`).join("") || '<section class="panel exam-card"><h3>Sin exámenes registrados</h3></section>');
        } catch (error) { GIMMED.toast(error.message, "error"); }
    });
});
