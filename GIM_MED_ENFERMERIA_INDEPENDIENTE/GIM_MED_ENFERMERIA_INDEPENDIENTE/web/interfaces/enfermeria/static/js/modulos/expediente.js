/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
/* eslint-disable @next/next/no-assign-module-variable */
function recordEscape(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}
/** Coordina la operación detail de la interfaz de enfermería. */
function detail(label, value) {
  return `<p><span>${recordEscape(label)}</span><b>${recordEscape(value || "No registrado")}</b></p>`;
}
/** Coordina la operación info de la interfaz de enfermería. */
function info(title, value) {
  return `<div class="info-box"><b>${recordEscape(title)}</b><span>${recordEscape(value || "No registrado")}</span></div>`;
}

const recordModuleLabels = {
  signos: "Signos vitales",
  medicamentos: "Administración de medicamentos",
  procedimientos: "Procedimiento de enfermería",
  hospitalizacion: "Ingreso hospitalario",
  visita: "Visita hospitalaria",
  traslado: "Traslado hospitalario",
  alta: "Alta médica y liberación de cama",
  seguimiento: "Seguimiento de enfermería",
};
const recordFieldLabels = {
  prescripcion: "Prescripción",
  medicamentos: "Medicamentos administrados",
  codigo: "Código del procedimiento",
  procedimiento: "Procedimiento",
  estado: "Estado del paciente",
  resultado: "Resultado",
  observaciones: "Observaciones",
  incidencias: "Incidencias",
  cama: "Cama asignada",
  cama_liberada: "Cama liberada",
  visitante: "Visitante",
  identificacion_visitante: "Identificación del visitante",
  parentesco: "Parentesco",
  observaciones_visita: "Observaciones de la visita",
  origen: "Origen",
  destino: "Destino",
  motivo_traslado: "Motivo del traslado",
  estado_traslado: "Estado durante el traslado",
  prioridad: "Prioridad",
  motivo_alta: "Motivo del alta",
  alta_autorizada: "Alta autorizada",
  mejoria: "Evolución",
  cumplimiento: "Cumplimiento del tratamiento",
  cita_control: "Próxima cita de control",
};
const hiddenRecordFields = new Set([
  "expediente",
  "nombre_paciente",
  "fecha_sistema",
  "hora_sistema",
  "enfermera_responsable",
  "modulo",
  "accion_hospitalaria",
  "cama_codigo",
]);

/** Convierte datos al formato que necesita la interfaz de enfermería. */
function formatRecordValue(value) {
  if (Array.isArray(value))
    return value
      .map((item) => {
        if (typeof item !== "object" || !item) return recordEscape(item);
        const name = item.nombre || item.codigo || item.id || "Medicamento";
        return `<span class="medicine-history-item"><b>${recordEscape(name)}</b><small>${recordEscape(item.dosis || "")} · Vía ${recordEscape(item.via || "No registrada")} · ${recordEscape(item.frecuencia || "Frecuencia no registrada")}</small></span>`;
      })
      .join("");
  if (typeof value === "object" && value)
    return recordEscape(Object.values(value).filter(Boolean).join(" · "));
  return recordEscape(value);
}

/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderVitalHistory(records) {
  if (!records.length)
    return '<article class="panel"><h2>Historial de signos vitales</h2><div class="record-empty">No existen controles de signos vitales almacenados.</div></article>';
  const latest = records[0];
  const previousRecords = records
    .slice(1)
    .map(
      (item) =>
        `<article class="vital-history-card"><div class="vital-history-card-heading"><div><b>${recordEscape(item.fecha)}</b><span>${recordEscape(item.hora)} · ${recordEscape(item.enfermera)}</span></div><em>Control anterior</em></div><div class="vital-history-card-grid">${detail("Temperatura", `${item.temperatura} °C`)}${detail("Presión arterial", `${item.presion_sistolica}/${item.presion_diastolica} mmHg`)}${detail("Frecuencia cardíaca", `${item.frecuencia_cardiaca} lpm`)}${detail("Frecuencia respiratoria", `${item.frecuencia_respiratoria} rpm`)}${detail("Saturación O₂", `${item.saturacion}%`)}${detail("Dolor", `${item.dolor}/10`)}${detail("Glucosa", `${item.glucosa} mg/dL`)}${detail("Peso", `${item.peso} kg`)}${detail("Talla", `${item.talla} cm`)}${detail("IMC", `${item.imc} kg/m²`)}${detail("Oxígeno suplementario", item.oxigeno)}${detail("Enfermera responsable", item.enfermera)}</div><p><b>Observaciones:</b> ${recordEscape(item.observaciones || "Sin observaciones")}</p></article>`,
    )
    .join("");
  return `<article class="panel vital-history-section"><div class="record-section-heading"><div><small>CONTROL DE ENFERMERÍA</small><h2>Historial completo de signos vitales</h2></div><em>${records.length} controles registrados</em></div><div class="latest-vitals"><div><b>Último control registrado</b><span>${recordEscape(latest.fecha)} · ${recordEscape(latest.hora)} · ${recordEscape(latest.enfermera)}</span></div><div class="latest-vitals-grid">${detail("Temperatura", `${latest.temperatura} °C`)}${detail("Presión arterial", `${latest.presion_sistolica}/${latest.presion_diastolica} mmHg`)}${detail("Frecuencia cardíaca", `${latest.frecuencia_cardiaca} lpm`)}${detail("Frecuencia respiratoria", `${latest.frecuencia_respiratoria} rpm`)}${detail("Saturación O₂", `${latest.saturacion}%`)}${detail("Dolor", `${latest.dolor}/10`)}${detail("Glucosa", `${latest.glucosa} mg/dL`)}${detail("IMC", `${latest.imc} kg/m²`)}</div><p><b>Observaciones:</b> ${recordEscape(latest.observaciones || "Sin observaciones")}</p></div><h3 class="vitals-history-title">Controles anteriores</h3><div class="vitals-history-list">${previousRecords || '<div class="record-empty">Este paciente todavía no tiene controles anteriores.</div>'}</div></article>`;
}

