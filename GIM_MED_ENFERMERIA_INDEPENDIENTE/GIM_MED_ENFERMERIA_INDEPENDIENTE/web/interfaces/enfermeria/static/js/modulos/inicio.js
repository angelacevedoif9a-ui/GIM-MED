/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
// Módulo Inicio: actualiza los indicadores visibles del panel principal.
/** Consulta y prepara datos de la interfaz de enfermería. */
async function loadDashboardSummary() {
  try {
    const summary = await api("/api/resumen");
    $("#dashboardPatients").textContent = summary.pacientes;
    $("#dashboardVitals").textContent = summary.signos_hoy;
    $("#dashboardHospitalized").textContent = summary.hospitalizados;
    $("#dashboardBeds").textContent = summary.camas_disponibles;
  } catch (_error) {
    // El panel conserva sus valores iniciales si el resumen no está disponible.
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardSummary);
