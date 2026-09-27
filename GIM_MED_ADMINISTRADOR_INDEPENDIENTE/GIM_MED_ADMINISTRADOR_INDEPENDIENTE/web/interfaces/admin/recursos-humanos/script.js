/* Código de la interfaz de administrador, tarea recursos humanos. Se carga desde el panel integrado según el rol. */
document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  GIMMEDCrud.init({
    active: "recursos-humanos",
    collection: "staff",
    title: "Recursos Humanos",
    description: "Administre expedientes laborales, contratos, horarios, vacaciones y salarios del personal.",
    singular: "empleado",
    unique: ["code", "idNumber", "email", "phone"],
    sync: GIMMED.syncEmployees,
    save: GIMMED.saveSharedEmployee,
    remove: GIMMED.deleteSharedEmployee,
    syncEvent: "gimmed:employees-synced",
    fields: [
      { key: "code", label: "ID único del empleado" },
      { key: "name", label: "Nombre completo" },
      { key: "idNumber", label: "Cédula / RUT" },
      { key: "rut", label: "RUT / identificación tributaria" },
      { key: "passport", label: "Pasaporte (escriba N/A si no aplica)" },
      { key: "birthDate", label: "Fecha de nacimiento", type: "date" },
      { key: "gender", label: "Género", type: "select", options: ["Femenino", "Masculino", "No especificado"] },
      { key: "email", label: "Correo electrónico", type: "email" },
      { key: "phone", label: "Teléfono", type: "tel" },
      { key: "address", label: "Dirección de residencia" },
      { key: "role", label: "Cargo", type: "select", options: ["Médico", "Enfermería", "Farmacéutico", "Personal administrativo", "Recepcionista", "Laboratorista", "Contador", "Recursos Humanos", "Paramédico", "Auxiliar clínico", "Mantenimiento"] },
      { key: "department", label: "Departamento" },
      { key: "specialties", label: "Especialidades asignadas" },
      { key: "contract", label: "Tipo de contrato", type: "select", options: ["Tiempo completo", "Medio tiempo", "Turno rotativo", "Servicios profesionales", "Temporal"] },
      { key: "startDate", label: "Fecha de ingreso", type: "date" },
      { key: "startTime", label: "Hora de entrada", type: "time" },
      { key: "endTime", label: "Hora de salida", type: "time" },
      { key: "workDays", label: "Días laborales" },
      { key: "daysOff", label: "Días libres" },
      { key: "vacationStart", label: "Inicio de vacaciones", type: "date" },
      { key: "vacationEnd", label: "Fin de vacaciones", type: "date" },
      { key: "salary", label: "Salario mensual (C$)", type: "number", step: "0.01" },
      { key: "status", label: "Estado laboral", type: "select", options: ["Activo", "Vacaciones", "Permiso", "Inactivo"] }
    ],
    columns: [
      { key: "code", label: "ID" }, { key: "name", label: "Empleado" }, { key: "role", label: "Cargo" },
      { key: "department", label: "Departamento" }, { key: "startTime", label: "Entrada" }, { key: "endTime", label: "Salida" },
      { key: "salary", label: "Salario", money: true }, { key: "status", label: "Estado" }
    ]
  });

  /** Coordina la operación isAdmin de la interfaz de administrador, tarea recursos humanos. */
  const isAdmin = () => GIMMED.session()?.user?.role === "Administrador";
  const userPanel = document.querySelector("#user-form-panel");
  const userForm = document.querySelector("#user-form");
  /** Controla la visualización o navegación de la interfaz de administrador, tarea recursos humanos. */
  function openUser(user) {
    if (!isAdmin()) return GIMMED.toast("Acción reservada al administrador.", "error");
    userForm.reset(); userForm.dataset.id = user?.id || "";
    if (user) ["name", "username", "email", "password", "role", "status"].forEach(key => { userForm.elements[key].value = user[key] || ""; });
    document.querySelector("#user-form-title").textContent = user ? "Editar usuario" : "Registrar usuario"; document.querySelector("#user-error").textContent = ""; userPanel.hidden = false;
  }
  /** Actualiza la pantalla de la interfaz de administrador, tarea recursos humanos con los datos disponibles. */
  function renderUsers() {
    const rows = GIMMED.getData().users;
    document.querySelector("#users-body").innerHTML = rows.map(user => `<tr><td>${GIMMED.escapeHTML(user.name)}</td><td>${GIMMED.escapeHTML(user.username)}</td><td>${GIMMED.escapeHTML(user.email)}</td><td>${GIMMED.escapeHTML(user.role)}</td><td><span class="status-badge">${GIMMED.escapeHTML(user.status)}</span></td><td><button class="secondary-button edit-user" data-id="${user.id}">Editar</button> ${user.username === "adm123" ? "" : `<button class="danger-button remove-user" data-id="${user.id}">Eliminar</button>`}</td></tr>`).join("");
    document.querySelectorAll(".edit-user").forEach(button => button.addEventListener("click", () => openUser(rows.find(user => user.id === Number(button.dataset.id)))));
    document.querySelectorAll(".remove-user").forEach(button => button.addEventListener("click", () => { if (!isAdmin() || !confirm("¿Eliminar este usuario?")) return; GIMMED.update(data => { data.users = data.users.filter(user => user.id !== Number(button.dataset.id)); }, "Usuario eliminado", "Recursos Humanos"); renderUsers(); }));
  }
  document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab === button)); document.querySelector("#staff-tab").hidden = button.dataset.tab !== "staff"; document.querySelector("#users-tab").hidden = button.dataset.tab !== "users"; document.querySelector("#user-restricted").hidden = isAdmin(); document.querySelector("#new-user").hidden = !isAdmin(); renderUsers(); }));
  document.querySelector("#new-user").addEventListener("click", () => openUser()); document.querySelector("#cancel-user").addEventListener("click", () => { userPanel.hidden = true; });
  userForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!userForm.reportValidity()) return;
    const errorBox = document.querySelector("#user-error"), values = GIMMED.formObject(userForm);
    errorBox.textContent = "";
    if (!isAdmin()) { errorBox.textContent = "Acción reservada al administrador."; return; }
    const record = { id: Number(userForm.dataset.id || Date.now()), name: values.name.trim(), username: values.username.trim(), email: values.email.trim(), password: values.password, role: values.role, status: values.status };
    const data = GIMMED.getData(), duplicate = GIMMED.unique(data.users, record, ["username", "email"]);
    if (duplicate) { errorBox.textContent = duplicate; return; }
    const editing = Boolean(userForm.dataset.id);
    if (!editing) {
      try {
        const response = await fetch("/api/admin/users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({displayName:record.name,username:record.username,role:record.role,temporaryPassword:record.password}) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { errorBox.textContent = payload.message || "No fue posible crear la cuenta."; return; }
      } catch { errorBox.textContent = "No fue posible conectar con el servicio de cuentas."; return; }
    }
    GIMMED.update(store => { const index = store.users.findIndex(user => user.id === record.id); if (index >= 0) store.users[index] = record; else store.users.unshift(record); }, `Usuario guardado: ${record.username}`, "Recursos Humanos");
    userPanel.hidden = true; renderUsers(); GIMMED.toast(editing ? "Usuario actualizado correctamente." : "Cuenta creada correctamente.");
  });
  document.querySelector("#sync-payroll").addEventListener("click", () => { GIMMED.update(data => { data.payroll = data.staff.filter(item => item.status === "Activo").map(item => { const salary = Number(item.salary), inss = salary * .07, annualBase = Math.max((salary - inss) * 12, 0), annualIr = annualBase <= 100000 ? 0 : annualBase <= 200000 ? (annualBase - 100000) * .15 : annualBase <= 350000 ? 15000 + (annualBase - 200000) * .20 : annualBase <= 500000 ? 45000 + (annualBase - 350000) * .25 : 82500 + (annualBase - 500000) * .30, ir = annualIr / 12, deductions = inss + ir; return { id: item.id, employee: item.name, date: GIMMED.today(), period: GIMMED.today().slice(0, 7), salary, inss, ir, deductions, net: salary - deductions }; }); }, "Personal sincronizado con la planilla", "Recursos Humanos"); GIMMED.toast("Salarios sincronizados con la planilla."); });
  renderUsers();
});
