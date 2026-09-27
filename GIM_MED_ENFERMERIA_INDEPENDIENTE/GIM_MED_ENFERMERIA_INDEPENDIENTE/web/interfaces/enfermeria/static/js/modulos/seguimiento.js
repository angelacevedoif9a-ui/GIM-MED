/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
// Módulo Seguimiento: registra la evolución clínica y la próxima cita de control.
const followUpForm = $("#followUpForm");

followUpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSimpleClinicalForm(event.currentTarget);
});
