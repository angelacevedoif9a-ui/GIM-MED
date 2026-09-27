/* Código de la interfaz de médico. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("surgery-form");
    GIMMED.bindPatientSearch(document.querySelector('[data-gimmed-view="cirugias"] [data-patient-search]'), patient => GIMMED.activateForm(form, patient, "cirugia"));
    form.addEventListener("submit", event => { event.preventDefault(); GIMMED.postForm(form, "/api/cirugias"); });
});
