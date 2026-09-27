/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("seguimiento-form");
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="seguimiento"] [data-patient-search]'), patient => GIMMED.activateForm(form, patient, "seguimiento"));
    form.addEventListener("submit", event => { event.preventDefault(); GIMMED.postForm(form, "/api/seguimiento"); });
});
