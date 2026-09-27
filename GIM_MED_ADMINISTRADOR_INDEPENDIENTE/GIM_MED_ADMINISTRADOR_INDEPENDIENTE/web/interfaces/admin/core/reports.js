/* Código de la interfaz de administrador. Se carga desde el panel integrado según el rol. */
(function(){
  "use strict";
  /** Convierte datos al formato que necesita la interfaz de administrador. */
  const formatValue=(column,value)=>column.money?GIMMED.money(value):column.date?GIMMED.formatDate(value):String(value??"");
  /** Prepara el estado y los eventos necesarios al abrir la tarea. */
  function init(config){
    GIMMED.requireAuth();GIMMED.shell(config.active);GIMMED.trackActivity();
    document.querySelector("#report-title").textContent=config.title;document.querySelector("#report-description").textContent=config.description;
    /** Actualiza la pantalla de la interfaz de administrador con los datos disponibles. */
    const render=()=>{const data=GIMMED.getData(),term=document.querySelector("#report-search").value.toLowerCase().trim(),rows=config.rows(data).filter(row=>JSON.stringify(row).toLowerCase().includes(term));
      document.querySelector("#report-stats").innerHTML=config.stats(data).map(([label,value],index)=>`<article class="stat-card ${index===0?"featured":""}"><small>${GIMMED.escapeHTML(label)}</small><strong>${GIMMED.escapeHTML(value)}</strong></article>`).join("");
      document.querySelector("#report-head").innerHTML=`<tr>${config.columns.map(column=>`<th>${GIMMED.escapeHTML(column.label)}</th>`).join("")}</tr>`;
      document.querySelector("#report-body").innerHTML=rows.length?rows.map(row=>`<tr>${config.columns.map(column=>`<td>${GIMMED.escapeHTML(formatValue(column,row[column.key]))}</td>`).join("")}</tr>`).join(""):`<tr><td class="empty" colspan="${config.columns.length}">No hay resultados para este reporte.</td></tr>`;
      document.querySelector("#report-count").textContent=`${rows.length} resultado${rows.length===1?"":"s"}`;
    };
    document.querySelector("#report-search").addEventListener("input",render);document.querySelector("#report-pdf").addEventListener("click",()=>GIMMED.printPDF(config.title));window.addEventListener("gimmed:patients-synced",render);window.addEventListener("gimmed:employees-synced",render);render();void Promise.all([GIMMED.syncPatients(),GIMMED.syncEmployees()]);
  }
  window.GIMMEDReports={init};
})();
