/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("exam-request-form");
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="solicitar-examen"] [data-patient-search]'), patient => { GIMMED.activateForm(form, patient, "solicitud-examen"); document.getElementById("request-patient").textContent = patient?.full_name || ""; });
    form.addEventListener("submit", event => { event.preventDefault(); GIMMED.postForm(form, "/api/examenes/solicitar"); });
});
