/* Código de la interfaz de administrador. Se carga desde el panel integrado según el rol. */
(function () {
  "use strict";

  const DATA_KEY = "gimmed_admin_vscode_v7";
  const SESSION_KEY = "gimmed_admin_session_v7";
  const MODULES = ["recursos-humanos", "pacientes", "especialidades", "citas", "inventario", "facturacion", "planilla", "reportes", "reportes-pacientes", "reportes-personal", "reportes-citas", "reportes-ingresos", "reporte-transversal", "configuracion", "seguridad", "control-acceso"];
  const MENU = [
    { group: "GENERAL", items: [["dashboard", "Panel analítico", "Admin.html"]] },
    { group: "GESTIÓN DEL SISTEMA", items: [["recursos-humanos", "Recursos Humanos", "recursos-humanos/index.html"], ["pacientes", "Expedientes de pacientes", "pacientes/index.html"], ["especialidades", "Especialidades médicas", "especialidades/index.html"], ["citas", "Citas médicas", "citas/index.html"], ["inventario", "Inventario farmacéutico", "inventario/index.html"]] },
    { group: "GESTIÓN FINANCIERA", items: [["facturacion", "Facturación y pagos", "facturacion/index.html"], ["planilla", "Planilla IR e INSS", "planilla/index.html"]] },
    { group: "REPORTES", items: [["reportes", "Centro de reportes", "reportes/index.html"], ["reportes-pacientes", "Pacientes", "reportes-pacientes/index.html"], ["reportes-personal", "Personal médico", "reportes-personal/index.html"], ["reportes-citas", "Citas médicas", "reportes-citas/index.html"], ["reportes-ingresos", "Ingresos", "reportes-ingresos/index.html"], ["reporte-transversal", "Administración y farmacia", "reporte-transversal/index.html"]] },
    { group: "CONFIGURACIÓN Y SEGURIDAD", items: [["configuracion", "Configuración general", "configuracion/index.html"], ["seguridad", "Seguridad y respaldo", "seguridad/index.html"], ["control-acceso", "Control de acceso", "control-acceso/index.html"]] }
  ];
  const ROLE_MODULES = {
    "Administrador": MENU.flatMap(group => group.items.map(item => item[0])),
    "Farmacéutico": ["dashboard", "inventario", "reporte-transversal"],
    "Médico": ["dashboard", "pacientes", "especialidades", "citas", "reportes-pacientes", "reportes-citas"],
    "Enfermería": ["dashboard", "pacientes", "citas", "reportes-pacientes", "reportes-citas"],
    "Recepción": ["dashboard", "pacientes", "citas", "facturacion", "reportes-pacientes", "reportes-citas", "reportes-ingresos"],
    "Recursos Humanos": ["dashboard", "recursos-humanos", "planilla", "reportes-personal", "control-acceso"],
    "Facturación": ["dashboard", "facturacion", "reportes-ingresos"]
  };

  const seed = {
    users: [], staff: [], patients: [], diagnoses: [], specialties: [],
    appointments: [], inventory: [], invoices: [], payroll: [],
    payrollHistory: [], access: [], backups: [], activity: [],
    settings: { name: "Clínica Privada Osorio", ruc: "", phone: "", email: "", address: "", hours: "" }
  };

  /** Crea una copia independiente de los datos para poder modificarlos. */
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  /** Convierte caracteres especiales antes de insertar texto en HTML. */
  function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
  /** Consulta y prepara datos de la interfaz de administrador. */
  function getData() { try { return Object.assign(clone(seed), JSON.parse(localStorage.getItem(DATA_KEY) || "{}")); } catch (_) { return clone(seed); } }
  /** Guarda los cambios de la interfaz de administrador. */
  function saveData(data) {
    // Guardado completo antes de navegar a otro módulo: SQLite es la copia persistente.
    const snapshot = JSON.stringify(data);
    localStorage.setItem(DATA_KEY, snapshot);
    const request = new XMLHttpRequest();
    request.open('PUT','/api/state',false);
    request.setRequestHeader('Content-Type','application/json');
    request.send(snapshot);
    if (request.status !== 200) console.warn('No se pudo guardar el estado del panel en SQLite.');
  }
  /** Coordina la operación sharedPatient de la interfaz de administrador. */
  function sharedPatient(row, previous = {}) {
    const name = [row.firstName,row.secondName,row.lastName,row.secondLastName].filter(Boolean).join(" ");
    return Object.assign({}, previous, {
      id:Number(row.id), sharedId:Number(row.id), source:"database", code:row.patientCode||previous.code||"", fileNumber:row.fileNumber||previous.fileNumber||"",
      name, firstName:row.firstName||"", secondName:row.secondName||"", lastName:row.lastName||"", secondLastName:row.secondLastName||"",
      idNumber:row.identification||"", passport:row.passport||"", birthDate:row.birthDate||"", gender:row.gender||"", blood:row.bloodType||"", nationality:row.nationality||"", maritalStatus:row.maritalStatus||"", occupation:row.occupation||"", phone:row.phone||"", email:row.email||"", address:row.address||"",
      department:row.department||"",city:row.city||"",neighborhood:row.neighborhood||"",emergencyContact:row.emergencyContact||"",emergencyRelation:row.emergencyRelationship||"",emergencyPhone:row.emergencyPhone||"",insurance:row.insuranceProvider||"",policy:row.insurancePolicy||"",allergies:row.allergies||"",chronic:row.chronicConditions||"",medications:row.currentMedications||"",history:row.personalHistory||"",
      familyHistory:row.familyHistory||"", surgeries:row.surgicalHistory||"",vaccines:row.vaccines||"",habits:row.habits||"",disability:row.disability||"",observations:row.observations||"", status:row.status||"Activo"
    });
  }
  /** Coordina la operación splitName de la interfaz de administrador. */
  function splitName(patient) {
    const parts=String(patient.name||"").trim().split(/\s+/).filter(Boolean);
    return {firstName:patient.firstName||parts[0]||"",secondName:patient.secondName||"",lastName:patient.lastName||parts.slice(1).join(" ")||"Sin apellido",secondLastName:patient.secondLastName||""};
  }
  /** Coordina la operación sharedPayload de la interfaz de administrador. */
  function sharedPayload(patient) {
    return Object.assign(splitName(patient),{id:patient.sharedId||patient.id,patientCode:patient.code,fileNumber:patient.fileNumber,identification:patient.idNumber,passport:patient.passport,birthDate:patient.birthDate,gender:patient.gender,bloodType:patient.blood,nationality:patient.nationality,maritalStatus:patient.maritalStatus,occupation:patient.occupation,phone:patient.phone,email:patient.email,address:patient.address,department:patient.department,city:patient.city,neighborhood:patient.neighborhood,emergencyContact:patient.emergencyContact,emergencyRelationship:patient.emergencyRelation,emergencyPhone:patient.emergencyPhone,insuranceProvider:patient.insurance,insurancePolicy:patient.policy,status:patient.status,allergies:patient.allergies,chronicConditions:patient.chronic,currentMedications:patient.medications,personalHistory:patient.history,familyHistory:patient.familyHistory,surgicalHistory:patient.surgeries,vaccines:patient.vaccines,habits:patient.habits,disability:patient.disability,observations:patient.observations});
  }
  /** Actualiza o sincroniza el estado de la interfaz de administrador. */
  async function syncPatients() {
    try {
      const response=await fetch("/api/patients",{cache:"no-store"}),payload=await response.json();
      if(!response.ok)throw new Error(payload.message||"No fue posible consultar los pacientes.");
      const data=getData(),local=data.patients||[],serverIds=new Set(payload.patients.map(row=>Number(row.id)));
      const fromServer=payload.patients.map(row=>sharedPatient(row,local.find(item=>Number(item.sharedId||item.id)===Number(row.id))||{}));
      const localOnly=local.filter(item=>!item.sharedId&&!serverIds.has(Number(item.id))&&!fromServer.some(row=>row.idNumber&&item.idNumber&&normalize(row.idNumber)===normalize(item.idNumber)));
      data.patients=[...fromServer,...localOnly];saveData(data);window.dispatchEvent(new CustomEvent("gimmed:patients-synced"));return data.patients;
    } catch (error) { console.warn("No fue posible sincronizar pacientes",error);return getData().patients; }
  }
  /** Guarda los cambios de la interfaz de administrador. */
  async function saveSharedPatient(patient) {
    const editing=Boolean(patient.sharedId),response=await fetch("/api/patients",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sharedPayload(patient))});
    const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible guardar el paciente.");
    const saved=sharedPatient(payload.patient,patient),data=getData(),index=data.patients.findIndex(item=>item.id===patient.id||Number(item.sharedId)===saved.id);
    if(index>=0)data.patients[index]=saved;else data.patients.unshift(saved);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:patients-synced"));return saved;
  }
  /** Coordina la operación sharedEmployee de la interfaz de administrador. */
  function sharedEmployee(row, previous = {}) {
    return Object.assign({}, previous, {
      id:Number(row.id),sharedId:Number(row.id),source:"database",code:row.code||previous.code||"",name:row.name||[row.firstName,row.lastName].filter(Boolean).join(" "),
      firstName:row.firstName||"",lastName:row.lastName||"",idNumber:row.idNumber||"",rut:row.rut||"",passport:row.passport||"",birthDate:row.birthDate||"",
      gender:row.gender||"",email:row.email||"",phone:row.phone||"",address:row.address||"",role:row.role||"Sin cargo",department:row.department||"",
      specialties:row.specialties||"No aplica",contract:row.contract||"",startDate:row.startDate||"",startTime:row.startTime||"",endTime:row.endTime||"",
      workDays:row.workDays||"",daysOff:row.daysOff||"",vacationStart:row.vacationStart||"",vacationEnd:row.vacationEnd||"",salary:Number(row.salary||0),status:row.status||"Activo"
    });
  }
  /** Coordina la operación employeePayload de la interfaz de administrador. */
  function employeePayload(employee) {
    return {id:employee.sharedId||employee.id,code:employee.code,name:employee.name,firstName:employee.firstName,lastName:employee.lastName,idNumber:employee.idNumber,rut:employee.rut,passport:employee.passport,birthDate:employee.birthDate,gender:employee.gender,email:employee.email,phone:employee.phone,address:employee.address,role:employee.role,department:employee.department,specialties:employee.specialties,contract:employee.contract,startDate:employee.startDate,startTime:employee.startTime,endTime:employee.endTime,workDays:employee.workDays,daysOff:employee.daysOff,vacationStart:employee.vacationStart,vacationEnd:employee.vacationEnd,salary:employee.salary,status:employee.status};
  }
  /** Coordina la operación employeeRequest de la interfaz de administrador. */
  async function employeeRequest(employee) {
    const response=await fetch("/api/employees",{method:employee.sharedId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(employeePayload(employee))});
    const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible guardar el empleado.");return sharedEmployee(payload.employee,employee);
  }
  /** Actualiza o sincroniza el estado de la interfaz de administrador. */
  async function syncEmployees() {
    try {
      const response=await fetch("/api/employees",{cache:"no-store"}),payload=await response.json();if(!response.ok)throw new Error(payload.message||"No fue posible consultar los empleados.");
      const snapshot=getData(),local=snapshot.staff||[],server=payload.employees.map(row=>sharedEmployee(row,local.find(item=>Number(item.sharedId||item.id)===Number(row.id))||{}));
      const localOnly=local.filter(item=>!item.sharedId&&!server.some(row=>(row.code&&item.code&&normalize(row.code)===normalize(item.code))||(row.idNumber&&item.idNumber&&normalize(row.idNumber)===normalize(item.idNumber))||(row.email&&item.email&&normalize(row.email)===normalize(item.email))));
      const residual=[];
      for(const employee of localOnly){
        if(!employee.code||!employee.name||!employee.role){residual.push(employee);continue;}
        try{server.push(await employeeRequest(employee));}catch{residual.push(employee);}
      }
      const data=getData();data.staff=[...server,...residual];saveData(data);window.dispatchEvent(new CustomEvent("gimmed:employees-synced"));return data.staff;
    }catch(error){console.warn("No fue posible sincronizar empleados",error);return getData().staff;}
  }
  /** Guarda los cambios de la interfaz de administrador. */
  async function saveSharedEmployee(employee) {
    const saved=await employeeRequest(employee),data=getData(),index=data.staff.findIndex(item=>item.id===employee.id||Number(item.sharedId)===saved.id);
    if(index>=0)data.staff[index]=saved;else data.staff.unshift(saved);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:employees-synced"));return saved;
  }
  /** Elimina o limpia datos de la interfaz de administrador después de aplicar sus reglas. */
  async function deleteSharedEmployee(employee) {
    if(employee.sharedId){const response=await fetch("/api/employees?id="+encodeURIComponent(employee.sharedId),{method:"DELETE"}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible eliminar el empleado.");}
    const data=getData();data.staff=data.staff.filter(item=>item.id!==employee.id);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:employees-synced"));
  }
  /** Coordina la operación sharedMedication de la interfaz de administrador. */
  function sharedMedication(row, previous = {}) {
    return Object.assign({}, previous, {
      id:Number(row.id),sharedId:Number(row.id),source:"database",code:row.code||previous.code||"",medicine:row.name||"",presentation:row.presentation||"",
      lot:row.lot||"",stock:Number(row.stock||0),minimum:Number(row.minStock||0),cost:Number(row.unitCost||0),expiration:row.expiration||"",
      supplier:row.supplier||"",location:row.location||"",responsible:row.responsible||"",status:row.status||"Disponible"
    });
  }
  /** Coordina la operación medicationPayload de la interfaz de administrador. */
  function medicationPayload(medication) {
    return {id:medication.sharedId||medication.id,code:medication.code,name:medication.medicine,presentation:medication.presentation,lot:medication.lot,stock:medication.stock,minStock:medication.minimum,unitCost:medication.cost,expiration:medication.expiration,supplier:medication.supplier,location:medication.location,responsible:medication.responsible,status:medication.status};
  }
  /** Coordina la operación medicationRequest de la interfaz de administrador. */
  async function medicationRequest(medication) {
    const response=await fetch("/api/medications",{method:medication.sharedId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(medicationPayload(medication))});
    const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible guardar el producto.");return sharedMedication(payload.medication,medication);
  }
  /** Actualiza o sincroniza el estado de la interfaz de administrador. */
  async function syncInventory() {
    try {
      const response=await fetch("/api/medications",{cache:"no-store"}),payload=await response.json();if(!response.ok)throw new Error(payload.message||"No fue posible consultar el inventario.");
      const snapshot=getData(),local=snapshot.inventory||[],server=payload.medications.map(row=>sharedMedication(row,local.find(item=>Number(item.sharedId||item.id)===Number(row.id))||{}));
      const localOnly=local.filter(item=>!item.sharedId&&!server.some(row=>(row.code&&item.code&&normalize(row.code)===normalize(item.code))&&(row.lot&&item.lot&&normalize(row.lot)===normalize(item.lot))));
      const residual=[];
      for(const medication of localOnly){
        if(!medication.code||!medication.medicine||!medication.lot){residual.push(medication);continue;}
        try{server.push(await medicationRequest(medication));}catch{residual.push(medication);}
      }
      const data=getData();data.inventory=[...server,...residual];saveData(data);window.dispatchEvent(new CustomEvent("gimmed:inventory-synced"));return data.inventory;
    }catch(error){console.warn("No fue posible sincronizar el inventario",error);return getData().inventory;}
  }
  /** Guarda los cambios de la interfaz de administrador. */
  async function saveSharedMedication(medication) {
    const saved=await medicationRequest(medication),data=getData(),index=data.inventory.findIndex(item=>item.id===medication.id||Number(item.sharedId)===saved.id);
    if(index>=0)data.inventory[index]=saved;else data.inventory.unshift(saved);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:inventory-synced"));return saved;
  }
  /** Elimina o limpia datos de la interfaz de administrador después de aplicar sus reglas. */
  async function deleteSharedMedication(medication) {
    if(medication.sharedId){const response=await fetch("/api/medications?id="+encodeURIComponent(medication.sharedId),{method:"DELETE"}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible eliminar el producto.");}
    const data=getData();data.inventory=data.inventory.filter(item=>item.id!==medication.id);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:inventory-synced"));
  }
  /** Coordina la operación sharedAppointment de la interfaz de administrador. */
  function sharedAppointment(row, previous = {}) {
    const [datePart,timePart]=String(row.scheduledAt||"").split("T");
    return Object.assign({}, previous, {
      id:Number(row.id), sharedId:Number(row.id), source:"database",
      date:datePart||previous.date||"", time:(timePart||"").slice(0,5)||previous.time||"",
      patient:row.patientName||previous.patient||"", patientId:row.patientId||null,
      doctor:row.doctorName||previous.doctor||"", doctorId:row.doctorId||null,
      specialty:row.specialtyName||previous.specialty||"", specialtyId:row.specialtyId||null,
      reason:row.reason||"", status:row.status||"Pendiente", createdBy:row.createdBy||""
    });
  }
  /** Coordina la operación appointmentPayload de la interfaz de administrador. */
  function appointmentPayload(appointment) {
    return {id:appointment.sharedId||appointment.id,patientId:appointment.patientId||null,patientName:appointment.patient,doctorId:appointment.doctorId||null,doctorName:appointment.doctor,specialtyId:appointment.specialtyId||null,specialtyName:appointment.specialty,date:appointment.date,time:appointment.time,reason:appointment.reason,status:appointment.status};
  }
  /** Coordina la operación appointmentRequest de la interfaz de administrador. */
  async function appointmentRequest(appointment) {
    const response=await fetch("/api/appointments",{method:appointment.sharedId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(appointmentPayload(appointment))});
    const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible guardar la cita.");return sharedAppointment(payload.appointment,appointment);
  }
  /** Actualiza o sincroniza el estado de la interfaz de administrador. */
  async function syncAppointments() {
    try {
      const response=await fetch("/api/appointments",{cache:"no-store"}),payload=await response.json();if(!response.ok)throw new Error(payload.message||"No fue posible consultar las citas.");
      const snapshot=getData(),local=snapshot.appointments||[],server=payload.appointments.map(row=>sharedAppointment(row,local.find(item=>Number(item.sharedId||item.id)===Number(row.id))||{}));
      const localOnly=local.filter(item=>!item.sharedId);
      const residual=[];
      for(const appointment of localOnly){
        if(!appointment.date||!appointment.patient){residual.push(appointment);continue;}
        try{server.push(await appointmentRequest(appointment));}catch{residual.push(appointment);}
      }
      const data=getData();data.appointments=[...server,...residual];saveData(data);window.dispatchEvent(new CustomEvent("gimmed:appointments-synced"));return data.appointments;
    }catch(error){console.warn("No fue posible sincronizar las citas",error);return getData().appointments;}
  }
  /** Guarda los cambios de la interfaz de administrador. */
  async function saveSharedAppointment(appointment) {
    const saved=await appointmentRequest(appointment),data=getData(),index=data.appointments.findIndex(item=>item.id===appointment.id||Number(item.sharedId)===saved.id);
    if(index>=0)data.appointments[index]=saved;else data.appointments.unshift(saved);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:appointments-synced"));return saved;
  }
  async function deleteSharedAppointment(appointment) {
    if(appointment.sharedId){const response=await fetch("/api/appointments?id="+encodeURIComponent(appointment.sharedId),{method:"DELETE"}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible eliminar la cita.");}
    const data=getData();data.appointments=data.appointments.filter(item=>item.id!==appointment.id);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:appointments-synced"));
  }
  function sharedInvoice(row, previous = {}) {
    const lines=(row.items||[]).map((item,index)=>({id:item.id||index+1,description:item.description,quantity:Number(item.quantity),price:Number(item.unitPrice)}));
    return Object.assign({}, previous, {
      id:Number(row.id), sharedId:Number(row.id), source:"database", number:row.invoiceNumber,
      date:String(row.issuedAt||"").slice(0,10), patient:row.patientName||"", patientId:row.patientId||null,
      concept:lines.map(line=>line.description).join("; "), amount:Number(row.total||0),
      payment:row.paymentMethod||"Efectivo", status:row.status||"Pendiente", lines:lines.length?lines:previous.lines||[],
      discountRate:Number(previous.discountRate||0), taxRate:Number(previous.taxRate||0), issuedBy:row.issuedBy||""
    });
  }
  function invoicePayload(invoice) {
    const subtotal=invoice.lines.reduce((sum,line)=>sum+Number(line.quantity)*Number(line.price),0),discount=subtotal*Number(invoice.discountRate||0)/100,tax=(subtotal-discount)*Number(invoice.taxRate||0)/100;
    return {id:invoice.sharedId||invoice.id,patientId:invoice.patientId||null,patientName:invoice.patient,items:invoice.lines.map(line=>({description:line.description,quantity:line.quantity,unitPrice:line.price})),discount,tax,status:invoice.status,paymentMethod:invoice.payment,notes:invoice.notes||""};
  }
  async function invoiceRequest(invoice) {
    const editing=Boolean(invoice.sharedId);
    const response=await fetch("/api/invoices",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?{id:invoice.sharedId,status:invoice.status}:invoicePayload(invoice))});
    const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible guardar la factura.");return sharedInvoice(payload.invoice,invoice);
  }
  async function syncInvoices() {
    try {
      const response=await fetch("/api/invoices",{cache:"no-store"}),payload=await response.json();if(!response.ok)throw new Error(payload.message||"No fue posible consultar las facturas.");
      const snapshot=getData(),local=snapshot.invoices||[],server=payload.invoices.map(row=>sharedInvoice(row,local.find(item=>Number(item.sharedId||item.id)===Number(row.id))||{}));
      const localOnly=local.filter(item=>!item.sharedId);
      const data=getData();data.invoices=[...server,...localOnly];saveData(data);window.dispatchEvent(new CustomEvent("gimmed:invoices-synced"));return data.invoices;
    }catch(error){console.warn("No fue posible sincronizar las facturas",error);return getData().invoices;}
  }
  async function saveSharedInvoice(invoice) {
    const saved=await invoiceRequest(invoice),data=getData(),index=data.invoices.findIndex(item=>item.id===invoice.id||Number(item.sharedId)===saved.id);
    if(index>=0)data.invoices[index]=saved;else data.invoices.unshift(saved);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:invoices-synced"));return saved;
  }
  async function deleteSharedInvoice(invoice) {
    if(invoice.sharedId){const response=await fetch("/api/invoices?id="+encodeURIComponent(invoice.sharedId),{method:"DELETE"}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.message||"No fue posible eliminar la factura.");}
    const data=getData();data.invoices=data.invoices.filter(item=>item.id!==invoice.id);saveData(data);window.dispatchEvent(new CustomEvent("gimmed:invoices-synced"));
  }
  function update(mutator, action, module = "General") { const data = getData(); mutator(data); if (action) data.activity.unshift({ id: Date.now(), date: new Date().toISOString(), action, module }); data.activity = data.activity.slice(0, 100); saveData(data); return data; }
  function normalize(value) { return String(value || "").trim().toLowerCase().replace(/[\s()-]/g, ""); }
  function unique(collection, record, fields) { for (const field of fields) if (record[field] && collection.some(item => item.id !== record.id && normalize(item[field]) === normalize(record[field]))) return `Ya existe un registro con el mismo campo “${field}”.`; return ""; }
  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch (_) { return null; } }
  function rootPath() { return MODULES.some(name => location.pathname.includes(`/${name}/`)) ? "../" : ""; }
  function login(username, password) { const data = getData(); const user = data.users.find(item => item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password && item.status === "Activo"); if (!user) return false; const now = new Date().toISOString(); const access = { id: Date.now(), userId: user.id, user: user.name, username: user.username, email: user.email, role: user.role, login: now, lastActivity: now, logout: "", seconds: 0, status: "Activa" }; sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, accessId: access.id })); update(current => current.access.unshift(access), `Inicio de sesión: ${user.name}`, "Seguridad"); return true; }
  function requireAuth() { if (!session()) location.replace(rootPath() + "Admin.html"); }
  function allowed(active) { const current = session(); return Boolean(current && (ROLE_MODULES[current.user.role] || ["dashboard"]).includes(active)); }
  function logout() { const current = session(); if (current) update(data => { const row = data.access.find(item => item.id === current.accessId); if (row) { row.logout = new Date().toISOString(); row.status = "Cerrada"; } }, `Cierre de sesión: ${current.user.name}`, "Seguridad"); sessionStorage.removeItem(SESSION_KEY); fetch("/api/logout", {method:"POST", keepalive:true}).finally(() => location.replace("/")); }
  function money(value) { return new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO", minimumFractionDigits: 2 }).format(Number(value || 0)); }
  function formatDate(value) { if (!value) return "Sin fecha"; const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "long", year: "numeric" }).format(date); }
  function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function notifications(data) { const low = data.inventory.filter(item => Number(item.stock) <= Number(item.minimum || 20)); const pending = data.appointments.filter(item => ["Pendiente", "Confirmada", "Programada"].includes(item.status)); const messages = []; if (pending.length) messages.push(`${pending.length} cita(s) requieren seguimiento.`); if (low.length) messages.push(`${low.length} medicamento(s) presentan stock bajo.`); const last = data.backups?.[0]; messages.push(last ? `Último respaldo: ${new Date(last.date).toLocaleString("es-NI")}.` : "La copia automática está programada para las 9:00 p. m."); return messages; }
  function shell(active) {
    requireAuth(); const current = session(); const prefix = rootPath();
    if (!allowed(active)) { alert("Su rol no tiene permiso para abrir este módulo."); location.replace(prefix + "Admin.html"); return; }
    const data = getData(), notices = notifications(data), permitted = ROLE_MODULES[current.user.role] || ["dashboard"];
    const menuHTML = MENU.map(group => { const links = group.items.filter(item => permitted.includes(item[0])); if (!links.length) return ""; return `<section class="nav-group"><small>${group.group}</small>${links.map(([key, label, url]) => `<a class="${active === key ? "active" : ""}" href="${prefix}${url}">${escapeHTML(label)}</a>`).join("")}</section>`; }).join("");
    document.querySelector("#app-sidebar").innerHTML = `<div class="brand"><img src="${prefix}assets/logo-gimmed.jpeg" alt="Logo oficial GIM-MED"><div><b>GIM-MED</b><small>Gestión Integral Médica</small></div></div><nav>${menuHTML}</nav><small class="version">GIM-MED · Versión 7.0 completa</small>`;
    document.querySelector("#app-header").innerHTML = `<button class="menu-button" type="button" aria-label="Abrir menú">☰</button><div><small>${escapeHTML(current.user.role)}</small><strong>${escapeHTML(document.title.replace(" | GIM-MED", ""))}</strong></div><div class="header-user"><div class="notification-wrap"><button class="notification-button" type="button" aria-label="Abrir notificaciones">🔔 <b>${notices.length}</b></button><div class="notification-panel" hidden><strong>Notificaciones del sistema</strong>${notices.map(message => `<p>${escapeHTML(message)}</p>`).join("")}</div></div><span>${escapeHTML(current.user.name)}</span><button class="logout-button" type="button">Cerrar sesión</button></div>`;
    document.querySelector(".menu-button").addEventListener("click", () => document.body.classList.toggle("menu-open")); document.querySelector(".logout-button").addEventListener("click", logout); document.querySelector(".notification-button").addEventListener("click", () => { const panel = document.querySelector(".notification-panel"); panel.hidden = !panel.hidden; });
  }
  function printPDF(title) { const previous = document.title; document.title = title; window.print(); setTimeout(() => { document.title = previous; }, 500); }
  function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
  function toast(message, type = "success") { let box = document.querySelector("#global-toast"); if (!box) { box = document.createElement("div"); box.id = "global-toast"; document.body.appendChild(box); } box.className = `global-toast ${type}`; box.textContent = message; requestAnimationFrame(() => box.classList.add("visible")); clearTimeout(toast.timer); toast.timer = setTimeout(() => box.classList.remove("visible"), 3400); }
  function trackActivity() { const current = session(); if (!current || window.__gimmedTracking) return; window.__gimmedTracking = true; let last = Date.now(); ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(name => addEventListener(name, () => { last = Date.now(); }, { passive: true })); setInterval(() => { if (Date.now() - last > 120000) return; update(data => { const row = data.access.find(item => item.id === current.accessId); if (row) { row.seconds += 30; row.lastActivity = new Date().toISOString(); } }); }, 30000); }
  function scheduledBackup() { const now = new Date(); if (now.getHours() < 21) return; const day = today(), data = getData(); data.backups = data.backups || []; if (data.backups.some(item => item.day === day && item.type === "Automático")) return; const snapshot = JSON.stringify(Object.assign({}, data, { backups: [] })); data.backups.unshift({ id: Date.now(), day, date: now.toISOString(), type: "Automático", status: "Completado", records: Object.values(data).filter(Array.isArray).reduce((sum, rows) => sum + rows.length, 0), snapshot }); data.backups = data.backups.slice(0, 30); data.activity.unshift({ id: Date.now() + 1, date: now.toISOString(), action: "Copia de seguridad automática completada", module: "Seguridad" }); saveData(data); }
  scheduledBackup(); setInterval(scheduledBackup, 60000);
  window.GIMMED = { getData, saveData, update, unique, syncPatients, saveSharedPatient, syncEmployees, saveSharedEmployee, deleteSharedEmployee, syncInventory, saveSharedMedication, deleteSharedMedication, syncAppointments, saveSharedAppointment, deleteSharedAppointment, syncInvoices, saveSharedInvoice, deleteSharedInvoice, session, login, requireAuth, allowed, logout, shell, money, formatDate, today, printPDF, formObject, toast, trackActivity, scheduledBackup, escapeHTML, seed: clone(seed) };
})();
