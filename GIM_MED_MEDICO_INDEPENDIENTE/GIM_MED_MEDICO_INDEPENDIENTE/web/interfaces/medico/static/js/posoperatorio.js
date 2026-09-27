/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("postop-form");
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="posoperatorio"] [data-patient-search]'), patient => GIMMED.activateForm(form, patient, "posoperatorio"));
    form.addEventListener("submit", event => { event.preventDefault(); GIMMED.postForm(form, "/api/posoperatorio"); });
});
