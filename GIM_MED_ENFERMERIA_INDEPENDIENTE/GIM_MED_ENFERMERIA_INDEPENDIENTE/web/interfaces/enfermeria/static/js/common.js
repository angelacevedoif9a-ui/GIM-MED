/* Código de la interfaz de enfermería. Se carga desde el panel integrado según el rol. */
/** Busca el primer elemento del documento que coincide con el selector. */
const $ = (selector, root = document) => root.querySelector(selector);
/** Busca todos los elementos del documento que coinciden con el selector. */
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let currentProfile = null;
let clinicalRevision = null;
let clinicalFormDirty = false;

/** Muestra un aviso breve en pantalla. */
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => node.classList.remove("show"), 3800);
}
/** Coordina la operación api de la interfaz de enfermería. */
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error || "No fue posible completar la operación.");
  return payload;
}
/** Coordina la operación localStamp de la interfaz de enfermería. */
function localStamp() {
  const now = new Date();
  return {
    date: new Intl.DateTimeFormat("es-NI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(now),
    time: new Intl.DateTimeFormat("es-NI", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(now),
  };
}
/** Actualiza o sincroniza el estado de la interfaz de enfermería. */
function refreshCurrentView(delay = 700) {
  const active = $(".view.active")?.id || "inicio";
  sessionStorage.setItem("gimmed:active-view", active);
  window.setTimeout(() => window.location.reload(), delay);
}
/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderChrome() {
  if (!currentProfile) return;
  $("#profileName").textContent = `Enf. ${currentProfile.nombre}`;
  $("#profileRole").textContent = currentProfile.cargo;
  $("#welcomeName").textContent =
    `Buenos días, ${currentProfile.nombre.trim().split(/\s+/)[0]}`;
  $("#profilePhoto").src = currentProfile.foto;
  $("#photoPreview").src = currentProfile.foto;
  $$(".nurse-card").forEach(
    (node) =>
      (node.innerHTML = `<div class="nurse"><img src="${currentProfile.foto}" alt="Enfermera responsable"><div><b>Enf. ${currentProfile.nombre}</b><small>Enfermera responsable · ${currentProfile.licencia}</small></div></div>`),
  );
}
/** Actualiza la pantalla de la interfaz de enfermería con los datos disponibles. */
function renderSystemStamps() {
  const stamp = localStamp();
  $$(".system-stamp").forEach(
    (node) =>
      (node.innerHTML = `<div class="system-stamp-card"><div><span>Fecha y hora de registro</span><b>${stamp.date} · ${stamp.time}</b></div><small>Se registra automáticamente al guardar</small></div>`),
  );
}
/** Coordina la operación patientFieldTemplate de la interfaz de enfermería. */
function patientFieldTemplate(allowName) {
  return `<div class="patient-search"><label>${allowName ? "Expediente o nombre del paciente" : "Expediente del paciente"} *<input class="patient-query" placeholder="${allowName ? "EXP-2026-001 o nombre del paciente" : "EXP-2026-001"}" autocomplete="off" required></label><input class="patient-id" name="expediente" type="hidden"><div class="patient-results"></div><div class="patient-name"><div><small>Paciente seleccionado</small><b>Selecciona un paciente registrado</b><span></span></div></div></div>`;
}
/** Coordina la operación injectPatientFields de la interfaz de enfermería. */
function injectPatientFields() {
  $$(".patient-field").forEach((container) => {
    container.innerHTML = patientFieldTemplate(
      container.dataset.allowName === "true",
    );
    const query = $(".patient-query", container);
    const hidden = $(".patient-id", container);
    const results = $(".patient-results", container);
    const card = $(".patient-name", container);
    let timer;
    /** Filtra registros según el texto indicado por la persona usuaria. */
    async function search() {
      const value = query.value.trim();
      hidden.value = "";
      container.dataset.patient = "";
      card.classList.remove("found");
      $("b", card).textContent = "Selecciona un paciente registrado";
      $("span", card).textContent = "";
      container.dispatchEvent(
        new CustomEvent("patient:selected", { detail: null, bubbles: true }),
      );
      if (value.length < 2) {
        results.innerHTML = "";
        return;
      }
      try {
        const patients = await api(
          `/api/pacientes?q=${encodeURIComponent(value)}`,
        );
        if (!patients.length) {
          results.innerHTML =
            '<div class="patient-error">El paciente no ha sido encontrado.</div>';
          return;
        }
        results.innerHTML = patients
          .map(
            (patient, index) =>
              `<button type="button" data-patient-index="${index}"><b>${patient.nombre}</b><span>${patient.expediente} · ${patient.identificacion}</span></button>`,
          )
          .join("");
        $$("[data-patient-index]", results).forEach((button) =>
          button.addEventListener("click", () =>
            select(patients[Number(button.dataset.patientIndex)]),
          ),
        );
        const exact = patients.find(
          (patient) =>
            patient.expediente.toLowerCase() === value.toLowerCase() ||
            patient.nombre.toLowerCase() === value.toLowerCase(),
        );
        if (exact) select(exact);
      } catch (error) {
        results.innerHTML = `<div class="patient-error">${error.message}</div>`;
      }
    }
    /** Obtiene un elemento de la interfaz mediante un selector. */
    function select(patient) {
      query.value = `${patient.expediente} — ${patient.nombre}`;
      hidden.value = patient.expediente;
      container.dataset.patient = JSON.stringify(patient);
      results.innerHTML = "";
      card.classList.add("found");
      $("b", card).textContent = patient.nombre;
      $("span", card).textContent = patient.expediente;
      container.dispatchEvent(
        new CustomEvent("patient:selected", { detail: patient, bubbles: true }),
      );
    }
    container.selectPatient = select;
    query.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(search, 180);
    });
    container.closest("form")?.addEventListener("reset", () => {
      setTimeout(() => {
        query.value = "";
        hidden.value = "";
        container.dataset.patient = "";
        results.innerHTML = "";
        card.classList.remove("found");
        $("b", card).textContent = "Selecciona un paciente registrado";
        $("span", card).textContent = "";
        container.dispatchEvent(
          new CustomEvent("patient:selected", { detail: null, bubbles: true }),
        );
      }, 0);
    });
  });
}
/** Coordina la operación wireNavigation de la interfaz de enfermería. */
function wireNavigation() {
  $$("[data-view]").forEach((button) =>
    button.addEventListener("click", () => {
      const view = button.dataset.view;
      $$(".view").forEach((node) =>
        node.classList.toggle("active", node.id === view),
      );
      $$(".sidebar [data-view]").forEach((node) =>
        node.classList.toggle("active", node.dataset.view === view),
      );
      $("#pageName").textContent = button.textContent
        .replace(/\d+/g, "")
        .trim();
      sessionStorage.setItem("gimmed:active-view", view);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }),
  );
}
/** Coordina la operación watchClinicalRevision de la interfaz de enfermería. */
async function watchClinicalRevision() {
  try {
    const result = await api("/api/revision");
    if (clinicalRevision === null) {
      clinicalRevision = result.revision;
      return;
    }
    if (result.revision !== clinicalRevision) {
      clinicalRevision = result.revision;
      if (clinicalFormDirty)
        toast(
          "Hay nuevas actualizaciones clínicas. Guarda o limpia el formulario para recargar.",
        );
      else refreshCurrentView(0);
    }
  } catch (_error) {
    /* La siguiente consulta vuelve a intentar la sincronización. */
  }
}
/** Coordina la operación formPayload de la interfaz de enfermería. */
function formPayload(form) {
  const data = Object.fromEntries(new FormData(form));
  data.modulo = form.dataset.module;
  return data;
}
/** Guarda los cambios de la interfaz de enfermería. */
async function saveSimpleClinicalForm(form) {
  const patientId = $("input[name=expediente]", form)?.value;
  if (!patientId) {
    toast("Selecciona un paciente registrado antes de guardar.");
    return;
  }
  try {
    const result = await api("/api/registros", {
      method: "POST",
      body: JSON.stringify(formPayload(form)),
    });
    toast(
      `${result.message} ${result.registro.fecha_sistema} · ${result.registro.hora_sistema}`,
    );
    clinicalFormDirty = false;
    form.reset();
    renderSystemStamps();
    refreshCurrentView();
  } catch (error) {
    toast(error.message);
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  wireNavigation();
  injectPatientFields();
  renderSystemStamps();
  const savedView = sessionStorage.getItem("gimmed:active-view");
  if (savedView) $(`.sidebar [data-view="${savedView}"]`)?.click();
  document.addEventListener("input", (event) => {
    if (event.target.closest?.(".clinical-form")) clinicalFormDirty = true;
  });
  document.addEventListener("reset", () => {
    clinicalFormDirty = false;
  });
  try {
    currentProfile = await api("/api/perfil");
    renderChrome();
  } catch (error) {
    toast(error.message);
  }
  watchClinicalRevision();
  setInterval(renderSystemStamps, 30000);
  setInterval(watchClinicalRevision, 10000);
});
