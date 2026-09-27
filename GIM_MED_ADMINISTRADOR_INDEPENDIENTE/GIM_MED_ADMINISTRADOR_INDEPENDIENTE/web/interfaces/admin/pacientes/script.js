/* Código de la interfaz de administrador, tarea pacientes. Se carga desde el panel integrado según el rol. */
(function () {
  "use strict";
  let selectedId = null;
  /** Busca el primer elemento del documento que coincide con el selector. */
  const $ = selector => document.querySelector(selector);
  /** Convierte caracteres especiales antes de insertar texto en HTML. */
  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  /** Coordina la operación dateText de la interfaz de administrador, tarea pacientes. */
  const dateText = value => value ? new Intl.DateTimeFormat("es-NI", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`)) : "Sin registrar";
  /** Forma las iniciales que se muestran en el perfil. */
  const initials = name => name.split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
  /** Coordina la operación age de la interfaz de administrador, tarea pacientes. */
  const age = birthDate => { const birth = new Date(`${birthDate}T12:00:00`); const now = new Date(); let years = now.getFullYear() - birth.getFullYear(); if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--; return years; };

  /** Actualiza la pantalla de la interfaz de administrador, tarea pacientes con los datos disponibles. */
  function renderList() {
    const term = $("#patient-search").value.trim().toLowerCase();
    const patients = GIMMED.getData().patients.filter(patient => JSON.stringify(patient).toLowerCase().includes(term));
    $("#patient-list").innerHTML = patients.length ? patients.map(patient => `<button type="button" class="patient-item ${patient.id === selectedId ? "active" : ""}" data-id="${patient.id}"><strong>${escapeHTML(patient.name)}</strong><small>${escapeHTML(patient.code)} · ${escapeHTML(patient.phone)}</small></button>`).join("") : '<p class="empty">No hay pacientes coincidentes.</p>';
    document.querySelectorAll(".patient-item").forEach(button => button.addEventListener("click", () => selectPatient(Number(button.dataset.id))));
  }

  /** Coordina la operación selectPatient de la interfaz de administrador, tarea pacientes. */
  function selectPatient(id) {
    selectedId = id;
    const data = GIMMED.getData();
    const patient = data.patients.find(item => item.id === id);
    if (!patient) return;
    $("#empty-patient").hidden = true; $("#patient-view").hidden = false;
    $("#patient-initials").textContent = initials(patient.name); $("#patient-code").textContent = patient.code;
    $("#patient-name").textContent = patient.name;
    $("#patient-demographics").textContent = `${patient.gender || "Sin género"} · ${patient.birthDate ? `${age(patient.birthDate)} años` : "Edad sin registrar"} · ${patient.phone || "Sin teléfono"}`;
    $("#summary-allergies").textContent = patient.allergies || "Niega alergias conocidas";
    $("#summary-blood").textContent = patient.blood || "Desconocido";
    $("#summary-chronic").textContent = patient.chronic || "Sin antecedentes";
    $("#summary-medications").textContent = patient.medications || "Sin medicación";
    const details = [
      ["Fecha de nacimiento", dateText(patient.birthDate)], ["Cédula / RUT", patient.idNumber], ["Pasaporte", patient.passport],
      ["Correo", patient.email], ["Dirección", patient.address], ["Nacionalidad", patient.nationality],
      ["Estado civil", patient.maritalStatus], ["Ocupación", patient.occupation], ["Contacto de emergencia", `${patient.emergencyContact || "Sin registrar"} · ${patient.emergencyRelation || ""} · ${patient.emergencyPhone || ""}`],
      ["Seguro / póliza", `${patient.insurance || "N/A"} · ${patient.policy || "N/A"}`], ["Antecedentes personales", patient.history],
      ["Antecedentes familiares", patient.familyHistory], ["Cirugías / hospitalizaciones", patient.surgeries], ["Vacunas", patient.vaccines],
      ["Hábitos", patient.habits], ["Discapacidad / apoyo", patient.disability], ["Observaciones", patient.observations], ["Estado", patient.status]
    ];
    $("#patient-details").innerHTML = details.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value || "Sin registrar")}</dd></div>`).join("");
    renderDiagnoses(data.diagnoses.filter(item => item.patientId === id)); renderList();
  }

  /** Actualiza la pantalla de la interfaz de administrador, tarea pacientes con los datos disponibles. */
  function renderDiagnoses(rows) {
    rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    $("#diagnosis-history").innerHTML = rows.length ? rows.map(row => `<article class="timeline-item"><div class="timeline-head"><div><span class="record-code">${escapeHTML(row.code || "SIN CIE-10")}</span><h3>${escapeHTML(row.diagnosis)}</h3><p class="timeline-meta">${escapeHTML(dateText(row.date))} · ${escapeHTML(row.time || "Sin hora")} · ${escapeHTML(row.doctor)} · ${escapeHTML(row.specialty || "Medicina general")}</p></div><div><span class="status-badge">${escapeHTML(row.type || "Registro clínico")}</span> <span class="status-badge">${escapeHTML(row.diagnosisStatus || "Activo")}</span></div></div><div class="diagnosis-grid"><p><strong>Motivo y evolución:</strong><br>${escapeHTML(row.reason)}. ${escapeHTML(row.evolution || "")}</p><p><strong>Síntomas:</strong><br>${escapeHTML(row.symptoms || "Sin registrar")}</p><p><strong>Signos vitales:</strong><br>PA ${escapeHTML(row.bloodPressure || "N/R")} · Temp. ${escapeHTML(row.temperature || "N/R")} · FC ${escapeHTML(row.heartRate || "N/R")} · FR ${escapeHTML(row.respiratoryRate || "N/R")} · SpO₂ ${escapeHTML(row.oxygen || "N/R")} · ${escapeHTML(row.weight || "N/R")} · ${escapeHTML(row.height || "N/R")}</p><p><strong>Examen físico:</strong><br>${escapeHTML(row.physicalExam || "Sin registrar")}</p><p><strong>Tratamiento e indicaciones:</strong><br>${escapeHTML(row.treatment)}. ${escapeHTML(row.instructions || "")}</p><p><strong>Estudios y seguimiento:</strong><br>${escapeHTML(row.studies || "Ninguno")}. Referencia: ${escapeHTML(row.referral || "No aplica")}. Próxima cita: ${escapeHTML(dateText(row.followUp))}.</p><p><strong>Notas clínicas:</strong><br>${escapeHTML(row.notes || "Sin notas")}</p></div></article>`).join("") : '<div class="empty-state"><h3>Sin diagnósticos previos</h3><p>Use “Nuevo diagnóstico” para registrar la primera nota médica.</p></div>';
  }

  /** Controla la visualización o navegación de la interfaz de administrador, tarea pacientes. */
  function openPatient(patient) {
    const form = $("#patient-form"); form.reset(); form.dataset.id = patient?.id || "";
    if (patient) Object.entries(patient).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value ?? ""; });
    $("#patient-form-title").textContent = patient ? "Editar paciente" : "Nuevo paciente"; $("#patient-error").textContent = ""; $("#patient-dialog").showModal();
  }

  /** Guarda los cambios de la interfaz de administrador, tarea pacientes. */
  async function savePatient(event) {
    event.preventDefault(); const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const patient = GIMMED.formObject(form); patient.id = Number(form.dataset.id || Date.now());
    const previous=GIMMED.getData().patients.find(item=>item.id===patient.id);if(previous)Object.assign(patient,{sharedId:previous.sharedId,source:previous.source,fileNumber:previous.fileNumber});
    const data = GIMMED.getData(); const error = GIMMED.unique(data.patients, patient, ["code", "idNumber"]);
    if (error) { $("#patient-error").textContent = error; return; }
    try{const saved=await GIMMED.saveSharedPatient(patient);selectedId=saved.id;$("#patient-dialog").close();renderList();selectPatient(saved.id);GIMMED.toast(`Expediente conectado: ${saved.name}`);}catch(saveError){$("#patient-error").textContent=saveError.message||"No fue posible guardar el expediente.";}
  }

  /** Guarda los cambios de la interfaz de administrador, tarea pacientes. */
  function saveDiagnosis(event) {
    event.preventDefault(); const form = event.currentTarget;
    if (!form.reportValidity() || !selectedId) return;
    const diagnosis = GIMMED.formObject(form); diagnosis.id = Date.now(); diagnosis.patientId = selectedId;
    GIMMED.update(data => data.diagnoses.unshift(diagnosis), `Diagnóstico registrado para paciente ${selectedId}`);
    $("#diagnosis-dialog").close(); selectPatient(selectedId);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    GIMMED.requireAuth(); GIMMED.shell("pacientes"); GIMMED.trackActivity(); renderList();await GIMMED.syncPatients();renderList();
    $("#patient-search").addEventListener("input", renderList);
    $("#new-patient").addEventListener("click", () => openPatient());
    $("#edit-patient").addEventListener("click", () => openPatient(GIMMED.getData().patients.find(item => item.id === selectedId)));
    $("#cancel-patient").addEventListener("click", () => $("#patient-dialog").close());
    $("#patient-form").addEventListener("submit", savePatient);
    $("#new-diagnosis").addEventListener("click", () => { const role = GIMMED.session()?.user?.role; if (!["Administrador", "Médico"].includes(role)) return GIMMED.toast("Solo el administrador o un médico puede registrar diagnósticos.", "error"); const form = $("#diagnosis-form"); form.reset(); form.elements.date.value = GIMMED.today(); form.elements.time.value = new Date().toTimeString().slice(0, 5); form.elements.doctor.value = GIMMED.session().user.name; $("#diagnosis-dialog").showModal(); });
    $("#cancel-diagnosis").addEventListener("click", () => $("#diagnosis-dialog").close());
    $("#diagnosis-form").addEventListener("submit", saveDiagnosis);
    $("#print-record").addEventListener("click", () => GIMMED.printPDF(`Expediente clínico - ${$("#patient-name").textContent}`));
    window.addEventListener("gimmed:patients-synced",renderList);
  });
})();
