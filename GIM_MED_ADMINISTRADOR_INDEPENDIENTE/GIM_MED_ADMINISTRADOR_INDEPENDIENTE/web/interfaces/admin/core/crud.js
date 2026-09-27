/* Código de la interfaz de administrador. Se carga desde el panel integrado según el rol. */
(function () {
  "use strict";
  /** Convierte caracteres especiales antes de insertar texto en HTML. */
  function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
  /** Obtiene o normaliza un valor del formulario. */
  function value(record, key) { return escapeHTML(record[key]); }
  /** Controla la visualización o navegación de la interfaz de administrador. */
  function openForm(config, record) {
    const form = document.querySelector("#record-form"); form.reset(); form.dataset.id = record?.id || "";
    config.fields.forEach(field => { const control = form.elements[field.key]; if (control) control.value = record ? String(record[field.key] ?? "") : (field.default || ""); });
    document.querySelector("#form-title").textContent = record ? `Editar ${config.singular}` : `Nuevo ${config.singular}`;
    document.querySelector("#form-panel").hidden = false; document.querySelector("#form-error").textContent = "";
  }
  /** Actualiza la pantalla de la interfaz de administrador con los datos disponibles. */
  function render(config) {
    const data = GIMMED.getData(); const search = document.querySelector("#search").value.toLowerCase();
    const rows = data[config.collection].filter(row => JSON.stringify(row).toLowerCase().includes(search));
    document.querySelector("#record-body").innerHTML = rows.length ? rows.map(row => `<tr>${config.columns.map(column => `<td>${column.money ? GIMMED.money(row[column.key]) : value(row,column.key)}</td>`).join("")}<td><button class="secondary-button edit" data-id="${row.id}">Editar</button> <button class="danger-button remove" data-id="${row.id}">Eliminar</button></td></tr>`).join("") : `<tr><td class="empty" colspan="${config.columns.length + 1}">No hay registros.</td></tr>`;
    document.querySelectorAll(".edit").forEach(button => button.addEventListener("click", () => openForm(config, data[config.collection].find(row => String(row.id) === String(button.dataset.id)))));
    document.querySelectorAll(".remove").forEach(button => button.addEventListener("click", async () => { if (!confirm("¿Eliminar este registro?")) return;const record=data[config.collection].find(row=>String(row.id)===String(button.dataset.id));try{if(typeof config.remove==="function")await config.remove(record);else GIMMED.update(current => current[config.collection] = current[config.collection].filter(row => String(row.id) !== String(button.dataset.id)), `Registro eliminado en ${config.title}`);render(config);}catch(error){GIMMED.toast(error.message||"No fue posible eliminar el registro.","error");} }));
  }
  /** Prepara el estado y los eventos necesarios al abrir la tarea. */
  function init(config) {
    GIMMED.requireAuth(); GIMMED.shell(config.active); GIMMED.trackActivity();
    document.querySelector("#page-title").textContent = config.title; document.querySelector("#page-description").textContent = config.description;
    document.querySelector("#record-head").innerHTML = `<tr>${config.columns.map(column => `<th>${column.label}</th>`).join("")}<th>Acciones</th></tr>`;
    document.querySelector("#form-fields").innerHTML = config.fields.map(field => `<label>${field.label} *${field.type === "select" ? `<select name="${field.key}" required>${field.options.map(option => `<option>${option}</option>`).join("")}</select>` : field.type === "textarea" ? `<textarea name="${field.key}" required></textarea>` : `<input name="${field.key}" type="${field.type || "text"}" ${field.step ? `step="${field.step}"` : ""} required>`}</label>`).join("");
    document.querySelector("#new-record").addEventListener("click", () => openForm(config)); document.querySelector("#cancel-form").addEventListener("click", () => document.querySelector("#form-panel").hidden = true);
    document.querySelector("#search").addEventListener("input", () => render(config));
    document.querySelector("#record-form").addEventListener("submit", async event => {
      event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const record = GIMMED.formObject(form); record.id = Number(form.dataset.id || Date.now());
      const previous=GIMMED.getData()[config.collection].find(row=>String(row.id)===String(record.id));if(previous?.sharedId)record.sharedId=previous.sharedId;
      const data = GIMMED.getData(); const error = GIMMED.unique(data[config.collection], record, config.unique || []); if (error) return document.querySelector("#form-error").textContent = error;
      try{if(typeof config.save==="function")await config.save(record);else GIMMED.update(current => { const index = current[config.collection].findIndex(row => row.id === record.id); if (index >= 0) current[config.collection][index] = record; else current[config.collection].unshift(record); }, `${config.singular} guardado`);document.querySelector("#form-panel").hidden = true;document.querySelector("#form-error").textContent="";render(config);GIMMED.toast(`${config.singular} guardado correctamente.`);}catch(saveError){document.querySelector("#form-error").textContent=saveError.message||"No fue posible guardar el registro.";}
    });
    document.querySelector("#print").addEventListener("click", () => { if (typeof config.onPrint === "function") config.onPrint(); else GIMMED.printPDF(config.title); });
    if(config.syncEvent)window.addEventListener(config.syncEvent,()=>render(config));render(config);if(typeof config.sync==="function")void config.sync();
  }
  window.GIMMEDCrud = { init };
})();
