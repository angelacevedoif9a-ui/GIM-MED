/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
let selectedMedications = [];
let medicationPatient = null;
const routeOptions = [
  "Oral",
  "Intravenosa",
  "Intramuscular",
  "Subcutánea",
  "Inhalatoria",
  "Tópica",
  "Rectal",
  "Oftálmica",
];
/** Convierte caracteres especiales antes de insertar texto en HTML. */
function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
}
/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderSelectedMedications() {
  $("#selectedMedicineCount").textContent =
    `${selectedMedications.length} agregado${selectedMedications.length === 1 ? "" : "s"}`;
  $("#selectedMedicines").innerHTML = selectedMedications.length
    ? selectedMedications
        .map(
          (item, index) =>
            `<article class="medication-card"><div><b>${escapeHtml(item.nombre)}</b><span>${escapeHtml(item.codigo)} · ${escapeHtml(item.presentacion)}</span></div><button type="button" data-remove-medicine="${item.id}">×</button><input name="medicine_id_${index}" type="hidden" value="${item.id}"><div class="grid three"><label>Dosis indicada *<input name="medicine_dose_${index}" pattern="[0-9]+([.,][0-9]+)? ?(mg|g|ml|mL|UI|mcg)" placeholder="500 mg" required></label><label>Vía de administración *<select name="medicine_route_${index}" required>${routeOptions.map((route) => `<option ${route === item.via ? "selected" : ""}>${route}</option>`).join("")}</select></label><label>Frecuencia *<input name="medicine_frequency_${index}" placeholder="Cada 8 horas" required></label></div></article>`,
        )
        .join("")
    : '<div class="record-result empty">Selecciona uno o varios medicamentos desde el panel.</div>';
  $$("[data-remove-medicine]").forEach((button) =>
    button.addEventListener("click", () => {
      selectedMedications = selectedMedications.filter(
        (item) => item.id !== Number(button.dataset.removeMedicine),
      );
      renderSelectedMedications();
      loadMedications($("#medicineSearch").value);
    }),
  );
}
/** Consulta y prepara datos de la interfaz de enfermería. */
async function loadMedications(query = "") {
  try {
    const items = await api(`/api/medicamentos?q=${encodeURIComponent(query)}`);
    $("#medicineCount").textContent =
      `${items.length} medicamento${items.length === 1 ? "" : "s"} encontrado${items.length === 1 ? "" : "s"}`;
    $("#medicineResults").innerHTML =
      items
        .map(
          (item) =>
            `<button type="button" class="medicine-item ${selectedMedications.some((selected) => selected.id === item.id) ? "selected" : ""}" data-medicine-id="${item.id}"><b>${escapeHtml(item.nombre)}</b><span>${escapeHtml(item.codigo)} · ${escapeHtml(item.presentacion)} · Vía ${escapeHtml(item.via)}</span><em>${item.stock} disponibles</em></button>`,
        )
        .join("") ||
      '<div class="record-result empty">No se encontraron medicamentos.</div>';
    $$("[data-medicine-id]").forEach((button) =>
      button.addEventListener("click", () => {
        const item = items.find(
          (medicine) => medicine.id === Number(button.dataset.medicineId),
        );
        if (selectedMedications.some((selected) => selected.id === item.id)) {
          toast("Este medicamento ya está agregado.");
          return;
        }
        selectedMedications.push(item);
        renderSelectedMedications();
        loadMedications($("#medicineSearch").value);
      }),
    );
  } catch (error) {
    toast(error.message);
  }
}
$("#medicationForm .patient-field").addEventListener(
  "patient:selected",
  (event) => {
    medicationPatient = event.detail;
    const allergy = $("#patientAllergy");
    $("b", allergy).textContent = medicationPatient
      ? `Alergias de ${medicationPatient.nombre}`
      : "Alergias del paciente";
    $("span", allergy).textContent = medicationPatient
      ? medicationPatient.alergias
      : "Selecciona al paciente para consultar sus alergias registradas.";
  },
);
$("#medicationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!medicationPatient) {
    toast("Selecciona un paciente registrado.");
    return;
  }
  if (!selectedMedications.length) {
    toast("Agrega al menos un medicamento.");
    return;
  }
  const form = event.currentTarget;
  const values = new FormData(form);
  const medications = selectedMedications.map((item, index) => ({
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    presentacion: item.presentacion,
    dosis: values.get(`medicine_dose_${index}`),
    via: values.get(`medicine_route_${index}`),
    frecuencia: values.get(`medicine_frequency_${index}`),
  }));
  const data = Object.fromEntries(values);
  data.modulo = "medicamentos";
  data.medicamentos = medications;
  try {
    const result = await api("/api/registros", {
      method: "POST",
      body: JSON.stringify(data),
    });
    toast(
      `${medications.length} medicamento${medications.length === 1 ? "" : "s"} registrado${medications.length === 1 ? "" : "s"}. ${result.registro.fecha_sistema} · ${result.registro.hora_sistema}`,
    );
    clinicalFormDirty = false;
    form.reset();
    selectedMedications = [];
    renderSelectedMedications();
    refreshCurrentView();
  } catch (error) {
    toast(error.message);
  }
});
$("#medicationForm").addEventListener("reset", () =>
  setTimeout(() => {
    selectedMedications = [];
    medicationPatient = null;
    renderSelectedMedications();
  }, 0),
);
let medicineTimer;
$("#medicineSearch").addEventListener("input", (event) => {
  clearTimeout(medicineTimer);
  medicineTimer = setTimeout(() => loadMedications(event.target.value), 180);
});
document.addEventListener("DOMContentLoaded", () => {
  loadMedications();
  renderSelectedMedications();
});
