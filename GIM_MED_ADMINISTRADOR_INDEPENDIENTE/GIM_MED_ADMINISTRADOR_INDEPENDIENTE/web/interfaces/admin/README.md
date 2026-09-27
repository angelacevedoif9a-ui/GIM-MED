# GIM-MED — Administración completa

Sistema web modular para la administración de la Clínica Privada Osorio. Está desarrollado con HTML5, CSS3 y JavaScript sin dependencias externas. El archivo principal solicitado es `Admin.html`.

## Estructura profesional

```text
Admin/
├── Admin.html                    # Archivo principal: login y dashboard
├── index.html                    # Redirección automática a Admin.html
├── style.css                     # Diseño global y responsivo
├── script.js                     # Login, dashboard y gráficas
├── README.md
├── assets/
│   └── logo-gimmed.jpeg
├── core/
│   ├── store.js                  # Datos, sesión, roles, respaldo y navegación
│   ├── crud.js                   # Motor reutilizable de registros
│   └── reports.js                # Motor reutilizable de reportes
├── recursos-humanos/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── pacientes/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── especialidades/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── citas/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── inventario/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── facturacion/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── planilla/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── reportes/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── reportes-pacientes/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── reportes-personal/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── reportes-citas/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── reportes-ingresos/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── reporte-transversal/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── configuracion/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── seguridad/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── control-acceso/
    ├── index.html
    ├── style.css
    └── script.js
```

## Cómo visualizar en Visual Studio Code

1. Descomprima el archivo ZIP.
2. Abra la carpeta `Admin` en Visual Studio Code.
3. Instale la extensión **Live Server**.
4. Abra `Admin.html`.
5. Presione el botón **Go Live** o seleccione **Open with Live Server**.

Alternativamente, abra una terminal en la carpeta que contiene `Admin` y ejecute:

```bash
python -m http.server 5500
```

Luego visite:

```text
http://localhost:5500/Admin/Admin.html
```

## Credencial inicial

```text
Usuario: adm123
Contraseña: configurada en el acceso administrativo integrado
```

El administrador puede crear otras cuentas desde **Recursos Humanos → Usuarios y accesos**.

## Actividades incorporadas

- Login por usuario, contraseña, rol, estado y permisos de módulo.
- Dashboard con gráficas de pacientes, personal e ingresos.
- Notificaciones interactivas de citas, inventario y respaldos.
- Recursos Humanos con datos personales, RUT, pasaporte, contacto, especialidades, contrato, horario, días libres, vacaciones, salario y estado.
- Registro de usuarios autorizado por la sesión administrativa activa, sin solicitar nuevamente la contraseña del administrador.
- Prevención de duplicados de ID, cédula/RUT, correo y teléfono.
- Expediente médico longitudinal con antecedentes, alertas, signos vitales, examen físico, CIE-10, diagnósticos anteriores, tratamiento, indicaciones, estudios y seguimiento.
- Gestión de especialidades, citas e inventario farmacéutico.
- Factura con múltiples conceptos, cantidad, precio, descuento, IVA, total, guardado, historial y selección de 1 a 20 copias para impresión.
- Planilla con INSS, IR progresivo, vista previa, fecha, período, tabla de porcentajes e historial recuperable.
- Centro analítico y reportes PDF separados de pacientes, personal, citas, ingresos y Administración–Farmacia.
- Configuración institucional de la clínica.
- Control de acceso con entrada, última interacción, salida, tiempo activo, horario y horas extra estimadas.
- Copia de seguridad manual y automática diaria a las 9:00 p. m., con restauración y máximo de 30 copias.
- Diseño limpio y responsivo para computadora, tableta y teléfono.

## Persistencia y seguridad

La versión para Visual Studio Code funciona sin servidor y guarda los datos en `localStorage`; la sesión activa usa `sessionStorage`. El respaldo automático se ejecuta a las 9:00 p. m. cuando la aplicación está abierta o al abrirla después de esa hora.

Para utilizar datos médicos reales en producción se debe conectar un backend, SQL Server, cifrado, contraseñas con hash, permisos verificados por el servidor, auditoría inmutable y respaldos externos. Esta edición es un prototipo académico funcional.
