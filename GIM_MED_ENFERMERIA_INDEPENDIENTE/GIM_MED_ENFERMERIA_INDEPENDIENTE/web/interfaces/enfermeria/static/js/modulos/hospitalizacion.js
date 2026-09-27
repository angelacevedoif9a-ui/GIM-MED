/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
let hospitalPatient = null;
let hospitalBeds = [];

const hospitalForm = $("#hospitalForm");
const hospitalPatientField = $("#hospitalForm .patient-field");
const hospitalBedSelect = $("#hospitalBedSelect");

hospitalPatientField.addEventListener("patient:selected", (event) => {
  hospitalPatient = event.detail;
  renderHospitalBeds();
  const assigned = hospitalBeds.find(
    (bed) => bed.expediente === hospitalPatient?.expediente,
  );
  if (assigned) hospitalBedSelect.value = assigned.codigo;
});

const hospitalFields = {
  visita:
    '<div class="grid two"><label>Nombre del visitante *<input name="visitante" required></label><label>Identificación *<input name="identificacion_visitante" required></label><label>Parentesco o relación *<input name="parentesco" required></label><label>Observaciones<textarea name="observaciones_visita"></textarea></label></div>',
  traslado:
    '<div class="grid two"><label>Área de origen *<input name="origen" required></label><label>Área de destino *<input name="destino" required></label><label>Motivo del traslado *<textarea name="motivo_traslado" required></textarea></label><label>Estado durante el traslado *<select name="estado_traslado" required><option value="">Seleccione</option><option>Estable</option><option>En observación</option><option>Delicado</option><option>Crítico</option></select></label></div>',
  alta: '<label>Prioridad *<select name="prioridad" required><option value="">Seleccione</option><option>Normal</option><option>Prioritaria</option><option>Urgente</option></select></label><label>Motivo y resumen clínico para el médico *<textarea name="motivo_alta" required></textarea></label><label class="authorization-check"><input type="checkbox" name="alta_autorizada" value="Sí" required><span>Confirmo que el alta fue autorizada por el médico responsable. Al guardar, la cama quedará disponible.</span></label>',
};
const hospitalTitles = {
  visita: "Registrar visita",
  traslado: "Registrar traslado",
  alta: "Solicitar alta médica",
};

/** Coordina la operación escapeHospital de la interfaz de enfermería. */
function escapeHospital(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}

/** Consulta y prepara datos de la interfaz de enfermería. */
async function loadHospitalBeds() {
  try {
    hospitalBeds = await api("/api/camas");
    renderHospitalBeds();
  } catch (error) {
    toast(error.message);
  }
}

/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderHospitalBeds() {
  const available = hospitalBeds.filter(
    (bed) => bed.estado === "Disponible",
  ).length;
  $("#bedSummary").innerHTML =
    `<b>${available} cama${available === 1 ? "" : "s"} disponible${available === 1 ? "" : "s"}</b><span>${hospitalBeds.length - available} ocupada${hospitalBeds.length - available === 1 ? "" : "s"}</span>`;
  hospitalBedSelect.innerHTML =
    '<option value="">Seleccione una cama disponible</option>' +
    hospitalBeds
      .map((bed) => {
        const ownBed = bed.expediente === hospitalPatient?.expediente;
        const disabled = bed.estado === "Ocupada" && !ownBed ? " disabled" : "";
        const occupant = bed.paciente_nombre
          ? ` — ${escapeHospital(bed.paciente_nombre)}`
          : "";
        return `<option value="${bed.codigo}"${disabled}>${escapeHospital(bed.etiqueta)} — ${bed.estado}${occupant}</option>`;
      })
      .join("");
  $("#hospitalBedGrid").innerHTML = hospitalBeds
    .map(
      (bed) =>
        `<button type="button" class="bed-status ${bed.estado.toLowerCase()}" data-bed-code="${bed.codigo}"><span>▤</span><b>${escapeHospital(bed.etiqueta)}</b><small>${escapeHospital(bed.area)}</small>${bed.paciente_nombre ? `<strong>${escapeHospital(bed.paciente_nombre)}</strong><small>${escapeHospital(bed.expediente)}</small>` : ""}<em>${bed.estado}</em></button>`,
    )
    .join("");
  $$("[data-bed-code]").forEach((button) =>
    button.addEventListener("click", async () => {
      const bed = hospitalBeds.find(
        (item) => item.codigo === button.dataset.bedCode,
      );
      if (!bed) return;
      hospitalBedSelect.value = bed.estado === "Disponible" ? bed.codigo : "";
      if (!bed.expediente) {
        toast(`${bed.etiqueta} está disponible para asignación.`);
        return;
      }
      try {
        const patient = await api(`/api/pacientes/${bed.expediente}`);
        hospitalPatientField.selectPatient(patient);
        hospitalBedSelect.value = bed.codigo;
        toast(`${patient.nombre} ocupa ${bed.etiqueta}.`);
      } catch (error) {
        toast(error.message);
      }
    }),
  );
}

hospitalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hospitalPatient) {
    toast("Selecciona un paciente registrado antes de ocupar una cama.");
    return;
  }
  try {
    const result = await api("/api/registros", {
      method: "POST",
      body: JSON.stringify(formPayload(event.currentTarget)),
    });
    toast(
      `${result.message} ${result.registro.cama} quedó ocupada por ${result.registro.nombre_paciente}.`,
    );
    event.currentTarget.reset();
    clinicalFormDirty = false;
    renderSystemStamps();
    await loadHospitalBeds();
    refreshCurrentView();
  } catch (error) {
    toast(error.message);
  }
});

/** Controla la visualización o navegación de la interfaz de enfermería. */
function closeHospitalModal() {
  $("#hospitalModal").hidden = true;
  $("#hospitalActionForm").reset();
}

$$("[data-hospital-action]").forEach((button) =>
  button.addEventListener("click", () => {
    const action = button.dataset.hospitalAction;
    if (action === "medicamento") {
      $('[data-view="medicamentos"]').click();
      return;
    }
    const assignedBed = hospitalBeds.find(
      (bed) => bed.expediente === hospitalPatient?.expediente,
    );
    if (!hospitalPatient || !assignedBed) {
      toast(
        "Selecciona una cama ocupada para cargar al paciente hospitalizado.",
      );
      return;
    }
    $("#hospitalModalTitle").textContent = hospitalTitles[action];
    $("#hospitalActionModule").value = action;
    $("#hospitalPatientId").value = hospitalPatient.expediente;
    $("#hospitalModalPatient").innerHTML =
      `<b>${escapeHospital(hospitalPatient.nombre)}</b><span>${escapeHospital(hospitalPatient.expediente)} · ${escapeHospital(assignedBed.etiqueta)}</span>`;
    $("#hospitalActionFields").innerHTML = hospitalFields[action];
    $("#hospitalModal").hidden = false;
    renderSystemStamps();
    renderChrome();
  }),
);

$("#closeHospitalModal").addEventListener("click", closeHospitalModal);
$("#cancelHospitalModal").addEventListener("click", closeHospitalModal);
$("#hospitalModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeHospitalModal();
});
$("#hospitalActionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = await api("/api/registros", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const release =
      data.modulo === "alta"
        ? ` ${result.registro.cama_liberada} quedó disponible.`
        : "";
    toast(`${hospitalTitles[data.modulo]} guardado correctamente.${release}`);
    closeHospitalModal();
    if (data.modulo === "alta") hospitalForm.reset();
    await loadHospitalBeds();
    clinicalFormDirty = false;
    refreshCurrentView();
  } catch (error) {
    toast(error.message);
  }
});

loadHospitalBeds();
