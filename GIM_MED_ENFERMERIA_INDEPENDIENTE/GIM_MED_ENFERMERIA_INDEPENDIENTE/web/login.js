/* El mismo inicio de sesión en los tres módulos. Cada servidor valida su propia base. */
(async function () {
  const form = document.querySelector('#access-form');
  const error = document.querySelector('#error');
  const status = await fetch('/api/status').then(r => r.json());
  let setup = status.setup;
  const destination = `/interfaces/${status.section}/${status.section === 'admin' ? 'Admin.html' : 'index.html'}`;
  document.querySelector('#role-description').textContent = status.role.toLowerCase();
  document.title = `GIM-MED | ${status.role}`;
  if (setup) {
    document.querySelector('#login-title').textContent = 'Crear acceso inicial';
    document.querySelector('#login-intro').textContent = `Configure la primera cuenta de ${status.role}. Esta cuenta solo existe en esta base de datos.`;
    document.querySelector('#full-name-label').hidden = false;
    form.elements.displayName.required = true;
    form.elements.password.minLength = 8;
    document.querySelector('#submit').textContent = 'Crear cuenta';
  }
  document.querySelector('#toggle-password').addEventListener('click', () => {
    const input = form.elements.password;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); error.textContent = '';
    const button = document.querySelector('#submit'); button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const response = await fetch(setup ? '/api/setup' : '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo iniciar sesión.');
      if (setup) { location.reload(); return; }
      location.href = destination;
    } catch (problem) { error.textContent = problem.message; button.disabled = false; }
  });
}());
