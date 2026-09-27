/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
// Módulo Procedimientos: guarda la atención realizada en el expediente seleccionado.
const procedureForm = $("#procedureForm");

procedureForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSimpleClinicalForm(event.currentTarget);
});
