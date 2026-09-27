/* El expediente médico funciona en su propia web sin mensajes al panel integrado. */
document.addEventListener('DOMContentLoaded', () => {
 document.querySelector('#logout-button').onclick = async () => { await fetch('/api/logout',{method:'POST'}); location.href='/'; };
 document.querySelector('#autonomous-directory').onsubmit = async event => {
  event.preventDefault(); const q=event.target.elements.q.value.trim();
  const data=await GIMMED.fetchJSON('/api/pacientes?nombre='+encodeURIComponent(q));
  const target=document.querySelector('#autonomous-history');
  target.innerHTML=data.patients.map(p=>`<article><b>${GIMMED.escape(p.full_name)}</b> · ${GIMMED.escape(p.file_number)} <button type="button" data-id="${p.id}">Ver historia</button></article>`).join('')||'<p>Sin pacientes.</p>';
  target.querySelectorAll('[data-id]').forEach(button=>button.onclick=async()=>{
   const record=await GIMMED.fetchJSON('/api/expedientes/'+button.dataset.id);
   target.innerHTML='<h2>'+GIMMED.escape(record.patient.full_name)+'</h2>'+record.records.map(r=>`<article><b>${GIMMED.escape(r.title)}</b><p>${GIMMED.escape(r.record_type)} · ${GIMMED.escape(r.created_at)}</p><p>${GIMMED.escape(r.summary)}</p></article>`).join('');
  });
 };
});
