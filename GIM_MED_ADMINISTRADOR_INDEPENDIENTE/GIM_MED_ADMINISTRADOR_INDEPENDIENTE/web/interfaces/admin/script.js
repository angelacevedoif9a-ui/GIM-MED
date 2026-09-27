/* Código de la interfaz de administrador. Se carga desde el panel integrado según el rol. */
(function () {
  "use strict";
  const loginView = document.querySelector("#login-view");
  const adminView = document.querySelector("#admin-view");
  const loginForm = document.querySelector("#login-form");

  /** Obtiene el contexto gráfico necesario para dibujar el panel. */
  function canvasContext(id) {
    const canvas = document.querySelector(id); if (!canvas) return null;
    const width = Math.max(canvas.parentElement.clientWidth - 44, 320); const height = 300; const ratio = devicePixelRatio || 1;
    canvas.width = width * ratio; canvas.height = height * ratio; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d"); context.scale(ratio, ratio); context.clearRect(0, 0, width, height); return { context, width, height };
  }
  /** Dibuja las barras de un gráfico de indicadores. */
  function drawBars(id, labels, values, formatter = value => String(value)) {
    const chart = canvasContext(id); if (!chart) return; const { context: ctx, width, height } = chart;
    const dark=document.documentElement.classList.contains("gimmed-theme-dark"),ink=dark?"#e3edf1":"#173247",muted=dark?"#a9bdc7":"#698092",line=dark?"#315063":"#e3ebef";
    const left = 45, right = 18, bottom = 48, top = 25, max = Math.max(...values, 1), area = width - left - right, gap = area / Math.max(values.length, 1), bar = Math.min(52, gap * .55);
    ctx.font = "11px Segoe UI"; ctx.textAlign = "center"; ctx.strokeStyle = line; ctx.fillStyle = muted;
    for (let line = 0; line <= 4; line += 1) { const y = top + (height - top - bottom) * line / 4; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke(); }
    values.forEach((value, index) => { const x = left + gap * index + gap / 2; const h = (height - top - bottom) * value / max; const y = height - bottom - h; const gradient = ctx.createLinearGradient(0, y, 0, height - bottom); gradient.addColorStop(0, "#079f86"); gradient.addColorStop(1, "#168fb1"); ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(x - bar / 2, y, bar, h, [8, 8, 0, 0]); ctx.fill(); ctx.fillStyle = ink; ctx.fillText(formatter(value), x, Math.max(y - 8, 12)); ctx.fillStyle = muted; ctx.fillText(labels[index], x, height - 22); });
  }
  /** Dibuja un gráfico circular de indicadores. */
  function drawDonut(id, labels, values) {
    const chart = canvasContext(id); if (!chart) return; const { context: ctx, width, height } = chart; const colors = ["#079f86", "#168fb1", "#0d304a", "#66cdb8", "#e2a43a", "#8b5cf6"]; const actualTotal = values.reduce((sum, value) => sum + value, 0); const total = actualTotal || 1; const cx = Math.min(width * .34, 205), cy = 145, radius = 88; let start = -Math.PI / 2;
    const dark=document.documentElement.classList.contains("gimmed-theme-dark"),ink=dark?"#e3edf1":"#0d304a",muted=dark?"#a9bdc7":"#698092";
    values.forEach((value, index) => { const end = start + Math.PI * 2 * value / total; ctx.beginPath(); ctx.arc(cx, cy, radius, start, end); ctx.arc(cx, cy, 48, end, start, true); ctx.closePath(); ctx.fillStyle = colors[index % colors.length]; ctx.fill(); start = end; });
    ctx.textAlign = "center"; ctx.fillStyle = ink; ctx.font = "bold 25px Segoe UI"; ctx.fillText(String(actualTotal), cx, cy + 4); ctx.font = "11px Segoe UI"; ctx.fillStyle = muted; ctx.fillText("trabajadores", cx, cy + 23);
    ctx.textAlign = "left"; labels.forEach((label, index) => { const x = width * .62, y = 70 + index * 34; ctx.fillStyle = colors[index % colors.length]; ctx.fillRect(x, y - 9, 12, 12); ctx.fillStyle = muted; ctx.font = "11px Segoe UI"; ctx.fillText(`${label}: ${values[index]}`, x + 20, y + 1); });
  }
  /** Coordina la operación monthLabel de la interfaz de administrador. */
  function monthLabel(date) { return new Intl.DateTimeFormat("es-NI", { month: "short" }).format(date).replace(".", ""); }
  /** Coordina la operación lastSixMonths de la interfaz de administrador. */
  function lastSixMonths(rows, dateKey, value) { const now = new Date(); const periods = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)); return { labels: periods.map(monthLabel), values: periods.map(period => rows.filter(row => { const date = new Date(`${row[dateKey]}T12:00:00`); return date.getFullYear() === period.getFullYear() && date.getMonth() === period.getMonth(); }).reduce((sum, row) => sum + (value ? Number(row[value] || 0) : 1), 0)) }; }
  /** Actualiza la pantalla de la interfaz de administrador con los datos disponibles. */
  function renderDashboard() {
    const data = GIMMED.getData(); const paid = data.invoices.filter(item => item.status === "Pagada").reduce((sum, item) => sum + Number(item.amount), 0); const lowStock = data.inventory.filter(item => Number(item.stock) <= Number(item.minimum || 20)).length;
    const cards = [["Pacientes registrados", data.patients.length], ["Trabajadores", data.staff.length], ["Citas médicas", data.appointments.length], ["Ingresos pagados", GIMMED.money(paid)]];
    document.querySelector("#stats").innerHTML = cards.map(([label, value], index) => `<article class="stat-card ${index === 0 ? "featured" : ""}"><small>${label}</small><strong>${value}</strong>${index === 3 ? `<span>${data.invoices.length} facturas</span>` : index === 1 ? `<span>${data.staff.filter(item => item.status === "Activo").length} activos</span>` : index === 2 ? `<span>${data.appointments.filter(item => item.status === "Pendiente").length} pendientes</span>` : `<span>${lowStock} alertas de farmacia</span>`}</article>`).join("");
    document.querySelector("#activity-list").innerHTML = data.activity.length ? data.activity.slice(0, 10).map(item => `<div><span>●</span><p><b>${GIMMED.escapeHTML(item.action)}</b><small>${GIMMED.escapeHTML(item.module || "General")} · ${new Date(item.date).toLocaleString("es-NI")}</small></p></div>`).join("") : "<p>No hay actividad registrada.</p>";
    const patients = lastSixMonths(data.appointments, "date"); drawBars("#patients-chart", patients.labels, patients.values);
    const departments = [...new Set(data.staff.map(item => item.department).filter(Boolean))]; drawDonut("#staff-chart", departments, departments.map(department => data.staff.filter(item => item.department === department).length));
    const income = lastSixMonths(data.invoices.filter(item => item.status === "Pagada"), "date", "amount"); drawBars("#income-chart", income.labels, income.values, value => value >= 1000 ? `${Math.round(value / 1000)}k` : String(value));
  }
  /** Controla la visualización o navegación de la interfaz de administrador. */
  function showDashboard() { document.body.classList.remove("login-mode"); loginView.hidden = true; adminView.hidden = false; GIMMED.shell("dashboard"); GIMMED.trackActivity(); renderDashboard(); void Promise.all([GIMMED.syncPatients(),GIMMED.syncEmployees()]); }
  loginForm.addEventListener("submit", event => { event.preventDefault(); if (!loginForm.reportValidity()) return; const values = GIMMED.formObject(loginForm); if (GIMMED.login(values.username, values.password)) showDashboard(); else document.querySelector("#login-error").textContent = "Usuario, contraseña o estado de acceso incorrecto."; });
  addEventListener("resize", () => { if (!adminView.hidden) renderDashboard(); });
  addEventListener("gimmed:theme-changed", () => { if (!adminView.hidden) renderDashboard(); });
  addEventListener("gimmed:patients-synced", () => { if (!adminView.hidden) renderDashboard(); });
  addEventListener("gimmed:employees-synced", () => { if (!adminView.hidden) renderDashboard(); });
  if (GIMMED.session()) showDashboard();
})();
