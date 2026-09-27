/* Código de la interfaz de administrador, tarea citas. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  GIMMEDCrud.init({
    active: "citas", collection: "appointments", title: "Citas médicas",
    description: "Programe, confirme y dé seguimiento a la agenda de atención.", singular: "cita", unique: [],
    fields: [
      { key: "date", label: "Fecha", type: "date" }, { key: "time", label: "Hora", type: "time" },
      { key: "patient", label: "Paciente" }, { key: "doctor", label: "Médico" },
      { key: "specialty", label: "Especialidad" }, { key: "reason", label: "Motivo de consulta" },
      { key: "status", label: "Estado", type: "select", options: ["Pendiente", "Confirmada", "Completada", "Cancelada"] }
    ],
    columns: [
      { key: "date", label: "Fecha" }, { key: "time", label: "Hora" }, { key: "patient", label: "Paciente" },
      { key: "doctor", label: "Médico" }, { key: "specialty", label: "Especialidad" }, { key: "status", label: "Estado" }
    ],
    save: (appointment) => GIMMED.saveSharedAppointment(appointment),
    remove: (appointment) => GIMMED.deleteSharedAppointment(appointment),
    sync: () => GIMMED.syncAppointments(),
    syncEvent: "gimmed:appointments-synced",
  });
});
