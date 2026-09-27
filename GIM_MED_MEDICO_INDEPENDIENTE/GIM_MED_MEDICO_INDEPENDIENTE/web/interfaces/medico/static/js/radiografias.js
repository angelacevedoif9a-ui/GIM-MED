/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("radiography-form");
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="radiografias"] [data-patient-search]'), patient => { GIMMED.activateForm(form, patient, "radiografia"); document.getElementById("radiography-patient").textContent = patient?.full_name || ""; });
    form.addEventListener("submit", event => { event.preventDefault(); GIMMED.postForm(form, "/api/radiografias"); });
});
