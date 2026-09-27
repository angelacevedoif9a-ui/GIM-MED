/* Código de la interfaz de administrador, tarea configuracion. Se carga desde el panel integrado según el rol. */
(function(){
  "use strict";
  /** Busca el primer elemento del documento que coincide con el selector. */
  const $=selector=>document.querySelector(selector);
  document.addEventListener("DOMContentLoaded",()=>{
    GIMMED.requireAuth();GIMMED.shell("configuracion");GIMMED.trackActivity();
    const form=$("#settings-form"),settings=GIMMED.getData().settings;
    Object.entries(settings).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value||""});
    form.addEventListener("submit",event=>{event.preventDefault();if(!form.reportValidity())return;const values=GIMMED.formObject(form);GIMMED.update(data=>{data.settings=values},"Configuración institucional actualizada","Configuración");$("#settings-error").textContent="";GIMMED.toast("Configuración guardada correctamente.")});
  });
})();
