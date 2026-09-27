/* Código de la interfaz de administrador, tarea especialidades. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  GIMMEDCrud.init({
    active: "especialidades", collection: "specialties", title: "Especialidades médicas",
    description: "Configure servicios, responsables, consultorios y horarios de atención.", singular: "especialidad", unique: ["name"],
    fields: [
      { key: "name", label: "Nombre de la especialidad" }, { key: "doctor", label: "Médico responsable" },
      { key: "office", label: "Consultorio" }, { key: "schedule", label: "Horario de atención" },
      { key: "duration", label: "Duración por consulta (minutos)", type: "number" },
      { key: "status", label: "Estado", type: "select", options: ["Activa", "Inactiva"] }
    ],
    columns: [
      { key: "name", label: "Especialidad" }, { key: "doctor", label: "Responsable" },
      { key: "office", label: "Consultorio" }, { key: "schedule", label: "Horario" }, { key: "status", label: "Estado" }
    ]
  });
});
