/* Recupera sesión y datos desde SQLite antes de ejecutar los módulos administrativos. */
(function(){
  const read = url => { const xhr = new XMLHttpRequest(); xhr.open('GET',url,false); xhr.send(); return xhr.status===200 ? JSON.parse(xhr.responseText) : null; };
  const user = read('/api/session');
  if (!user) { location.replace('/'); return; }
  sessionStorage.setItem('gimmed_admin_session_v7',JSON.stringify({user:{id:user.accountId,name:user.displayName,username:user.username,role:user.role,status:'Activo'},accessId:Date.now()}));
  const state = read('/api/state');
  localStorage.setItem('gimmed_admin_vscode_v7',JSON.stringify(state || {}));
}());