/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderDetailedRecords(records) {
  const nonVitalRecords = records.filter(
    (record) => record.modulo !== "signos",
  );
  const items = nonVitalRecords
    .map((record, index) => {
      const module = record.accion_hospitalaria || record.modulo;
      const fields = Object.entries(record)
        .filter(
          ([key, value]) =>
            !hiddenRecordFields.has(key) &&
            !key.startsWith("medicine_") &&
            value !== "" &&
            value !== undefined,
        )
        .map(
          ([key, value]) =>
            `<p><span>${recordEscape(recordFieldLabels[key] || key.replaceAll("_", " "))}</span><b>${formatRecordValue(value)}</b></p>`,
        )
        .join("");
      return `<details class="clinical-update" ${index === 0 ? "open" : ""}><summary><span><b>${recordEscape(recordModuleLabels[module] || "Atención de enfermería")}</b><small>${recordEscape(record.fecha_sistema)} · ${recordEscape(record.hora_sistema)} · ${recordEscape(record.enfermera_responsable)}</small></span><em>${index === 0 ? "Última modificación" : "Ver detalles"}</em></summary><div class="clinical-update-data">${fields || "<p><span>Detalle</span><b>Sin información adicional.</b></p>"}</div></details>`;
    })
    .join("");
  return `<article class="panel"><div class="record-section-heading"><div><small>ACTUALIZACIONES DEL EXPEDIENTE</small><h2>Registros detallados de enfermería</h2></div><em>${nonVitalRecords.length} actualizaciones</em></div>${items ? `<div class="clinical-update-list">${items}</div>` : '<div class="record-empty">Todavía no existen medicamentos, procedimientos, hospitalización o seguimientos almacenados por enfermería.</div>'}</article>`;
}

/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderCompleteRecord(patient) {
  const history = (patient.historial || [])
    .map(
      (item) =>
        `<div class="history-row"><b>${recordEscape(item.tipo)}</b><span>${recordEscape(item.fecha)}</span><span>${recordEscape(item.diagnostico)}</span><span>${recordEscape(item.observaciones)}</span><span>${recordEscape(item.profesional)}</span></div>`,
    )
    .join("");
  $("#completeRecord").innerHTML =
    `<div class="complete-record"><article class="panel"><div class="record-header"><div class="record-avatar">${patient.nombre
      .split(" ")
      .slice(0, 2)
      .map((part) => recordEscape(part[0]))
      .join(
        "",
      )}</div><div><h2>${recordEscape(patient.nombre)}</h2><span>${recordEscape(patient.expediente)}</span></div><em>Expediente activo · Solo lectura</em></div><div class="record-details">${detail("Identificación", patient.identificacion)}${detail("Fecha de nacimiento", patient.fecha_nacimiento)}${detail("Edad", `${patient.edad} años`)}${detail("Sexo", patient.sexo)}${detail("Tipo de sangre", patient.sangre)}${detail("Teléfono", patient.telefono)}${detail("Dirección", patient.direccion)}${detail("Contacto de emergencia", patient.contacto_emergencia)}${detail("Cobertura", patient.seguro)}</div></article><div class="record-columns"><article class="panel"><h2>Resumen médico</h2>${info("Antecedentes", patient.antecedentes)}${info("Diagnóstico actual", patient.diagnostico)}<div class="warning"><b>Alergias registradas</b><span>${recordEscape(patient.alergias)}</span></div></article><article class="panel"><h2>Control clínico actual</h2>${info("Últimos signos vitales", patient.ultimos_signos)}${info("Hospitalización", patient.hospitalizacion)}${info("Medicamentos activos", (patient.medicamentos_activos || []).join(" · "))}</article></div>${renderVitalHistory(patient.signos_historial || [])}${renderDetailedRecords(patient.registros_detallados || [])}<article class="panel"><h2>Consultas y antecedentes médicos</h2><div class="history-table"><div class="history-row heading"><b>Tipo</b><b>Fecha</b><b>Diagnóstico</b><b>Observaciones</b><b>Profesional</b></div>${history}</div></article></div>`;
}

$("#recordSearchButton").addEventListener("click", async () => {
  const query = $("#recordSearch").value.trim();
  if (!query) {
    toast("Ingresa un expediente, identificación o nombre.");
    return;
  }
  try {
    const patients = await api(`/api/pacientes?q=${encodeURIComponent(query)}`);
    if (!patients.length) {
      $("#completeRecord").innerHTML =
        '<div class="record-not-found"><b>El paciente no ha sido encontrado</b><span>Verifica los datos o confirma que el paciente esté registrado.</span></div>';
      return;
    }
    renderCompleteRecord(patients[0]);
  } catch (error) {
    toast(error.message);
  }
});
